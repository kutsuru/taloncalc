import { Injectable } from "@angular/core";
import { SessionBonus } from "./models.v3";
import { TTItemScriptParser } from "./tt-itemscript-parser";
import { createEmptySessionBonus } from "./session-info-default";

/*** REGEX ***/
/*** definitions ***/
const CANONICAL_KEYS: Record<string, string> = {};
const BONUS_SPECIAL: Set<String> = new Set([
    "allstats"
]);
const BONUS_HIGHEST_ONLY = new Set([
    'speed', 'noCastCancel', 'noCastCancel2', 'noGemstone',
    'noSizeFix', 'noKnockback', 'fixedCastrate'
]);

const BONUS_FLAGS = new Set([
    'unbreakableWeapon', 'unbreakableArmor', 'unbreakableHelm',
    'unbreakableShield', 'unbreakableGarment', 'unbreakableShoes',
    'noStun', 'noFreezing', 'noStone', 'noSleep', 'noConfusion',
    'noCurse', 'noBlind', 'noPoison', 'noSilence', 'noBleeding'
]);

/*** helper functions ***/
const transformKey = (key: string) => {
    let noramalized = key.toLowerCase();
    if (noramalized.startsWith('b')) {
        noramalized = noramalized.substring(1);
    }

    return CANONICAL_KEYS[noramalized] || noramalized;
};

/**
 * TODOS
 * sc_start SC_INCATKRATE,1800000,5 -> add 5 to stats.scIncAtkRate
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
    }

    /*** public functions ***/
    public applyBonus(session: SessionBonus, bonus: string) {
        let parser = new TTItemScriptParser(bonus);
        let bonusAST = parser.parse();
        // console.log(bonusAST);
        for (let node of bonusAST) {
            switch (node.type) {
                case 'Command':
                    this._computeCommand(node.command, node.args, session);
                    break;
            }
        }
    }

    private _computeCommand(command: string, args: string[], session: SessionBonus) {
        if (command.startsWith('bonus')) {
            if (args.length >= 1) {
                this._computeCommandBonus(command, args, session);
            }
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

        /* bonus2 / bonus3 */
        if (command === "bonus2" || command === "bonus3") {
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
                case "allstats":
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
}