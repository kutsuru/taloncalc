/*** imports ***/
import { Injectable } from "@angular/core";
import { BaseStatsAs, EquipSlotState, ItemLocations, PartialRecord } from "./tt-models.v3";

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
export class TTBodyBuilderService { }