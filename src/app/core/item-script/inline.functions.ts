/*** imports ***/
import { LocalOptions, TTBonusEngineService } from "./tt-bonus-engine.service";
import { DBItemType, DBWeaponType, DBWeaponTypeKey, BaseStatsNames } from "../tt-models.v3";
import { getItemLocationFromIndex, isTwoHandedWeapon } from "../utils";
import { CharInfoIndex, EquipIndexKey, ItemInfoIndex } from "../rAthena/ra-models";

/*** types ***/
export type InlineFuncValue = number | boolean | string;
export type InlineFunction = (be: TTBonusEngineService, opts: LocalOptions, ...args: any[]) => InlineFuncValue;

/*** functions & export ***/
/**
 * Documentation
 * https://github.com/cydh/rathena-wiki/blob/master/Getpetinfo.md (example link)
 */
export const INLINE_FUNCTIONS: Record<string, InlineFunction> = {
    rand: (be, opts, min: number, max: number): number => {
        const diff: number = max - min;
        return Math.floor(Math.random() * diff + min);
    },
    floor: (be, opts, value: number): number => {
        return Math.floor(value);
    },
    round: (be, opts, value: number): number => {
        return Math.round(value);
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
    isequipped: (be, opts, ...gears: number[]) => {
        const equipedIds = Object.values(be.sessionOpts.equip).reduce((allIDs, _) => {
            allIDs.push(_.item, ..._.cards);
            return allIDs;
        }, [] as number[]);
        return gears.every(gear => equipedIds.includes(gear));
    },
    readparam: (be, opts, param: string) => {
        // FIXME if more than basestats is needed
        /* convert bDex/Str/... to dex/str/... */
        let statName = param.substring(1).toLowerCase() as BaseStatsNames;
        return be.sessionOpts.baseStats[statName];
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
                return be.sessionOpts.equip.armor.refine;
            case 'EQI_GARMENT':
                return be.sessionOpts.equip.garment.refine;
            case 'EQI_HAND_L':
                return be.sessionOpts.equip.leftHand.refine;
            case 'EQI_HAND_R':
                return be.sessionOpts.equip.rightHand.refine;
            case 'EQI_SHOES':
                return be.sessionOpts.equip.shoes.refine;
            case 'EQI_HEAD_TOP':
                return be.sessionOpts.equip.upperHg.refine;
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
            // item
            if (curEquip.item === itemId) curCnt++;
            // cards
            for (const card of curEquip.cards) {
                if (card === itemId) curCnt++;
            }
            return curCnt;
        }, 0);
        return cntTotal;
    },
    strcharinfo: (be, opts, variant: CharInfoIndex) => {
        switch (variant) {
            case CharInfoIndex.CharacterName:
                return '"FIXME-CharName"';
            case CharInfoIndex.PartyName:
                return '"FIXME-PartyName"';
            case CharInfoIndex.GuildName:
                return '"FIXME-GuildName"';
            case CharInfoIndex.MapName:
                return '"FIXME-MapName"';
        }
    },
    getmapflag: (be, opts, flag: string) => {
        //FIXME: add mapflags to session-service?
        /** 
         * currently used mapflags in items
         * - MF_BATTLEGROUND
         * - mf_vanilla
         * - MF_GVG_CASTLE
         * - MF_TOWN
         * - MF_GOBLININFIL
         */
        return 0;
    },
    getequipid: (be, opts, equip: EquipIndexKey) => {
        if (equip === 'EQI_HAND_L' && isTwoHandedWeapon(be.sessionOpts.rightHandType)) {
            /** 
             * Note: in case of 2h weapon rAthena uses L & R with the same ID
             * in case of a 2H weapon on R and script is asking for L, we give the ID of R
             * to fulfill this expecation
            */
            equip = 'EQI_HAND_R';
        }
        const loc = getItemLocationFromIndex(equip);
        if (loc) {
            return be.sessionOpts.equip[loc].item;
        }
        return -1;
    },
    getpetinfo: (be, opts, infoType: string) => {
        // FIXME: usefull?
        /**
         * info types used
         * - PETINFO_ID
         * - PETINFO_CLASS
         * - PETINFO_INTIMATE
         */
        return 0;
    },
    vip_status: (be, opts) => {
        /* not needed, currently only used for bonus bundle ticket */
        return 0;
    },
    getgmlevel: (be, opts) => {
        /* no needed, 0 will always fulfill the condtions used currently */
        return 0;
    },
    gettime: (be, opts) => {
        /* not used for equip items */
        return 0;
    },
    countitem: (be, opts) => {
        /* only used for inventory items */
        return 0;
    },
    checkmadogear: (be, opts) => {
        /* not used, but by return 1 it will always by truhty when used */
        return 1;
    },
    eaclass: (be, opts) => {
        /* so far only Runes for RuneKnight use this, not relevant for calc */
        return 0;
    },
    gettimetick: (be, opts) => {
        /* not used for equip items */
        return 0;
    },
    checkhomcall: (be, opts) => {
        /* only used for Homunculi (one item) */
        return 0;
    },
    getiteminfo: (be, opts, itemId: number, infoIndex: ItemInfoIndex) => {
        /** currently used
         * 2    ItemType
         * 11   Look / (weapon) type
         * 13   WeaponLevl
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
    },
    getpartnerid: (be, opts) => {
        /* so far only used for one item for marraige stuff */
        return 0;
    }
};