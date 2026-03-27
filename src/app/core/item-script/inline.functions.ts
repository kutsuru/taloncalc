/*** imports ***/
import { LocalOptions, TTBonusEngineService } from "./tt-bonus-engine.service";
import { DBItemType, DBWeaponType, DBWeaponTypeKey } from "../tt-models.v3";
import { getItemLocationFromIndex, isTwoHandedWeapon } from "../utils";
import { CharInfoIndex, EquipIndexKey, ItemInfoIndex } from "../rAthena/ra-models";

/*** types ***/
export type InlineFuncValue = number | boolean | string;
export type InlineFunction = (be: TTBonusEngineService, opts: LocalOptions, ...args: any[]) => InlineFuncValue;

/*** functions & export ***/
export const INLINE_FUNCTIONS: Record<string, InlineFunction> = {
    rand: (be, opts, min: number, max: number): number => {
        const diff: number = max - min;
        return Math.floor(Math.random() * diff + min);
    },
    callfunc: (be, opts, name: string, ...args: any[]) => {
        switch (name) {
            case 'F_Map_VS':
                // PVP or not?
                return be.sessionOpts.isPVP;
            // empty funcs
            case 'F_SQI_Shoe_OGH':
            case 'F_QuestBook':
                return 0;
            default:
                be.addUnknownEle('callFunc', name);
                throw new Error('Unknown callfunc ' + name);
        }
    },
    // FIXME: check also for cards
    isequipped: (be, opts, ...gears: number[]) => {
        const equiped = Object.values(be.sessionOpts.equip);
        return gears.every(gearId => equiped.includes(gearId));
    },
    readparam: (be, opts, param: string) => {
        // FIXME if more than basestats is needed
        return be.sessionOpts.baseStats[param];
    },
    getskilllv: (be, opts, skillEnum: string) => {
        /* get skill IDs from core */
        const ids = be.core.getSkillIDs(skillEnum);

        /* no skill found */
        if (ids.length === 0) return 0;

        /* loop over active skills, look for matchin IDs and get max. value */
        const maxLvl = be.sessionOpts.skills.reduce((max, cur) => {
            if (!ids.includes(cur.id)) return max;

            let curLvl = typeof cur.value === 'boolean' ? 1 : cur.value;

            return curLvl > max ? curLvl : max;
        }, 0);

        return maxLvl;
    },
    getequiprefinerycnt: (be, opts, equip: EquipIndexKey) => {
        switch (equip) {
            case 'EQI_ARMOR':
                return be.sessionOpts.refines.armor;
            case 'EQI_GARMENT':
                return be.sessionOpts.refines.garment;
            case 'EQI_HAND_L':
                return be.sessionOpts.refines.leftHand;
            case 'EQI_HAND_R':
                return be.sessionOpts.refines.rightHand;
            case 'EQI_SHOES':
                return be.sessionOpts.refines.shoes;
            case 'EQI_HEAD_TOP':
                return be.sessionOpts.refines.upperHg;
            default:
                return 0;
        }
    },
    getrefine: (be, opts) => {
        return opts.refine ?? 0;
    },
    isequippedcnt: (be, opts, itemId: number) => {
        // equips
        const equips = Object.values(be.sessionOpts.equip);
        let cntTotal = equips.reduce((curCnt: number, curEquip) => {
            if (typeof curEquip === 'number' && curEquip === itemId) curCnt++;
            return curCnt;
        }, 0);
        // cards
        const cards = Object.values(be.sessionOpts.cards);
        cntTotal = cards.reduce((curCnt: number, curCard) => {
            if (typeof curCard === 'number') {
                if (curCard === itemId) curCnt++;
            }
            else {
                // array
                for (const entry of curCard) {
                    if (entry === itemId) curCnt++;
                }
            }
            return curCnt;
        }, cntTotal);
        return cntTotal;
    },
    strcharinfo: (be, opts, variant: CharInfoIndex) => {
        switch (variant) {
            case CharInfoIndex.CharacterName:
                return 'FIXME-CharName';
            case CharInfoIndex.PartyName:
                return 'FIXME-PartyName';
            case CharInfoIndex.GuildName:
                return 'FIXME-GuildName';
            case CharInfoIndex.MapName:
                return 'FIXME-MapName';
        }
    },
    getmapflag: (be, opts) => {
        return 0;
    },
    getequipid: (be, opts, equip: EquipIndexKey) => {
        if (equip === 'EQI_HAND_L' && isTwoHandedWeapon(be.sessionOpts.equip.rightHandType)) {
            /** 
             * Note: in case of 2h weapon rAthena uses L & R with the same ID
             * in case of a 2H weapon on R and script is asking for L, we give the ID of R
             * to fulfill this expecation
            */
            equip = 'EQI_HAND_R';
        }
        const loc = getItemLocationFromIndex(equip);
        if (loc) {
            return be.sessionOpts.equip[loc];
        }
        return -1;
    },
    getpetinfo: (be, opts) => {
        return 0;
    },
    vip_status: (be, opts) => {
        return 0;
    },
    getgmlevel: (be, opts) => {
        return 0;
    },
    gettime: (be, opts) => {
        return 0;
    },
    countitem: (be, opts) => {
        return 0;
    },
    checkmadogear: (be, opts) => {
        return 0;
    },
    eaclass: (be, opts) => {
        return 0;
    },
    gettimetick: (be, opts) => {
        return 0;
    },
    checkhomcall: (be, opts) => {
        return 0;
    },
    getiteminfo: (be, opts, itemId: number, infoIndex: ItemInfoIndex) => {
        /** currently used
         * 2
         * 11
         * 13
         */
        const item = be.core.itemDB.get(itemId);
        if (!item) return 0;

        switch (infoIndex) {
            case ItemInfoIndex.ItemType:
                return DBItemType[item.type]
            case ItemInfoIndex.Look:
                // FIXME, only weapontype?
                if (item.type === 'Weapon One-Hand' || item.type === 'Weapon Two-Hand') {
                    return DBWeaponType[item.subType as DBWeaponTypeKey]
                }
                else {
                    return 0;
                }
            case ItemInfoIndex.WeaponLevl:
                return item.weaponLevel;
        }
        /* if nothing matched */
        return 0;
    }
};