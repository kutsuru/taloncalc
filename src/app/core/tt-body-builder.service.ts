/*** imports ***/
import { inject, Injectable } from "@angular/core";
import { BaseStatsAs, EquipSlotState, ItemLocations, PartialRecord } from "./tt-models.v3";
import { TTCoreServiceV3 } from "./tt-core.v3.service";

/*** types ***/
export type BuildData = {
    /* mandatory */
    jobClassName: string;
    level: {
        base: number;
        job: number;
    };
    baseStats: BaseStatsAs<number>;

    /* optional / partly optional */
    equip?: PartialRecord<ItemLocations, EquipSlotState>;
    sqiBonus?: string[];
    speedPotion?: number;
    pet?: number;
    // FIXME skills
    // FIXME foods
    // FIXME battleCalc
}
/*** definitons ***/

/*** service ***/
@Injectable({ providedIn: 'root' })
export class TTBodyBuilderService {
    /*** injects ***/
    readonly #core = inject(TTCoreServiceV3);

    /*** public functions ***/
    /**
     * verifyBuild
     * Validate and normalize a BuildData object in-place.
     * - Ensures equipped item references exist in the item DB.
     * - Adjusts card and enchant arrays to match item slot/enchant counts
     *   (fills with zeros or truncates as needed).
     * - Removes invalid equipment slots from the build.
     * Returns true if the build was already valid, false if any modifications
     * were made (or invalid entries removed).
     *
     * @param build BuildData object to validate and normalize
     * @returns boolean indicating whether the build was valid without changes
     */
    verifyBuild(build: BuildData): boolean {
        let isValid = true;

        /* equip */
        for (const slot in build.equip) {
            const curEquip = build.equip[slot as ItemLocations]!;
            const curSlotItem = this.#core.itemDB.get(curEquip.item);
            if (curSlotItem) {
                /* verify card amount */
                // FIXME: is valid card for this item?
                const cardDiff = curSlotItem.slots - curEquip.cards.length;
                if (cardDiff > 0) {
                    /* cards missings, fill with empty slots */
                    curEquip.cards.push(...Array(cardDiff).fill(0));
                    isValid = false;
                }
                else if (cardDiff < 0) {
                    /* to many cards, remove slots */
                    curEquip.cards.splice(curSlotItem.slots);
                    isValid = false;
                }

                /* verify enchant amount */
                // FIXME: is valid enchant for this item?
                const enchantLen = (curSlotItem.enchant?.length ?? 0);
                const entchDiff = enchantLen - curEquip.enchants.length;
                if (entchDiff > 0) {
                    /* enchants missings, fill with empty slots */
                    curEquip.enchants.push(...Array(entchDiff).fill(0));
                    isValid = false;
                }
                else if (entchDiff < 0) {
                    /* to many cards, remove slots */
                    curEquip.enchants.splice(enchantLen);
                    isValid = false;
                }
            }
            else {
                // invalid item ID -> delete from build
                delete build.equip[slot as ItemLocations];
                isValid = false;
            }
        }

        return isValid;
    }
}