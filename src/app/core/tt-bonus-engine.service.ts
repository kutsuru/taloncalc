/*** imports ***/
import { Injectable } from "@angular/core";
import { SessionBonus, MobRace, Element, MobSize } from "./models.v3";
import { IfNode, TTItemScriptParser } from "./tt-itemscript-parser";
import { createEmptySessionBonus } from "./session-info-default";
import { DefaultMap, execFormula, parseDBElement, parseDBMobRace, parseDBMobSize } from "./utils";

/*** types ***/
export type BonusSubstitution = {
    'subSkillLvl': number,  /* level of the current skill */
    'BaseClass': string     /* BaseClass for IF statments: IT HAS TO USE "" eg. "Job_Mage" */
}
type CustomBonusSubstitution = keyof BonusSubstitution;

/*** REGEX ***/
const MONSTER_RACE_REG = /RC_[a-zA-Z_]+/g;
const ELEMENT_REG = /Ele_[a-zA-Z]+/g;
const SIZE_REG = /Size_[a-zA-Z]+/g;

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



/**
 * FIXME
 * bonus bDefRatioAtkClass,c;   make use of c (class) parameter
 * bonus bAtkEle,e;          	the player's attacks element e
 * bonus bDefEle,e;          	the player's defense element e
 * transform MabRace2
 * SC_ASPDPOTION0/1/2           Merge into one "custome" command?
 */

/*** service ***/
@Injectable({ providedIn: 'root' })
export class TTBonusEngineService {
    /* injects */

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
        CANONICAL_KEYS['SC_INCASPDRATE'] = 'aspdRate'
    }

    /*** public functions ***/
    public applyBonus(session: SessionBonus, bonus: string, subs: Partial<BonusSubstitution> = {}) {
        let bonusPrepared = this._prepareBonus(bonus, subs);
        let parser = new TTItemScriptParser(bonusPrepared);
        let bonusAST = parser.parse();
        // console.log(bonusAST);
        for (let node of bonusAST) {
            switch (node.type) {
                case 'Command':
                    this._computeCommand(node.command, node.args, session);
                    break;
                case 'IfStatement':
                    this._computeIfStatement(node);
                    break;
            }
        }
    }

    /*** private functions ***/
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

        return s;
    }

    private _computeIfStatement(ifNode: IfNode) {
        console.log(ifNode.condition);
    }

    private _computeCommand(command: string, args: string[], session: SessionBonus) {
        if (command.startsWith('bonus')) {
            if (args.length >= 1) {
                this._computeCommandBonus(command, args, session);
            }
        }
        else if (command === 'sc_start') {
            this._computeStatusEffectFunc(args, session);
        }
        else {
            console.log("Unknown command", command, args);
        }
    }

    private _computeCommandBonus(command: string, args: string[], session: SessionBonus) {
        /* try to find bonus */
        let bonusTypeRaw = args.shift()!;
        let bonusType = transformKey(bonusTypeRaw);

        /* bonus with flags */
        if (BONUS_FLAGS.has(bonusType)) {
            session.flags[bonusType] = true;
            return;
        }

        /* bonus2 */
        if (command === "bonus2") {
            /** 
             * format
             * bonus2 <effect>, <effectType>, <value>
            */
            if (args.length < 2) {
                console.log('Invalud BONUS2 script', bonusType, args);
                return;
            }
            const key = args.shift()!;
            /* get value */
            let value: number;
            if (args.length > 1) {
                /* complex value */
                value = execFormula(args);
            }
            else {
                value = Number(args[0]);
            }

            /* check if bonusType is present in session */
            if (bonusType in session) {
                const map = (session[bonusType] as DefaultMap<any, number>);
                map.set(key, map.get(key) + value);
                return;
            }
            else {
                console.log('Unknown bonus type', bonusType, args);
                return;
            }

        }
        /* bonus2 / bonus3 */
        if (command === "bonus3") {
            console.log("Bonus2/Bonus3 not supported yet", command, args);
            return;
        }

        /* numeric values */
        let val: number;
        if (args.length > 1) {
            /* complex value with a formula */
            val = execFormula(args);
            val = Math.round(val);
            // FIXME: check for failures?
        }
        else {
            val = Number(args[0]);
        }

        if (BONUS_HIGHEST_ONLY.has(bonusType)) {
            session.stats[bonusType] = Math.max(session.stats[bonusType] || 0, val);
        }
        else if (BONUS_SPECIAL.has(bonusType)) {
            /* we lowercase all values */
            switch (bonusType) {
                case "allStats":
                    session.stats.str += val;
                    session.stats.agi += val;
                    session.stats.dex += val;
                    session.stats.int += val;
                    session.stats.vit += val;
                    session.stats.luk += val;
                    break;
                default:
                    console.log("Special bonus type not implemented", bonusType, args);
            }
        }
        else if (bonusType in session.stats) {
            session.stats[bonusType] += val;
        }
        else {
            console.log("Unknown bonus type", bonusType, args);
        }
    }

    private _computeStatusEffectFunc(args: string[], session: SessionBonus) {
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
                session.stats[CANONICAL_KEYS[func]] += value;
                break;
            /* others */
            case 'SC_ASPDPOTION0':
                session.stats.aspdRate += 10;
                break;
            case 'SC_ASPDPOTION1':
                session.stats.aspdRate += 15;
                break;
            case 'SC_ASPDPOTION2':
                session.stats.aspdRate += 20;
                break;
            case 'SC_ASPDPOTION3':
                session.stats.aspdRate += 25;
            default:
                console.log('Unknown SC_START function', args);
        }
    }
}