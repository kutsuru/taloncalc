/*** imports ***/
import { inject, Injectable } from "@angular/core";
import { BaseStatsAs, SessionBonus, SessionEquip, SkillBuff } from "./tt-models.v3";
import { createEmptySessionBonus } from "./session-info-default";
import { ASTNode, IfNode, TTItemScriptParser, VARB_PREFIX } from "./tt-itemscript-parser";
import { DefaultMap, parseDBElement, parseDBMobRace, parseDBMobSize } from "./utils";
import { TTCoreServiceV3 } from "./tt-core.v3.service";

/*** types ***/
export type BonusSubstitution = {
    'subSkillLvl': number,  /* level of the current skill */
}
type CustomBonusSubstitution = keyof BonusSubstitution;
type BonusOptions = {
    refine?: number,       /* refine of current running equip or location of the card */
    customSubs?: BonusSubstitution
}
type ScriptValue = number | string | boolean;
type ScriptFunction = (...args: ScriptValue[]) => ScriptValue;

/*** REGEX ***/
const MONSTER_RACE_REG = /RC_[a-zA-Z_]+/g;
const ELEMENT_REG = /Ele_[a-zA-Z]+/g;
const SIZE_REG = /Size_[a-zA-Z]+/g;
const VARB_REG = /\.@([a-zA-Z]+)/g;
const VARB_POST_REG = new RegExp(`(${VARB_PREFIX}[a-zA-Z]+)`, 'g');

/*** definitions ***/
const CANONICAL_KEYS: Record<string, string> = {};
const BONUS_SPECIAL: Set<String> = new Set([
    "allStats"
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
/*** script functions ***/
const generateIsEquipped = (equip: SessionEquip): ScriptFunction => {
    const equiped = Object.values(equip)
    return (...gears: ScriptValue[]) => {
        return gears.every(_ => equiped.includes(_ as number));
    }
}
const generateGetRefine = (refine: number = 0): ScriptFunction => {
    return () => refine;
}
const generateReadParam = (stats: BaseStatsAs<number>): ScriptFunction => {
    const baseStats = {
        bVit: stats.vit,
        bDex: stats.dex,
        bAgi: stats.agi,
        bStr: stats.str,
        bInt: stats.int,
        bLuk: stats.luk
    }
    return (param: ScriptValue) => {
        return baseStats[param as string];
    }
}
const rand: ScriptFunction = (min: ScriptValue, max: ScriptValue): ScriptValue => {
    const m: number = Number(max) - Number(min);
    const b = Number(min);
    return Math.floor(Math.random() * m + b);
}

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
    private readonly _core = inject(TTCoreServiceV3);

    /* varbs */
    private _localVarbs: Map<string, number> = new Map();   //FIXME: allow more types? Use DefaultMap?
    private _functions: Map<string, ScriptFunction> = new Map();    //FIXME: howto fill?
    private _session: SessionBonus;

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
        callfunc: (args) => this._computeCallFunc(args),
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
        this._session = emptyBonus;

        /* create functions static functions */
        this._functions.set('rand', rand);
    }

    /*** public functions ***/
    public resetBonus(
        session: SessionBonus,
        equip: SessionEquip,
        baseStats: BaseStatsAs<number>,
        skills: SkillBuff[]
    ) {
        this._session = session;

        /* create dyn. functions */
        this._functions.set('isequipped', generateIsEquipped(equip));
        this._functions.set('readparam', generateReadParam(baseStats));
        this._functions.set('getskilllv', this._generateGetSkillLv(skills))
    }
    public applyBonus(bonus: string, opts: BonusOptions = {}) {
        let bonusPrepared = this._prepareBonus(bonus, opts.customSubs);
        let parser = new TTItemScriptParser(bonusPrepared);
        let bonusAST = parser.parse();
        // console.log(bonusPrepared);
        // console.log(bonusAST);
        /* clear data local varbs (only valid for one bonus script) */
        this._localVarbs.clear();
        this._functions.set('getrefine', generateGetRefine(opts.refine));
        /* run script */
        this._evaluateNodes(bonusAST);
    }
    // DEBUG
    public getUnknownElements(): string[] {
        const res: string[] = [];
        for (const [type, eles] of this._unknownEle) {
            res.push(`### ${type} ###`);
            res.push(...eles);
        }
        return res;
    }

    /*** generate functions ***/
    private _generateGetSkillLv(skills: SkillBuff[]): ScriptFunction {
        return (skillEnum: ScriptValue) => {
            /* get skill IDs from core */
            const ids = this._core.getSkillIDs(skillEnum as string);
            console.log(`### SKILL IDS FOR ${skillEnum}###`);
            console.log(ids);

            /* no skill found */
            if (ids.length === 0) return 0;

            /* loop over active skills, look for matchin IDs and get max. value */
            const maxLvl = skills.reduce((max, cur) => {
                if (!ids.includes(cur.id)) return max;

                let curLvl = typeof cur.value === 'boolean' ? 1 : cur.value;

                return curLvl > max ? curLvl : max;
            }, 0);

            return maxLvl;
        }
    }
    /*** private functions ***/
    private _addUnknownEle(type: string, ele: string) {
        const group = this._unknownEle.get(type);
        if (!group) {
            this._unknownEle.set(type, []);
        }
        else if (!group.includes(ele)) {
            group.push(ele);
        }
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
            this._addUnknownEle('command', command);
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
            this._session.flags[bonusType] = true;
            return;
        }

        /* with value */
        const val = this._resolveExpr(valRaw) as number;

        if (BONUS_HIGHEST_ONLY.has(bonusType)) {
            this._session.stats[bonusType] = Math.max(this._session.stats[bonusType] || 0, val);
        }
        else if (BONUS_SPECIAL.has(bonusType)) {
            /* we lowercase all initial chars of the bonus */
            switch (bonusType) {
                case "allStats":
                    this._session.stats.str += val;
                    this._session.stats.agi += val;
                    this._session.stats.dex += val;
                    this._session.stats.int += val;
                    this._session.stats.vit += val;
                    this._session.stats.luk += val;
                    break;
                default:
                    console.log("Special bonus type not implemented", bonusType, args);
            }
        }
        else if (bonusType in this._session.stats) {
            this._session.stats[bonusType] += val;
        }
        else {
            this._addUnknownEle('bonus', bonusType);
            throw new Error(`Unknown bonus type ${bonusType} with ${args}`);
        }
    }

    private _computeBonus2(args: string[]) {
        let [bonusTypeRaw, key, valRaw] = args;
        const bonusType = transformKey(bonusTypeRaw);

        //FIXME: check for args length
        let value = this._resolveExpr(valRaw) as number;

        /* check if bonusType is present in session */
        if (bonusType in this._session) {
            const map = (this._session[bonusType] as DefaultMap<any, number>);
            map.set(key, map.get(key) + value);
            return;
        }
        else {
            this._addUnknownEle('bonus2', bonusType);
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
                this._session.stats[CANONICAL_KEYS[func]] += value;
                break;
            /* others */
            case 'SC_ASPDPOTION0':
                this._session.stats.aspdRate += 10;
                break;
            case 'SC_ASPDPOTION1':
                this._session.stats.aspdRate += 15;
                break;
            case 'SC_ASPDPOTION2':
                this._session.stats.aspdRate += 20;
                break;
            case 'SC_ASPDPOTION3':
                this._session.stats.aspdRate += 25;
            default:
                this._addUnknownEle('sc_start', func);
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
    // FIXME: sometimes its not a command
    private _computeCallFunc(args: string[]) {
        console.log('Callfunc', args);
    }
    // FIXME: this needs antoher AST parsing and handling
    private _computeBonusScript(args: string[]) {
        console.log('Bonus-Script', args);
    }

    // FIXME: return type as generic?
    private _resolveExpr(expression: string): ScriptValue {
        /* 1) return pure numbers directly */
        const valAsNumber = Number(expression);
        if (Number.isFinite(valAsNumber)) return valAsNumber;

        expression = expression.replace(/ /g, '');

        /* 2) look for function calls */    // FIXME
        expression = expression.replace(/(\w+)\(([^)]*)\)/g, (_, name: string, argsRaw: string) => {
            const fn = this._functions.get(name);
            if (!fn) {
                this._addUnknownEle('func', name);
                throw new Error(`Unknown function: ${name}`);
            }
            const args = argsRaw
                ? argsRaw.split(',').map(s => {
                    try {
                        return this._resolveExpr(s);
                    }
                    catch { }
                    /* return value as string */
                    return String(s);
                })
                : [];
            return String(fn(...args));
        });

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