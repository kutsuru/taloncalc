/*** imports ***/
import { inject, Injectable } from "@angular/core";
import { INLINE_FUNCTIONS, InlineFunction } from "./inline.functions";
import { getItemTypeValue, getJobValue, getWeaponTypeValue } from "../rAthena/ra-utils";
import { createEmptySessionBonus, SESSION_INFO_DEFAULT } from "../session-info-default";
import { TTCoreServiceV3 } from "../tt-core.v3.service";
import { ASTNode, IfNode, TTItemScriptParser, VARB_PREFIX } from "./tt-itemscript-parser";
import { BaseStatsAs, DBJob, Element, MobRace, RefineLocations, SessionBonus, SessionEquip, SkillBuff } from "../tt-models.v3";
import { CardState, SESSION_EQUIP_DEFAULT } from "../tt-session-info.v3.service";
import { DefaultMap, parseDBElement, parseDBMobRace, parseDBMobSize } from "../utils";

/*** types ***/
export type BonusSubstitution = {
    'subSkillLvl': number,  /* level of the current skill */
}
type CustomBonusSubstitution = keyof BonusSubstitution;
export type LocalOptions = {
    refine?: number,       /* refine of current running equip or location of the card */
    customSubs?: BonusSubstitution
}
type ScriptValue = number | string | boolean;
type ScriptFunction = (...args: any[]) => any;
type SessionOptions = {
    equip: SessionEquip,
    cards: CardState
    refines: Record<RefineLocations, number>,
    baseStats: BaseStatsAs<number>,
    skills: SkillBuff[],
    isPVP: boolean,
    job?: DBJob,
}

/*** REGEX ***/
const MONSTER_RACE_REG = /RC_[a-zA-Z_]+/g;
const ELEMENT_REG = /Ele_[a-zA-Z]+/g;
const SIZE_REG = /Size_[a-zA-Z]+/g;
const VARB_REG = /\.@([a-zA-Z]+)/g;
const VARB_POST_REG = new RegExp(`(${VARB_PREFIX}[a-zA-Z]+)`, 'g');
const JOB_REG = /Job_\w+/g;
const BASE_CLASS_REG = /BaseClass/g;
const BASE_JOB_REG = /BaseJob/g;
const FUNC_REGEX = /(\w+)\(([^()]*)\)/g;
const WEAPON_TYPE_REGEX = /(?<![A-Za-z])W_\w+/g;
const ITEM_TYPE_REGEX = /(?<![A-Za-z])IT_[\w]+/g;

/*** definitions ***/
const CANONICAL_KEYS: Record<string, string> = {};
const BONUS_SPECIAL: Set<String> = new Set([
    'allStats', 'ignoreDefRace', 'atkEle'
]);
const BONUS_HIGHEST_ONLY = new Set([
    'speed', 'noCastCancel', 'noCastCancel2', 'noGemstone',
    'noSizeFix', 'noKnockback', 'fixedCastrate'
]);

const BONUS_FLAGS = new Set([
    'unbreakableWeapon', 'unbreakableArmor', 'unbreakableHelm',
    'unbreakableShield', 'unbreakableGarment', 'unbreakableShoes',
    'noStun', 'noFreezing', 'noStone', 'noSleep', 'noConfusion',
    'noCurse', 'noBlind', 'noPoison', 'noSilence', 'noBleeding',
    'defRatioAtkClass'  // FIXME: handle for every class?
]);
// FIXME: check if some is needed
const COMMAND_TO_INGORE = new Set([
    'itemheal', 'sc_end', 'getrandgroupitem', 'monster', 'percentheal',
    'produce', 'pet', 'bpet', 'guildgetexp', 'makepet',
    'delitem', 'getitem', 'soundeffectall', 'homevolution', 'cooking',
    'mercenary_create', 'mercenary_heal', 'mercenary_sc_start',
    'input', 'getexp2',
    'specialeffect2', 'unitskilluseid',   //FIXME: mabye needed?
    'setfont', 'heal', 'end', 'playbgm', 'getitembound', 'buyingstore',
    'warp', 'getgroupitem', 'setmounting', 'transform', 'makerune',
    'rentitem', 'hateffect', 'dispbottom', 'setlook', 'showscript',
    'announce'
]);
const COMMAND_CALL_FUNC_TO_IGNORE = new Set([
    'F_SQI', 'F_Reward_Credit', 'F_Cat_Hard_Biscuit', 'F_Rice_Weevil_Bug',
    'F_CashStore', 'F_CashPartyCall', 'F_CashReset', 'F_CashDungeon',
    'F_Snowball', 'F_CashTele', 'F_CashCity', 'F_CashSiegeTele',
    'F_GetForumBoundItem', 'F_ASPDBuffBG', 'F_SummerTreasure', 'F_SetForumVar',
    'F_LNY_Envelope', 'F_Hal_SecretItems', 'F_22507', 'F_Hal_Broomstick',
]);

/*** helper functions ***/
const transformKey = (key: string) => {
    let noramalized = key;
    if (noramalized.startsWith('b')) {
        /* bDefRate -> defRate */
        noramalized = noramalized.substring(1);
        noramalized = noramalized.charAt(0).toLowerCase() + noramalized.substring(1);
    }
    /* 
    - fixed data will be mapped as [<key in lowercase without b>] : <key in session object> 
    - if none is found, we just remove the leading "b" and lower the first letter
    */
    return CANONICAL_KEYS[noramalized.toLowerCase()] || noramalized;
};

/*** varbs ***/

/**
 * FIXME
 * bonus bDefRatioAtkClass,c;   make use of c (class) parameter
 * bonus bAtkEle,e;          	the player's attacks element e
 * bonus bDefEle,e;          	the player's defense element e
 * transform MabRace2
 * SC_ASPDPOTION0/1/2           Merge into one "custome" command?
 * set var,value                Handle as Assignment too
 */

/*** service ***/
@Injectable({ providedIn: 'root' })
export class TTBonusEngineService {
    /* injects */
    public readonly core = inject(TTCoreServiceV3);

    /* varbs */
    private _localVarbs: Map<string, number> = new Map();   //FIXME: allow more types? Use DefaultMap?
    private _localOpts: LocalOptions = {};  // is only valid for one "apply cycle"
    private _inlineFuncs: Map<string, InlineFunction> = new Map();
    public session: SessionBonus;
    public sessionOpts: SessionOptions;

    /* handlers */
    private readonly _cmdHandler: Record<string, (args: string[]) => void> = {
        bonus: (args) => this._computeBonus(args),
        bonus2: (args) => this._computeBonus2(args),
        bonus3: (args) => this._computeBonus3(args),
        sc_start: (args) => this._computeStatusEffectFunc(args),
        itemskill: (args) => this._computeItemSkill(args),
        set: (args) => this._computeSet(args),
        skill: (args) => this._computeSkill(args),
        autobonus: (args) => this._computeAutobonus(args),
        callfunc: (args) => this._computeCommandCallFunc(args),
        bonus_script: (args) => this._computeBonusScript(args),
        bonus4: (args) => this._computeBonus4(args),
        bonus5: (args) => this._computeBonus5(args),
        autobonus2: (args) => this._computeAutobonus2(args),
        autobonus3: (args) => this._computeAutobonus3(args),
        autobonus4: (args) => this._computeAutobonus4(args),
        sc_start4: (args) => this._computeStatusEffectFunc4(args),
        skilleffect: (args) => this._computeSkillEffect(args),
        sc_start2: (args) => this._computeStatusEffectFunc2(args)
    }

    /* debug */
    private _unknownEle: Map<string, string[]> = new Map();

    constructor() {
        /* initialize canonical keys */
        const emptyBonus = createEmptySessionBonus();
        /* all stats */
        for (let key in emptyBonus.stats) {
            CANONICAL_KEYS[key.toLowerCase()] = key;
        }

        /* all mappings */
        for (let key in emptyBonus) {
            if (key !== 'stats' && key !== 'flags') {
                CANONICAL_KEYS[key.toLowerCase()] = key;
            }
        }

        /* SC_START mappings */
        CANONICAL_KEYS['SC_STRFOOD'] = 'str';
        CANONICAL_KEYS['SC_AGIFOOD'] = 'agi';
        CANONICAL_KEYS['SC_VITFOOD'] = 'vit';
        CANONICAL_KEYS['SC_INTFOOD'] = 'int';
        CANONICAL_KEYS['SC_DEXFOOD'] = 'dex';
        CANONICAL_KEYS['SC_LUKFOOD'] = 'luk';
        CANONICAL_KEYS['SC_INCATKRATE'] = 'scIncAtkRate';
        CANONICAL_KEYS['SC_INCASPDRATE'] = 'aspdRate';

        /* save session */
        this.session = emptyBonus;
        // FIXME create default opts for this serivce
        this.sessionOpts = {
            baseStats: { ...SESSION_INFO_DEFAULT.baseStats },
            equip: SESSION_EQUIP_DEFAULT,
            skills: [],
            isPVP: false,
            refines: { armor: 0, garment: 0, leftHand: 0, rightHand: 0, shoes: 0, upperHg: 0 },
            cards: { armor: 0, garment: 0, leftHand: [0], rightHand: [0], shoes: 0, upperHg: 0, lhAccessory: 0, rhAccessory: 0, middleHg: 0 }
        }

        /* create static functions */
        for (const fnName in INLINE_FUNCTIONS) {
            this._inlineFuncs.set(fnName, INLINE_FUNCTIONS[fnName]);
        }
    }

    /*** public functions ***/
    public resetBonus(session: SessionBonus, opts: SessionOptions) {
        this.session = session;
        this.sessionOpts = opts;
    }
    public applyBonus(bonus: string, opts: LocalOptions = {}) {
        this._localOpts = opts;
        let bonusPrepared = this._prepareBonus(bonus, opts.customSubs);
        let parser = new TTItemScriptParser(bonusPrepared);
        let bonusAST = parser.parse();
        // console.log(bonusPrepared);
        // console.log(bonusAST);
        /* clear data local varbs (only valid for one bonus script) */
        this._localVarbs.clear();
        /* run script */
        this._evaluateNodes(bonusAST);
        /* reset local opts */
        this._localOpts = {};
    }
    // DEBUG
    public addUnknownEle(type: string, ele: string) {
        const group = this._unknownEle.get(type);
        if (!group) {
            this._unknownEle.set(type, []);
        }
        else if (!group.includes(ele)) {
            group.push(ele);
        }
    }
    public getUnknownElements(): string[] {
        const res: string[] = [];
        for (const [type, eles] of this._unknownEle) {
            res.push(`### ${type} ###`);
            res.push(...eles);
        }
        return res;
    }

    /*** private functions ***/
    private _getJobValue(mode: 'class' | 'baseClass' | 'baseJob'): number {
        let res = 0;
        if (this.sessionOpts.job) {
            const jobValue = getJobValue(this.sessionOpts.job[mode]);
            if (jobValue) {
                res = jobValue;
            }
        }
        return res;
    }
    private _evaluateNodes(nodes: ASTNode[]) {
        for (let node of nodes) {
            switch (node.type) {
                case 'Command':
                    this._computeCommand(node.command, node.args);
                    break;
                case 'Assignment':
                    this._computeAssignment(node.name, node.value);
                    break;
                case 'IfStatement':
                    this._computeIfStatement(node);
                    break;
            }
        }
    }
    private _prepareBonus(bonus: string, subs: Partial<BonusSubstitution> = {}): string {
        /* remove escaped " */
        let s = bonus.replace(/"/g, '');

        /* replace specifc commands with values */
        // mob race
        s = s.replace(MONSTER_RACE_REG, parseDBMobRace);
        // element
        s = s.replace(ELEMENT_REG, parseDBElement);
        // mob size
        s = s.replace(SIZE_REG, parseDBMobSize);
        // BaseClass
        s = s.replace(BASE_CLASS_REG, () => String(this._getJobValue('baseClass')));
        // BaseJob
        s = s.replace(BASE_JOB_REG, () => String(this._getJobValue('baseJob')));
        // Job_<JobName>
        s = s.replace(JOB_REG, (job) => {
            const val = getJobValue(job);
            return val?.toString() ?? '0';
        });
        // sqi_option_v3 (is used to trigger SQI bonus ingame)
        // FIXME: for items SN can use, this value needs to be diffrent
        s = s.replace(/sqi_option_v3/g, '32');
        // Weapon Type
        s = s.replace(WEAPON_TYPE_REGEX, (wT) => String(getWeaponTypeValue(wT)));
        // Item Type
        s = s.replace(ITEM_TYPE_REGEX, (iT) => String(getItemTypeValue(iT)));

        /* custom bonus substituions */
        for (const sub in subs) {
            if (!subs[sub]) continue;
            const replaceWith = subs[sub];
            const subReg = new RegExp(sub, 'g');    // make sure everything get replaced 
            s = s.replace(subReg, replaceWith);
        }

        /* replace variables */
        s = s.replace(VARB_REG, (_, name: string) => {
            return `${VARB_PREFIX}${name.charAt(0).toUpperCase()}${name.slice(1)}`;
        });


        return s;
    }

    private _computeIfStatement(ifNode: IfNode) {
        const condition = this._resolveExpr(ifNode.condition);

        if (this._isTruthy(condition)) {
            this._evaluateNodes(ifNode.then);
        }
        else if (ifNode.elseIf) {
            this._computeIfStatement(ifNode.elseIf);
        }
        else if (ifNode.else) {
            this._evaluateNodes(ifNode.else);
        }
    }

    private _computeCommand(command: string, args: string[]) {
        if (COMMAND_TO_INGORE.has(command)) return;

        const handler = this._cmdHandler[command];
        if (!handler) {
            this.addUnknownEle('command', command);
            throw new Error(`Unknown command ${command}`);
        }

        handler(args);
    }

    private _computeAssignment(name: string, value: string) {
        const result = this._resolveExpr(value) as number;
        this._localVarbs.set(name, result);
    }

    private _computeBonus(args: string[]) {
        // FIXME: check args length
        let bonusType = transformKey(args[0]);
        let valRaw = args[1];

        /* bonus with flags */
        if (BONUS_FLAGS.has(bonusType)) {
            this.session.flags[bonusType] = true;
            return;
        }

        /* look for special bonus */
        if (BONUS_SPECIAL.has(bonusType)) {
            /* we lowercase all initial chars of the bonus */
            switch (bonusType) {
                case "allStats":
                    const val = this._resolveExpr(valRaw) as number;
                    this.session.stats.str += val;
                    this.session.stats.agi += val;
                    this.session.stats.dex += val;
                    this.session.stats.int += val;
                    this.session.stats.vit += val;
                    this.session.stats.luk += val;
                    break;
                case 'ignoreDefRace':
                    /* val is MobRace */
                    this.session.ignoreDefRace.set(valRaw as MobRace, true);
                    break;
                case 'atkEle':
                    /* val is Element */
                    this.session.stats.atkEle = valRaw as Element;
                    break;
                default:
                    console.log("Special bonus type not implemented", bonusType, args);
            }
            return;
        }

        /* from here all types will have with value */
        const val = this._resolveExpr(valRaw) as number;

        if (BONUS_HIGHEST_ONLY.has(bonusType)) {
            this.session.stats[bonusType] = Math.max(this.session.stats[bonusType] || 0, val);
        }
        else if (bonusType in this.session.stats) {
            this.session.stats[bonusType] += val;
        }
        else {
            this.addUnknownEle('bonus', bonusType);
            throw new Error(`Unknown bonus type ${bonusType} with ${args}`);
        }
    }

    private _computeBonus2(args: string[]) {
        let [bonusTypeRaw, key, valRaw] = args;
        const bonusType = transformKey(bonusTypeRaw);

        //FIXME: check for args length
        let value = this._resolveExpr(valRaw) as number;

        /* check if bonusType is present in session */
        if (bonusType in this.session) {
            console.log(bonusType);
            const map = (this.session[bonusType] as DefaultMap<any, number>);
            map.set(key, map.get(key) + value);
            return;
        }
        else {
            this.addUnknownEle('bonus2', bonusType);
            throw new Error(`Unknown bonus type ${bonusType} with ${args}`);
        }
    }

    private _computeBonus3(args: string[]) {
        console.log('Bonus3', args);
    }

    private _computeBonus4(args: string[]) {
        console.log('Bonus4', args);
    }

    private _computeBonus5(args: string[]) {
        console.log('Bonus5', args);
    }

    private _computeAutobonus2(args: string[]) {
        console.log('Autobonus2', args);
    }

    private _computeAutobonus3(args: string[]) {
        console.log('Autobonus3', args);
    }

    private _computeAutobonus4(args: string[]) {
        console.log('Autobonus4', args);
    }

    private _computeStatusEffectFunc2(args: string[]) {
        console.log('SC_START2', args);
    }

    private _computeStatusEffectFunc4(args: string[]) {
        console.log('SC_START4', args);
    }

    private _computeSkillEffect(args: string[]) {
        console.log('Skill effect', args);
    }

    private _computeStatusEffectFunc(args: string[]) {
        if (args.length < 3) {
            console.log('Invalud SC_START script');
            console.log(args);
            return;
        }
        // FIXME: same for all?
        let func = args[0];
        let duration = +args[1];
        let value = +args[2];
        switch (func) {
            /* fetch stats */
            case 'SC_STRFOOD':
            case 'SC_AGIFOOD':
            case 'SC_VITFOOD':
            case 'SC_INTFOOD':
            case 'SC_DEXFOOD':
            case 'SC_LUKFOOD':
            case 'SC_INCATKRATE':
            case 'SC_INCASPDRATE':
                this.session.stats[CANONICAL_KEYS[func]] += value;
                break;
            /* others */
            case 'SC_ASPDPOTION0':
                this.session.stats.aspdRate += 10;
                break;
            case 'SC_ASPDPOTION1':
                this.session.stats.aspdRate += 15;
                break;
            case 'SC_ASPDPOTION2':
                this.session.stats.aspdRate += 20;
                break;
            case 'SC_ASPDPOTION3':
                this.session.stats.aspdRate += 25;
            default:
                this.addUnknownEle('sc_start', func);
            // throw new Error(`Unknown SC_START function ${func}`);
        }
    }

    // FIXME: implment me
    private _computeItemSkill(args: string[]) {
        console.log('Item skill', args);
    }

    // FIXME
    private _computeSet(args: string[]) {
        const [name, valRaw] = args;
        // const value = this._resolveExpr(valRaw);
        console.log('Set ', name, ' with ', valRaw);
    }
    // FIXME: add skills to list of available skills?
    private _computeSkill(args: string[]) {
        console.log('Skill', args);
    }
    // FIXME: add autobonus to session and allow user to manuelly enable it?
    private _computeAutobonus(args: string[]) {
        console.log('Autobonus', args);
    }
    // FIXME: handle the functions
    private _computeCommandCallFunc(args: string[]) {
        /* remove () if present and only use first arg(all is there) */
        let argsExt = args[0].replace(/[()]/g, '').split(',');
        const fnName = argsExt.shift()!;
        if (COMMAND_CALL_FUNC_TO_IGNORE.has(fnName)) return;

        switch (fnName) {
            default:
                this.addUnknownEle('commandCallFunc', fnName);
                throw new Error('Unknown callfunc ' + fnName);
        }
    }
    // FIXME: this needs antoher AST parsing and handling
    private _computeBonusScript(args: string[]) {
        console.log('Bonus-Script', args);
    }

    // FIXME: return type as generic?
    private _resolveExpr(expression: string): ScriptValue {
        // console.log('Resolve', expression);
        expression = expression.trim();

        /* 1) return pure numbers directly */
        if (/^-?\d+(\.\d+)?$/.test(expression)) return Number(expression);

        expression = expression.replace(/ /g, '');
        /* 2) look for function calls */
        let previousExpr: string;
        let iterations = 0;
        const MAX_ITERATIONS = 100; // protections for endless-loops

        // we loop from in to out (inner first)
        do {
            previousExpr = expression;
            expression = expression.replace(FUNC_REGEX, (_, name: string, argsRaw: string) => {
                const fn = this._inlineFuncs.get(name);
                if (!fn) {
                    this.addUnknownEle('func', name);
                    throw new Error(`Unknown function: ${name}`);
                }

                const args = argsRaw
                    ? argsRaw.split(/\s*,\s*/).map(arg => {
                        try {
                            return this._resolveExpr(arg)
                        }
                        catch { }
                        /* return as string */
                        return String(arg);
                    })
                    : [];

                return String(fn(this, this._localOpts, ...args));
            });

            if (++iterations >= MAX_ITERATIONS) {
                throw new Error(`Resolver: maximale Iterationen erreicht für: ${expression}`);
            }

        } while (expression !== previousExpr); // repeat until all functions are resolved

        /* 3) look for local varbs */
        expression = expression.replace(VARB_POST_REG, (_, name) => {
            return String(this._localVarbs.get(name) ?? 0);
        });

        /* 4) Only allow numbers and operators */
        if (!/^([\d\s+\-*\/()%&|<>=!.:?]|true|false)+$/.test(expression)) {
            throw new Error(`Unsafe expression: ${expression}`);
        }

        /* 5) (safe) eval expression */
        console.log('Expr. to eval ', expression);
        const result = Function(`"use strict"; return (${expression});`)();
        return typeof result === 'boolean' ? result : Number(result);
        // 2. Spezial-Behandlung für die Job-Hierarchie (Sniper/Archer)
        // Wir transformieren "BaseClass == Job_Archer" in einen Funktionsaufruf.
        // if (expression.includes("BaseClass")) {
        //     expression = expression.replace(/BaseClass\s*==\s*([a-zA-Z_]\w*)/g, 'checkJob("$1")');
        //     expression = expression.replace(/BaseClass\s*!=\s*([a-zA-Z_]\w*)/g, '!checkJob("$1")');
        // }
    }

    private _isTruthy(val: ScriptValue): boolean {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'number') return val !== 0;
        if (typeof val === 'string') return val !== '';
        return false;
    }
}