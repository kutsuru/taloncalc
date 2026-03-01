import { Injectable } from "@angular/core";
import { SessionBonus, MobRace, Element, MobSize } from "./models.v3";
import { TTItemScriptParser } from "./tt-itemscript-parser";
import { createEmptySessionBonus } from "./session-info-default";
import { DefaultMap } from "./utils";

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
    - fixed data will be mapped as [<key in lowercase>] : <key in session object> 
    - if none is found, we just remove the leading "b"
    */

    return CANONICAL_KEYS[noramalized.toLowerCase()] || noramalized;
};
const getMobRace = (race: string): MobRace => {
    switch (race) {
        case 'RC_Angel':
            return 'angel';
        case 'RC_Brute':
            return 'brute';
        case 'RC_DemiHuman':
            return 'demiHuman';
        case 'RC_Demon':
            return 'demon';
        case 'RC_Dragon':
            return 'dragon';
        case 'RC_Fish':
            return 'fish';
        case 'RC_Formless':
            return 'formless';
        case 'RC_Insect':
            return 'insect';
        case 'RC_Plant':
            return 'plant';
        case 'RC_Player_Human': //FIXME what class?
            return 'player';
        case 'RC_Undead':
            return 'undead';
        case 'RC_All':
            return 'all';
        default:
            console.log('Unknown mob race', race);
            return 'all'
    }
}
const getElement = (eleString: string): Element => {
    switch (eleString) {
        case 'Ele_Dark':
            return 'shadow';
        case 'Ele_Earth':
            return 'earth';
        case 'Ele_Fire':
            return 'fire';
        case 'Ele_Ghost':
            return 'ghost';
        case 'Ele_Holy':
            return 'holy';
        case 'Ele_Neutral':
            return 'neutral';
        case 'Ele_Poison':
            return 'poison';
        case 'Ele_Undead':
            return 'undead';
        case 'Ele_Water':
            return 'water';
        case 'Ele_Wind':
            return 'wind';
        case 'Ele_All':
            return 'all';
        default:
            console.log('Unknown element', eleString);
            return 'all';
    }
}
const getMobSize = (sizeString: string): MobSize => {
    switch (sizeString) {
        case 'Size_Small':
            return 'small';
        case 'Size_Medium':
            return 'medium';
        case 'Size_Large':
            return 'large'
        case 'Size_All':
            return 'all';
        default:
            console.log('Unknown size', sizeString);
            return 'all';
    }
}


/**
 * FIXME
 * bonus bDefRatioAtkClass,c;   make use of c (class) parameter
 * bonus bAtkEle,e;          		Gives the player's attacks element e
 * bonus bDefEle,e;          		Gives the player's defense element e
 * transform MabRace2
 */

/*** service ***/
@Injectable({ providedIn: 'root' })
export class TTBonusEngineService {

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
    }

    /*** public functions ***/
    public applyBonus(session: SessionBonus, bonus: string) {
        let bonusPrepared = this._prepareBonus(bonus);
        let parser = new TTItemScriptParser(bonusPrepared);
        let bonusAST = parser.parse();
        console.log(bonusAST);
        for (let node of bonusAST) {
            switch (node.type) {
                case 'Command':
                    this._computeCommand(node.command, node.args, session);
                    break;
            }
        }
    }

    /*** private functions ***/
    private _prepareBonus(bonus: string): string {
        /* remove escaped " */
        let s = bonus.replace(/"/g, '');

        /* replace specifc commands with values */
        // mob race
        s = s.replace(MONSTER_RACE_REG, getMobRace);
        // element
        s = s.replace(ELEMENT_REG, getElement);
        // mob size
        s = s.replace(SIZE_REG, getMobSize);

        return s;
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
        let bonusTypeRaw = args[0];
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
            if (args.length < 3) {
                console.log('Invalud BONUS2 script', bonusType, args);
                return;
            }
            const key = args[1];
            const value = Number(args[2]);
            if (isNaN(value)) {
                console.log('Bonus2 with complex values not allowed yet', bonusType, args);
                return;
            }
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
        let val = Number(args[1]);
        if (isNaN(val) || args.length > 2) {
            console.log("Complex values not supported yet", bonusType, args);
            return;
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
            case 'SC_STRFOOD':
            case 'SC_AGIFOOD':
            case 'SC_VITFOOD':
            case 'SC_INTFOOD':
            case 'SC_DEXFOOD':
            case 'SC_LUKFOOD':
            case 'SC_INCATKRATE':
                session.stats[CANONICAL_KEYS[func]] += value;
                break;
            default:
                console.log('Unknown SC_START function', args);
        }
    }
}