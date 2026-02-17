import { Injectable } from "@angular/core";
import { BaseStatsNames, SessionBonus } from "./models.v3";

/*** REGEX ***/
const BASE_STATS = /bonus b([Str|Agi|Dex|Vit|Int|Luk]+),(\d+)/;
const ALL_STATS = /bonus bAllStats,(\d+)/;

/*** service ***/
@Injectable({ providedIn: 'root' })
export class TTBonusEngineService {

    public applyBonus(session: SessionBonus, bonus: string) {
        const bonis = bonus.split(';');
        for (let b of bonis) {
            /* base stats */
            let match = BASE_STATS.exec(b);
            if (match) {
                let stat = match[1].toLowerCase() as BaseStatsNames;
                let val = Number(match[2]);
                session[stat] += val;
            }
            /* all stats */
            match = ALL_STATS.exec(b);
            if (match) {
                let val = Number(match[1]);
                session.str += val;
                session.agi += val;
                session.dex += val;
                session.int += val;
                session.vit += val;
                session.luk += val;
            }
        }
    }
}