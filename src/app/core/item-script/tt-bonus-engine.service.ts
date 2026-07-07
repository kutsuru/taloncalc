/*** imports ***/
import { inject, Injectable } from "@angular/core";
import { getItemTypeValue, getJobValue, getWeaponTypeValue } from "../rAthena/ra-utils";
import { createEmptySessionBonus, defaultBaseStats, defaultEquipState, SESSION_INFO_DEFAULT } from "../session-info-default";
import { TTCoreServiceV3 } from "../tt-core.v3.service";
import { BaseStatsAs, DBElement, DBJob, DBMobClass, DBMobRace, DBWeaponTypeKey, DBWeaponTypeLeft, EquipState, ItemLocations, SESSION_BONUS_FLAGS, SessionBonus, SessionBonusFlag, SkillBuff } from "../tt-models.v3";
import { DefaultMap, parseDBElement, parseDBMobClass, parseDBMobRace, parseDBMobRace2, parseDBMobSize } from "../utils";
import { INLINE_FUNCTIONS, InlineFunction } from "./inline.functions";
import { SC_FUNCTIONS, SCFunction } from "./sc.functions";
import { ASTNode, IfNode, TTItemScriptParser, VARB_PREFIX } from "./tt-itemscript-parser";
import { TTSnackbarService } from "src/app/tt-snackbar/tt-snackbar.service";

/*** types ***/
export type BonusSource = 'item' | 'itemCombo' | 'skill' | 'pet' | 'sqiBonus' | 'autoBonus';    // maybe mercanary?? or homucu??
export type BonusID = `${BonusSource}:${number | string}`;

export type BonusSubstitution = {
    'subSkillLvl': number,  /* level of the current skill */
}
type CustomBonusSubstitution = keyof BonusSubstitution;
export type LocalOptions = {
    refine?: number,                /* refine of current running equip or location of the card */
    customSubs?: BonusSubstitution,
    location?: ItemLocations,       /* location of the current running equip */
}
type ScriptValue = number | string | boolean;
type SessionOptions = {
    level: {
        base: number,
        job: number,
    },
    equip: EquipState,
    rightHandType: DBWeaponTypeKey,
    lefhtHandtType: DBWeaponTypeLeft,
    baseStats: BaseStatsAs<number>,
    skills: SkillBuff[],
    isPVP: boolean,
    job?: DBJob,
}

/*** REGEX ***/
const MONSTER_RACE_REG = /RC_[a-zA-Z_]+/g;
const MONSTER_RACE2_REG = /\bRC2_\w+/g;
const MONSTER_CLASS_REG = /\bClass_\w+/g;
const ELEMENT_REG = /Ele_[a-zA-Z]+/g;
const SIZE_REG = /Size_[a-zA-Z]+/g;
const SCOPE_VARB_REG = /[.$]*@([a-zA-Z]+)/g;
const LOCAL_VARB_REG = /#(\w+)/g;
const VARB_POST_REG = new RegExp(`(${VARB_PREFIX}[a-zA-Z0-9_]+)`, 'g');
const JOB_REG = /Job_\w+/g;
const BASE_CLASS_REG = /BaseClass/g;
const BASE_JOB_REG = /BaseJob/g;
const CLASS_REG = /\bClass\b/g;
const FUNC_REGEX = /(\w+)\(([^()]*)\)/g;
const WEAPON_TYPE_REGEX = /(?<![A-Za-z])W_\w+/g;
const ITEM_TYPE_REGEX = /(?<![A-Za-z])IT_[\w]+/g;
const WHITESPACE_REGEX = / /g;
const PURE_STR_REGEX = /^(?!(true|false)$)\w+$/;
const IS_CONDITION_REGEX = /==|!=|<=?|>=?|&/;
const WORD_WO_QUOTES_REGEX = /(?<!")\b([A-Za-z_][A-Za-z0-9_]*)\b(?!")/g;
const NESTED_SCRIPT_REGEX = /\{([^}]+)\}/;

/*** definitions ***/
const CANONICAL_KEYS: Record<string, string> = {};
/* bonus xxx */
const BONUS_SPECIAL: Set<String> = new Set([
    'allStats', 'ignoreDefRace', 'atkEle',
    'ignoreDefClass',
    'defRatioAtkClass', // IcePick effect
    'noRegen',
    'defEle'
]);
const BONUS_HIGHEST_ONLY = new Set([
    'speedRate', 'splashRange', 'doubleRate', 'perfectHitRate'
]);
const BONUS_TO_IGNORE = new Set([
    'classChange',
    'zenyCost', // FIXME: maybe needed?
    'restartFullRecover', // Osiris Card
    'skillDisabled',
    'skillDelayToCooldown',
    'allEsMagic',
    'noAdaptionDelay',
    'noPerformWalkPenalty',
    'crimsonLegacy',
    'noNinjaStone'
]);
/* general commands */
// FIXME: check if some is needed
const COMMAND_TO_INGORE = new Set([
    'itemheal', 'sc_end', 'getrandgroupitem', 'monster', 'percentheal',
    'produce', 'pet', 'bpet', 'guildgetexp', 'makepet',
    'delitem', 'getitem', 'soundeffectall', 'homevolution', 'cooking',
    'mercenary_create', 'mercenary_heal', 'mercenary_sc_start',
    'input', 'getexp2', 'logmes',
    'specialeffect2', 'unitskilluseid',   //FIXME: mabye needed?
    'setfont', 'heal', 'end', 'playbgm', 'getitembound', 'buyingstore',
    'warp', 'getgroupitem', 'setmounting', 'transform', 'makerune',
    'rentitem', 'hateffect', 'dispbottom', 'setlook', 'showscript',
    'announce', 'unittalk', 'addhomintimacy', 'vip_time', 'skilleffect'
]);
/* callFunc xxx */
const COMMAND_CALL_FUNC_TO_IGNORE = new Set([
    'F_SQI', 'F_Reward_Credit', 'F_Cat_Hard_Biscuit', 'F_Rice_Weevil_Bug',
    'F_CashStore', 'F_CashPartyCall', 'F_CashReset', 'F_CashDungeon',
    'F_Snowball', 'F_CashTele', 'F_CashCity', 'F_CashSiegeTele',
    'F_GetForumBoundItem', 'F_ASPDBuffBG', 'F_SummerTreasure', 'F_SetForumVar',
    'F_LNY_Envelope', 'F_Hal_SecretItems', 'F_22507', 'F_Hal_Broomstick',
]);
/* scStart */
const SC_START_TO_IGNORE = new Set([
    'SC_Freeze', 'SC_Stun', 'SC_EXPBOOST', 'SC_JEXPBOOST', 'SC_SPEEDUP0', 'SC_SPEEDUP1', 'SC_SpeedUp1',
    'SC_Blind', 'SC_Poison', 'SC_REGENERATION', 'SC_Curse', 'SC_Intravision', 'SC_Silence', 'SC_Xmas', 'SC_Confusion',
    'SC_Bleeding', 'SC_Summer', 'SC_DRESSUP', 'SC_OKTOBERFEST', 'SC_LIFEINSURANCE', 'SC_SlowDown', 'SC_ITEMBOOST',
    'SC_BOSSMAPINFO', 'SC_TOXIN', 'SC_KAIZEL', 'SC_HANBOK', 'SC_MYSTERIOUS_POWDER', 'SC_MAGICMUSHROOM', 'SC_PYREXIA',
    'SC_DEATHHURT', 'SC_OBLIVIONCURSE', 'SC_LEECHESEND', 'SC_EXTRACT_SALAMINE_JUICE', 'SC_VITATA_500',
    'SC_ENERGY_DRINK_RESERCH', 'SC_PARALYSE', 'SC_KAAHI', 'SC_PROMOTE_HEALTH_RESERCH', 'SC_WEDDING',
    // FIXME maybe needed
    'SC_DPoison',
    'SC_COMMONSC_RESIST',       // FIXME: so far only one usable item has it
    'SC_INCHEALRATE',           // FIXME: so far only one usable item has it

]);
// FIXME: map atk to baseAtk?
const SC_START_STATS_MAPPING: Map<string, keyof SessionBonus["stats"]> = new Map(Object.entries({
    'SC_STRFOOD': 'str',
    'SC_AGIFOOD': 'agi',
    'SC_VITFOOD': 'vit',
    'SC_INTFOOD': 'int',
    'SC_DEXFOOD': 'dex',
    'SC_LUKFOOD': 'luk',
    'SC_INCATKRATE': 'scIncAtkRate',
    'SC_INCASPDRATE': 'aspdRate',
    'SC_ATKPOTION': 'scAtkPotion',
    'SC_MATKPOTION': 'scMatkPotion',
    'SC_FOOD_STR_CASH': 'str',
    'SC_FOOD_AGI_CASH': 'agi',
    'SC_FOOD_INT_CASH': 'int',
    'SC_FOOD_DEX_CASH': 'dex',
    'SC_FOOD_LUK_CASH': 'luk',
    'SC_FOOD_VIT_CASH': 'vit',
    'SC_INCHIT': 'hit',
    'SC_INCFLEE': 'flee',
    'SC_INCSTR': 'str',
    'SC_INCINT': 'int',
    'SC_INCAGI': 'agi',
    'SC_INCVIT': 'vit',
    'SC_INCDEX': 'dex',
    'SC_INCLUK': 'luk',
    'SC_INCFLEE2': 'flee2',
    'SC_CASTRATE': 'scCastRate',
    'SC_BOOST500': 'aspdRate',
    'SC_HITFOOD': 'hit',
    'SC_DEF_RATE': 'defRate',
    'SC_MDEF_RATE': 'mdefRate',
    'SC_INCMATKRATE': 'matkRate',
    'SC_FLEEFOOD': 'flee',
    'SC_BATKFOOD': 'baseAtk',
    'SC_MATKFOOD': 'matk',
    'SC_INCMHPRATE': 'maxHPRate',
    'SC_INCMSPRATE': 'maxSPRate',
    'SC_PUTTI_TAILS_NOODLES': 'luk',
    'SC_DROCERA_HERB_STEAMED': 'agi',
    'SC_SIROMA_ICE_TEA': 'dex',
    'SC_MINOR_BBQ': 'vit',
    'SC_COCKTAIL_WARG_BLOOD': 'int',
    'SC_SAVAGE_STEAK': 'str',
    'SC_EXTRACT_WHITE_POTION_Z': 'hpRecovRate',
    'SC_LIFE_FORCE_F': 'maxSPRate',
    'SC_MUSTLE_M': 'maxHPRate',
    'SC_MANA_PLUS': 'matk',
    'SC_FULL_SWING_K': 'baseAtk',
    'SC_BG_RATION_PINK': 'baseAtk',
    'SC_BG_RATION_WHITE': 'matk',
    'SC_BG_RATION_MILITARY_B': 'hit',
    'SC_BG_RATION_MILITARY_C': 'flee',
    'SC_DEFENCE': 'def',
    'SC_STRFOOD_BG': 'str',
    'SC_INTFOOD_BG': 'int',
    'SC_VITFOOD_BG': 'vit',
    'SC_AGIFOOD_BG': 'agi',
    'SC_DEXFOOD_BG': 'dex',
    'SC_LUKFOOD_BG': 'luk'
}));
/* bonus2 xxx */
const BONUS2_TO_IGNORE = new Set([
    'comaClass', 'addMonsterDropItemGroup', 'getZenyNum', 'addSkillBlow',
    'comaRace', 'sPGainRace', 'addMonsterDropItem', 'skillSplashRange', 'skillAddCooldown',
    'dropAddRace', 'skillRange', 'skillUseSPrate', 'skillNoRequire',
    // FIXME maybe??
    'sPDrainValueRace',
    'noSoulLink',   // what the hell is this?
    'skillAtk2',    // splashdmg for combo finish
    'addEffWhenHit',
    'addEff',
    'addEff2',
    'subSkill',     // maybe for PVP?
    'addItemGroupHealRate',
    'statusDuration',   // custom for talon? extend skill durations etc
    'sPVanishRate', // maybe for PVP
    'zenyCost'
]);
const BONUS2_SPECIAL = new Set([
    'skillDefRatioAtkClass'
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
const isBonusFlag = (key: string): key is SessionBonusFlag => {
    return SESSION_BONUS_FLAGS.has(key as SessionBonusFlag);
}

/*** varbs ***/

/**
 * FIXME
 * bonus bDefRatioAtkClass,c;   make use of c (class) parameter
 * SC_ASPDPOTION0/1/2           Merge into one "custome" command?
 * set var,value                Handle as Assignment too
 * defRatioAtkClass for skills
 * bonus3 bSkillNoRequire,\"ASC_EDP\",NoReq_Item,3300; for SinX bonus maybe?  
 * autobonus2/3/4               Some bonus only trigger on some skills
 */

/*** service ***/
@Injectable({ providedIn: 'root' })
export class TTBonusEngineService {
    /* injects */
    public readonly core = inject(TTCoreServiceV3);
    readonly #snackbar = inject(TTSnackbarService);

    /* varbs */
    private _localVarbs: Map<string, number> = new Map();   //FIXME: allow more types? Use DefaultMap?
    private _localOpts: LocalOptions = {};  // is only valid for one "apply cycle"
    private _inlineFuncs: Map<string, InlineFunction> = new Map();
    private _scFuncs: Map<string, SCFunction> = new Map();
    #currentApplier: BonusID | undefined;
    public session: SessionBonus;
    public sessionOpts: SessionOptions;

    /* handlers */
    private readonly _cmdHandler: Record<string, (args: string[]) => void> = {
        bonus: (args) => this._computeBonus(args),
        bonus2: (args) => this._computeBonus2(args),
        bonus3: (args) => this._computeBonus3(args),
        bonus4: (args) => this._computeBonus4(args),
        bonus5: (args) => this._computeBonus5(args),
        bonus6: (args) => this._computeBonus6(args),
        sc_start: (args) => this._computeStatusEffectFunc(args),
        sc_start2: (args) => this._computeStatusEffectFunc2(args),
        sc_start4: (args) => this._computeStatusEffectFunc4(args),
        itemskill: (args) => this._computeItemSkill(args),
        set: (args) => this._computeSet(args),
        skill: (args) => this._computeSkill(args),
        callfunc: (args) => this._computeCommandCallFunc(args),
        bonus_script: (args) => this._computeBonusScript(args),
        autobonus: (args) => this._computeAutobonus(args),
        autobonus2: (args) => this._computeAutobonus2(args),
        autobonus3: (args) => this._computeAutobonus3(args),
        autobonus4: (args) => this._computeAutobonus4(args),
        skilleffect: (args) => this._computeSkillEffect(args),
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

        /* save session */
        this.session = emptyBonus;
        this.sessionOpts = {
            level: { base: 0, job: 0 },
            baseStats: defaultBaseStats(),
            equip: defaultEquipState(),
            lefhtHandtType: 'Unarmed',
            rightHandType: 'Unarmed',
            skills: [],
            isPVP: false,
        }

        /* create static functions */
        for (const fnName in INLINE_FUNCTIONS) {
            this._inlineFuncs.set(fnName, INLINE_FUNCTIONS[fnName]);
        }

        /* create SC functions */
        for (const fnName in SC_FUNCTIONS) {
            this._scFuncs.set(fnName, SC_FUNCTIONS[fnName]);
        }
    }

    /*** public functions ***/
    public resetBonus(session: SessionBonus, opts: SessionOptions) {
        this.session = session;
        this.sessionOpts = opts;
    }
    public applyBonus(source: BonusSource, id: number | string, bonus: string, opts: LocalOptions = {}) {
        /* save local data */
        this._localOpts = opts;
        this.#currentApplier = `${source}:${id}`;

        let bonusPrepared = this._prepareBonus(bonus, opts.customSubs);
        let parser = new TTItemScriptParser(bonusPrepared);
        let bonusAST = parser.parse();
        // console.log(bonusPrepared);
        // console.log(bonusAST);
        /* clear data local varbs (only valid for one bonus script) */
        this._localVarbs.clear();
        /* run script */
        this._evaluateNodes(bonusAST);

        /* reset local data */
        this._localOpts = {};
        this.#currentApplier = undefined;
    }
    // DEBUG
    public addUnknownEle(type: string, ele: string) {
        const group = this._unknownEle.get(type);
        if (!group) {
            this._unknownEle.set(type, [ele]);
        }
        else if (!group.includes(ele)) {
            group.push(ele);
        }
    }
    public getUnknownElements(): string[] {
        const res: string[] = [];
        for (const [type, eles] of this._unknownEle) {
            res.push(`### ${type} (${eles.length}) ###`);
            res.push(...eles);
        }
        return res;
    }
    public incAllStatsBy(value: number) {
        this.session.stats.str += value;
        this.session.stats.agi += value;
        this.session.stats.dex += value;
        this.session.stats.int += value;
        this.session.stats.vit += value;
        this.session.stats.luk += value;
    }

    // FIXME: instead of using the skill, add it do the "unlucked" skills so it can merged with
    // already leanred / used skills to get the highest level for execution
    public useSkill(skillId: number, level: number) {
        const skill = this.core.skillDB.get(skillId);
        const subs: BonusSubstitution = { ...this._localOpts.customSubs, subSkillLvl: level };
        if (skill && skill.itemScript) {
            const bonus = this._prepareBonus(skill.itemScript, subs);
            const skillParser = new TTItemScriptParser(bonus);
            const skillAST = skillParser.parse();
            this._evaluateNodes(skillAST);
        }
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
            // console.log(node);
            try {
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
            catch (e) {
                let err = 'Unknown error happend';
                if (e instanceof Error) {
                    err = e.message;
                }
                this.#snackbar.show(`${this.#currentApplier}: ${err}`, 'debug', { duration: 5000 });
            }
        }
    }
    private _prepareBonus(bonus: string, subs: Partial<BonusSubstitution> = {}): string {
        /* remove escaped " */
        let s = bonus.replace(/"/g, '');

        /* replace specifc commands with values */
        // mob race
        s = s.replace(MONSTER_RACE_REG, parseDBMobRace);
        // mob race 2
        s = s.replace(MONSTER_RACE2_REG, parseDBMobRace2);
        // mob class
        s = s.replace(MONSTER_CLASS_REG, parseDBMobClass);
        // element
        s = s.replace(ELEMENT_REG, parseDBElement);
        // mob size
        s = s.replace(SIZE_REG, parseDBMobSize);
        // BaseClass
        s = s.replace(BASE_CLASS_REG, () => String(this._getJobValue('baseClass')));
        // BaseJob
        s = s.replace(BASE_JOB_REG, () => String(this._getJobValue('baseJob')));
        // Class
        s = s.replace(CLASS_REG, () => String(this._getJobValue('class')));
        // Job_<JobName>
        s = s.replace(JOB_REG, (job) => {
            const val = getJobValue(job);
            return val?.toString() ?? '0';
        });
        // sqi_option_v3 (is used to trigger SQI bonus ingame)
        // FIXME: for items SN can use, this value needs to be diffrent
        s = s.replace(/sqi_option_v3/g, '32');
        s = s.replace(/sqi_choice/g, '1');
        // Weapon Type
        s = s.replace(WEAPON_TYPE_REGEX, (wT) => String(getWeaponTypeValue(wT)));
        // Item Type
        s = s.replace(ITEM_TYPE_REGEX, (iT) => String(getItemTypeValue(iT)));
        // JobLevel
        s = s.replace(/JobLevel/g, String(this.sessionOpts.level.job));
        // BaseLevel
        s = s.replace(/BaseLevel/g, String(this.sessionOpts.level.base));

        /* custom bonus substituions */
        for (const sub in subs) {
            if (!subs[sub]) continue;
            const replaceWith = subs[sub];
            const subReg = new RegExp(sub, 'g');    // make sure everything get replaced 
            s = s.replace(subReg, replaceWith);
        }

        /* replace variables */
        // scope
        s = s.replace(SCOPE_VARB_REG, (_, name: string) => {
            return `${VARB_PREFIX}${name.charAt(0).toUpperCase()}${name.slice(1)}`;
        });
        // local
        s = s.replace(LOCAL_VARB_REG, (_, name: string) => {
            // console.log('Found', name);
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
        let bonusType = transformKey(args[0]);
        let valRaw = args[1];

        /* ignore bonus */
        if (BONUS_TO_IGNORE.has(bonusType)) return;

        /* bonus with flags */
        if (isBonusFlag(bonusType)) {
            this.session.flags.set(bonusType, true);
            return;
        }

        /* look for special bonus */
        if (BONUS_SPECIAL.has(bonusType)) {
            /* we lowercase all initial chars of the bonus */
            switch (bonusType) {
                case "allStats":
                    const val = this._resolveExpr(valRaw) as number;
                    this.incAllStatsBy(val);
                    break;
                case 'ignoreDefRace':
                    /* val is MobRace */
                    this.session.ignoreDefRace.set(valRaw as DBMobRace, true);
                    break;
                case 'ignoreDefClass':
                    /* val is MobClass */
                    this.session.ignoreDefClass.set(valRaw as DBMobClass, true);
                    break;
                case 'atkEle':
                    /* val is Element */
                    this.session.stats.atkEle = valRaw as DBElement;
                    break;
                case 'defEle':
                    /* val is DBElement */
                    this.session.stats.defEle = valRaw as DBElement;
                    break;
                case 'noRegen':
                    const hpOrSp = this._resolveExpr(valRaw) as number;
                    if (hpOrSp === 1) {
                        this.session.flags.set('noRegenHP', true);
                    }
                    else {
                        this.session.flags.set('noRegenSP', true);
                    }
                case 'defRatioAtkClass':
                    this.session.defRatioAtkClass.set(valRaw as DBMobClass, true);
                    break;
                default:
                    throw new Error(`Special bonus "${bonusType}" not implemented`);
            }
            return;
        }

        /* from here all types will have with value */
        const val = this._resolveExpr(valRaw) as number;

        if (!(bonusType in this.session.stats)) {
            this.addUnknownEle('bonus', bonusType);
            throw new Error(`Unknown bonus type ${bonusType} with ${args}`);
        }

        if (BONUS_HIGHEST_ONLY.has(bonusType)) {
            this.session.stats[bonusType] = Math.max(this.session.stats[bonusType] || 0, val);
        }
        else {
            this.session.stats[bonusType] += val;
        }
    }

    private _computeBonus2(args: string[]) {
        let [bonusTypeRaw, key, valRaw] = args;
        const bonusType = transformKey(bonusTypeRaw);

        if (BONUS2_TO_IGNORE.has(bonusType)) return;

        let value = this._resolveExpr(valRaw) as number;

        /* check if special bonus2 */
        if (BONUS2_SPECIAL.has(bonusType)) {
            switch (bonusType) {
                case 'skillDefRatioAtkClass':
                    this.session.skillDefRatioAtkClass.set(key, valRaw as DBMobClass);
                    break;
                default:
                    throw new Error(`Special bonus "${bonusType}" not implemented`);
            }
        }
        /* check if bonusType is present in session */
        else if (bonusType in this.session) {
            const map = (this.session[bonusType] as DefaultMap<any, number>);
            map.set(key, map.get(key) + value);
            return;
        }
        else if (bonusType in this.session.stats) {
            /**
             * this bonus2 has the format bonus,value,time
             * so we resolve the key now and use it as value
             */
            value = this._resolveExpr(key) as number;
            this.session.stats[bonusType] += value;
        }
        else {
            this.addUnknownEle('bonus2', bonusType);
            throw new Error(`Unknown bonus type ${bonusType} with ${args}`);
        }
    }

    //FIXME
    private _computeBonus3(args: string[]) {
        let [bonusTypeRaw, key, valRaw1, valRaw2] = args;
        const bonusType = transformKey(bonusTypeRaw);

        throw new Error(`bonus3 ${bonusType} not implemented`);
    }
    //FIXME
    private _computeBonus4(args: string[]) {
        let [bonusTypeRaw, key, valRaw1, valRaw2, valRaw3] = args;
        const bonusType = transformKey(bonusTypeRaw);

        throw new Error(`bonus4 ${bonusType} not implemented`);
    }
    //FIXME
    private _computeBonus5(args: string[]) {
        let [bonusTypeRaw, key, valRaw1, valRaw2, valRaw3, valRaw4] = args;
        const bonusType = transformKey(bonusTypeRaw);

        throw new Error(`bonus5 ${bonusType} not implemented`);
    }
    //FIXME sofar only ID: 1641 uses it; custom talon
    private _computeBonus6(args: string[]) {
        let [bonusTypeRaw, key, valRaw1, valRaw2, valRaw3, valRaw4, valRaw5] = args;
        const bonusType = transformKey(bonusTypeRaw);

        throw new Error(`bonus6 ${bonusType} not implemented`);
    }

    private _computeAutobonus(args: string[]) {
        let [script, ...rest] = args;
        script = this.#extractNestedScript(script);
        if (script.length > 0) {
            /* get current scripts */
            let scripts = this.session.autoBonus.get(this.#currentApplier!);
            if (!scripts) {
                scripts = [];
            }
            scripts.push(script);

            /* save / override current scripts */
            this.session.autoBonus.set(this.#currentApplier!, scripts);
        }
    }

    private _computeAutobonus2(args: string[]) {
        let [script, ...rest] = args;
        script = this.#extractNestedScript(script);
        if (script.length > 0) {
            /* get current scripts */
            let scripts = this.session.autoBonus.get(this.#currentApplier!);
            if (!scripts) {
                scripts = [];
            }
            scripts.push(script);

            /* save / override current scripts */
            this.session.autoBonus.set(this.#currentApplier!, scripts);
        }
    }

    private _computeAutobonus3(args: string[]) {
        let [script, ...rest] = args;
        script = this.#extractNestedScript(script);
        if (script.length > 0) {
            /* get current scripts */
            let scripts = this.session.autoBonus.get(this.#currentApplier!);
            if (!scripts) {
                scripts = [];
            }
            scripts.push(script);

            /* save / override current scripts */
            this.session.autoBonus.set(this.#currentApplier!, scripts);
        }
    }

    private _computeAutobonus4(args: string[]) {
        let [script, ...rest] = args;
        script = this.#extractNestedScript(script);
        if (script.length > 0) {
            /* get current scripts */
            let scripts = this.session.autoBonus.get(this.#currentApplier!);
            if (!scripts) {
                scripts = [];
            }
            scripts.push(script);

            /* save / override current scripts */
            this.session.autoBonus.set(this.#currentApplier!, scripts);
        }
    }
    // FIXME: only usables so far
    private _computeStatusEffectFunc2(args: string[]) {
        let [func, ...rest] = args;

        throw new Error(`sc_start2 not implemented (${func})`);
    }
    // FIXME: eclage food use this
    private _computeStatusEffectFunc4(args: string[]) {
        let [func, ...rest] = args;

        throw new Error(`sc_start4 not implemented (${func})`);
    }

    private _computeSkillEffect(args: string[]) {
        console.log('Skill effect', args);
    }

    private _computeStatusEffectFunc(args: string[]) {
        if (SC_START_TO_IGNORE.has(args[0])) return;

        if (args.length < 3) {
            console.log('Invalud SC_START script');
            console.log(args);
            return;
        }
        // FIXME: same for all?
        let func = args[0];
        let duration = +args[1];
        let value = +args[2];   // maybe resolve?

        /* check if stats method */
        const statsKey = SC_START_STATS_MAPPING.get(func);
        if (statsKey) {
            (this.session.stats[statsKey] as number) += value;
        }
        else if (this._scFuncs.has(func)) {
            const scFunc = this._scFuncs.get(func)!;
            scFunc(this, this._localOpts, duration, value);
        }
        else {
            this.addUnknownEle('sc_start', func);
            throw new Error(`Unkown sc_start func ${func}`);
        }
    }

    // FIXME: implment me
    private _computeItemSkill(args: string[]) {
        console.log('Item skill', args);
    }

    private _computeSet(args: string[]) {
        const [name, valRaw] = args;
        const val = this._resolveExpr(valRaw) as number;
        this._localVarbs.set(name, val);
    }

    private _computeSkill(args: string[]) {
        const skillEnum = args[0];
        let level = this._resolveExpr(args[1]) as number;
        const skillIDs = this.core.getSkillIDs(skillEnum);
        // FIXME: we only use first skillID
        if (skillIDs.length > 0) {
            this.session.skills.set(skillIDs[0], level);  // auto. use the max. value if already present
        }
    }

    // FIXME: handle the functions
    private _computeCommandCallFunc(args: string[]) {
        /* remove () if present and only use first arg(all is there) */
        let argsExt = args[0].replace(/[()]/g, '').split(',');
        const fnName = argsExt.shift()!;
        // console.log('callfunc', fnName);
        if (COMMAND_CALL_FUNC_TO_IGNORE.has(fnName)) return;

        switch (fnName) {
            default:
                this.addUnknownEle('commandCallFunc', fnName);
                throw new Error('Unknown callfunc ' + fnName);
        }
    }

    private _computeBonusScript(args: string[]) {
        let [script, ...rest] = args;
        script = this.#extractNestedScript(script);
        if (script.length > 0) {
            /* execute the script */
            let scriptParsed = this._prepareBonus(script, this._localOpts.customSubs);
            let parser = new TTItemScriptParser(scriptParsed);
            let subAST = parser.parse();
            /* run script */
            this._evaluateNodes(subAST);
        }
    }

    // FIXME: return type as generic?
    private _resolveExpr(expression: string): ScriptValue {
        expression = expression.trim();

        /* 1) return pure numbers directly */
        let valAsNum = Number(expression);
        if (Number.isFinite(valAsNum)) return valAsNum;

        /* 2) replace whitespace */
        expression = expression.replace(WHITESPACE_REGEX, '');

        /* 3) look for function calls */
        let previousExpr: string;
        let iterations = 0;
        const MAX_ITERATIONS = 100;

        do {
            previousExpr = expression;
            expression = expression.replace(FUNC_REGEX, (_, name: string, argsRaw: string) => {
                const fn = this._inlineFuncs.get(name);
                if (!fn) {
                    this.addUnknownEle('func', name);
                    throw new Error(`Unknown function: ${name}`);
                }

                const args = argsRaw
                    ? argsRaw.split(/\s*,\s*/).map(arg => this._resolveExpr(arg))
                    : [];

                return String(fn(this, this._localOpts, ...args));
            });

            if (++iterations >= MAX_ITERATIONS) {
                throw new Error(`Resolver: maximale Iterationen erreicht für: ${expression}`);
            }
        } while (expression !== previousExpr);

        /* 4) look for local varbs */
        expression = expression.replace(VARB_POST_REG, (_, name) => {
            // console.log('### Get varb ', name, ' = ', this._localVarbs.get(name));
            return String(this._localVarbs.get(name) ?? 0);
        });

        /* 5) look again for pure numbers */
        valAsNum = Number(expression);
        if (Number.isFinite(valAsNum)) return valAsNum;

        /* 6) Look for pure strings without any operators */
        if (PURE_STR_REGEX.test(expression)) return expression;

        /* 6) look for conditons → bare words quoten */
        if (IS_CONDITION_REGEX.test(expression)) {
            expression = expression.replace(WORD_WO_QUOTES_REGEX, (match) => {
                if (match === 'true' || match === 'false' || match === 'null' || match === 'undefined') {
                    return match;
                }
                return `"${match}"`;
            });
        }

        /* 7) (safe) eval */
        // console.log('Expr. to eval ', expression);
        const result = Function(`"use strict"; return (${expression});`)();
        return typeof result === 'boolean' ? result : Number(result);
    }

    private _isTruthy(val: ScriptValue): boolean {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'number') return val !== 0;
        if (typeof val === 'string') return val !== '';
        return false;
    }

    /* extract script */
    #extractNestedScript(script: string): string {
        let res = script;
        const match = script.match(NESTED_SCRIPT_REGEX);
        if (match) {
            res = match[1];
        }
        return res.trim();
    }
}