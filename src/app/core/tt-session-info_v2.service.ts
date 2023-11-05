import { Injectable } from "@angular/core";
import { BaseStats, JobDB_V2, JobDbEntry, SessionInfoV2 } from "./models";
import { TTCoreService } from "./tt-core.service";
import { BehaviorSubject, Observable, distinctUntilChanged } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class TTSessionInfoV2Service {
    private _jobClass!: JobDbEntry;

    private _sessionInfoData: SessionInfoV2 = {
        baseLevel: 1,
        jobLevel: 1,
        baseLevelMax: TTCoreService.MAX_LVL,
        jobLevelMax: 10,
        baseStats: {
            str: 1,
            agi: 1,
            vit: 1,
            int: 1,
            dex: 1,
            luk: 1
        },
        totalStats: {
            str: 1,
            agi: 1,
            vit: 1,
            int: 1,
            dex: 1,
            luk: 1
        },
        maxHp: 1,
        maxSp: 0,
        hit: 0,
        flee: 0,
        perfectDodge: 0,
        crit: 0,
        aspd: 0,
        atk: 0,
        minMatk: 0,
        maxMatk: 0,
        activeBonus: {
            stats: {
                str: 0,
                agi: 0,
                vit: 0,
                int: 0,
                dex: 0,
                luk: 0
            }
        }
    }
    private _sessionInfo: BehaviorSubject<SessionInfoV2>;
    public sessionInfo$: Observable<SessionInfoV2>;

    constructor(private core: TTCoreService) {
        this._sessionInfo = new BehaviorSubject<SessionInfoV2>(this._sessionInfoData);
        this.sessionInfo$ = this._sessionInfo.asObservable();

        /* wait until core is loaded */
        this.core.loaded$.pipe(distinctUntilChanged()).subscribe((_) => {
            if (_) {
                this._jobClass = this.core.jobDbV2[Object.keys(this.core.jobDbV2)[0]];
            }
        });
    }

    /*** public methods ***/
    changeClass(className: keyof JobDB_V2) {
        this._jobClass = this.core.jobDbV2[className];
        this.updateSessionInfo();
    }
    changeLevel(baseLvl: number, jobLvl: number) {
        this._sessionInfoData.baseLevel = baseLvl;
        this._sessionInfoData.jobLevel = jobLvl;
        this.updateSessionInfo();
    }
    changeBaseStats(stats: { [key in BaseStats]: number }) {
        this._sessionInfoData.baseStats = { ...stats };
        this.updateSessionInfo();
    }

    /*** private methods ***/
    updateSessionInfo() {
        // this.resetBonus();   // TODO
        this.updateClassSpecificData();
        // this.updateBonus(); // TODO
        // this.updateFoodBonus(); // TODO
        this.updateStats();

        /* HP / SP */
        this._sessionInfoData.maxHp = this.computeHpSp(this._sessionInfoData.totalStats.vit, "HP");
        this._sessionInfoData.maxSp = this.computeHpSp(this._sessionInfoData.totalStats.int, "SP");

        // this.computeAttackSpeed();   // TODO

        // All weapons with ammunitions are considered as DEX type
        // let isDexBased: boolean = this._sessionInfo['ammoType'] != '';   // TODO

        // this.computeHit(); // TODO
        // this.computeFlee(); // TODO
        // this.computePerfectDodge(); // TODO
        // this.computeAtk(isDexBased); // TODO
        // this.computeMatk(); // TODO
        // this.computeCriticalRate(); // TODO

        /* publish data */
        this._sessionInfo.next(this._sessionInfoData);
    }
    updateClassSpecificData() {
        /* reset max levels */
        this._sessionInfoData.jobLevelMax = this._jobClass ? this._jobClass.maxJobLv : 10;
        /* calc job bonus */
        for (let stat in this._jobClass.jobBonus) {
            let statKey = stat as BaseStats;
            this._sessionInfoData.activeBonus.stats[statKey] = this._jobClass.jobBonus[statKey].reduce((sum, level) => {
                if (level <= this._sessionInfoData.jobLevel) {
                    return sum + 1;
                }
                else {
                    return sum;
                }
            }, 0);
        }
    }
    updateStats() {
        // TODO: add sc<STAT>Food
        this._sessionInfoData.totalStats.str = this._sessionInfoData.baseStats.str + this._sessionInfoData.activeBonus.stats.str;
        this._sessionInfoData.totalStats.dex = this._sessionInfoData.baseStats.dex + this._sessionInfoData.activeBonus.stats.dex;
        this._sessionInfoData.totalStats.int = this._sessionInfoData.baseStats.int + this._sessionInfoData.activeBonus.stats.int;
        this._sessionInfoData.totalStats.luk = this._sessionInfoData.baseStats.luk + this._sessionInfoData.activeBonus.stats.luk;
        this._sessionInfoData.totalStats.agi = this._sessionInfoData.baseStats.agi + this._sessionInfoData.activeBonus.stats.agi;
        this._sessionInfoData.totalStats.vit = this._sessionInfoData.baseStats.vit + this._sessionInfoData.activeBonus.stats.vit;
    }
    computeHpSp(statVitOrInt: number, mode: "HP" | "SP"): number {
        let maxHpSp: number = 0;
        let valueTable: number[] = (mode === "HP") ? this._jobClass.hpTable : this._jobClass.spTable;

        maxHpSp = Math.floor(
            valueTable[this._sessionInfoData.baseLevel - 1] *
            (1 + statVitOrInt / 100) *
            (this._jobClass.isTrans ? 1.25 : 1)
        );
        // maxHpSp += this._sessionInfoData.activeBonus.maxHP   // TODO maxHP / SP

        // maxHpSp = Math.floor(
        //     maxHpSp *
        //     (1 + this._sessionInfoData.activeBonus.maxHpRate / 100) // TODO maxHpRate / SP
        // )

        return maxHpSp;
    }
}