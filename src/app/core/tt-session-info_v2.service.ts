import { Injectable } from "@angular/core";
import { BaseStatsNames, JobDB_V2, JobDbEntry, SessionInfoV2 } from "./models";
import { TTCoreService } from "./tt-core.service";
import { BehaviorSubject, Observable, distinctUntilChanged } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class TTSessionInfoV2Service {
    /* DB object of current selected class */
    private _jobClass!: JobDbEntry;

    /* main stats */
    private _str: number;
    private _agi: number;
    private _vit: number;
    private _int: number;
    private _dex: number;
    private _luk: number;
    private _hit: number;
    private _atk: number;
    private _aspd: number;
    private _crit: number;
    private _flee: number;
    private _maxHp: number;
    private _maxSp: number;
    private _minMatk: number;
    private _maxMatk: number;
    private _baseAtk: number;
    private _perfectDodge: number;

    private _isDualWielding: boolean;

    /* session info for current build */
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
            str: 0,
            agi: 0,
            vit: 0,
            int: 0,
            dex: 0,
            luk: 0,
            allStats: 0,
            hit: 0,
            perfectHitRate: 0,
            flee: 0,
            crit: 0,
            criticalAtkRate: 0,
            perfectDodge: 0,
            aspd: 0,
            aspdRate: 0,
            maxHp: 0,
            maxSp: 0,
            maxHpRate: 0,
            maxSpRate: 0,
            matk: 0,
            matkRate: 0,
            atk: 0,
            atkRate: 0,
            shortAtkRate: 0,
            longAtkRate: 0,
            longAtkDef: 0,
            def: 0,
            defRate: 0,
            nearAtkDef: 0,
            magicAtkDef: 0,
            miscAtkDef: 0,
            defRatioAtkClass: 0,
            mdef: 0,
            armorElement: 0,
            weaponElement: 0,
            ignoreDefClass: {
                all: 0,
                normal: 0,
                boss: 0,
                guardian: 0,
            },
            ignoreMdefClass: {
                all: 0,
                normal: 0,
                boss: 0,
                guardian: 0,
            },
            ignoreDefRace: {
                formless: 0,
                undead: 0,
                brute: 0,
                plant: 0,
                insect: 0,
                fish: 0,
                demon: 0,
                demiHuman: 0,
                angel: 0,
                dragon: 0,
            },
            ignoreMdefRace: {
                formless: 0,
                undead: 0,
                brute: 0,
                plant: 0,
                insect: 0,
                fish: 0,
                demon: 0,
                demiHuman: 0,
                angel: 0,
                dragon: 0,
            },
            ignoreDefElement: {
                neutral: 0,
                water: 0,
                earth: 0,
                fire: 0,
                wind: 0,
                poison: 0,
                holy: 0,
                shadow: 0,
                ghost: 0,
                undead: 0,
            },
            ignoreMdefElement: {
                neutral: 0,
                water: 0,
                earth: 0,
                fire: 0,
                wind: 0,
                poison: 0,
                holy: 0,
                shadow: 0,
                ghost: 0,
                undead: 0,
            },
            addClass: {
                all: 0,
                normal: 0,
                boss: 0,
                guardian: 0,
            },
            magicAddClass: {
                all: 0,
                normal: 0,
                boss: 0,
                guardian: 0,
            },
            expAddClass: {
                all: 0,
                normal: 0,
                boss: 0,
                guardian: 0,
            },
            subClass: {
                all: 0,
                normal: 0,
                boss: 0,
                guardian: 0,
            },
            addSize: {
                small: 0,
                medium: 0,
                large: 0,
            },
            subSize: {
                small: 0,
                medium: 0,
                large: 0,
            },
            addRace: {
                formless: 0,
                undead: 0,
                brute: 0,
                plant: 0,
                insect: 0,
                fish: 0,
                demon: 0,
                demiHuman: 0,
                angel: 0,
                dragon: 0,
            },
            magicAddRace: {
                formless: 0,
                undead: 0,
                brute: 0,
                plant: 0,
                insect: 0,
                fish: 0,
                demon: 0,
                demiHuman: 0,
                angel: 0,
                dragon: 0,
            },
            addRace2: {
                goblin: 0,
                golem: 0,
                orc: 0,
                kobold: 0,
                manuk: 0,
                splendide: 0,
                biolab: 0,
                kiel: 0,
                juperos: 0,
            },
            magicAddRace2: {
                goblin: 0,
                golem: 0,
                orc: 0,
                kobold: 0,
                manuk: 0,
                splendide: 0,
                biolab: 0,
                kiel: 0,
                juperos: 0,
            },
            subRace2: {
                goblin: 0,
                golem: 0,
                orc: 0,
                kobold: 0,
                manuk: 0,
                splendide: 0,
                biolab: 0,
                kiel: 0,
                juperos: 0,
            },
            criticalAddRace: {
                formless: 0,
                undead: 0,
                brute: 0,
                plant: 0,
                insect: 0,
                fish: 0,
                demon: 0,
                demiHuman: 0,
                angel: 0,
                dragon: 0,
            },
            criticalAtkRateRace: {
                formless: 0,
                undead: 0,
                brute: 0,
                plant: 0,
                insect: 0,
                fish: 0,
                demon: 0,
                demiHuman: 0,
                angel: 0,
                dragon: 0,
            },
            expAddRace: {
                formless: 0,
                undead: 0,
                brute: 0,
                plant: 0,
                insect: 0,
                fish: 0,
                demon: 0,
                demiHuman: 0,
                angel: 0,
                dragon: 0,
            },
            subRace: {
                formless: 0,
                undead: 0,
                brute: 0,
                plant: 0,
                insect: 0,
                fish: 0,
                demon: 0,
                demiHuman: 0,
                angel: 0,
                dragon: 0,
            },
            addElement: {
                neutral: 0,
                water: 0,
                earth: 0,
                fire: 0,
                wind: 0,
                poison: 0,
                holy: 0,
                shadow: 0,
                ghost: 0,
                undead: 0,
            },
            magicAddElement: {
                neutral: 0,
                water: 0,
                earth: 0,
                fire: 0,
                wind: 0,
                poison: 0,
                holy: 0,
                shadow: 0,
                ghost: 0,
                undead: 0,
            },
            magicElementRate: {
                neutral: 0,
                water: 0,
                earth: 0,
                fire: 0,
                wind: 0,
                poison: 0,
                holy: 0,
                shadow: 0,
                ghost: 0,
                undead: 0,
            },
            expAddElement: {
                neutral: 0,
                water: 0,
                earth: 0,
                fire: 0,
                wind: 0,
                poison: 0,
                holy: 0,
                shadow: 0,
                ghost: 0,
                undead: 0,
            },
            subElement: {
                neutral: 0,
                water: 0,
                earth: 0,
                fire: 0,
                wind: 0,
                poison: 0,
                holy: 0,
                shadow: 0,
                ghost: 0,
                undead: 0,
            },
            subDefElement: {
                neutral: 0,
                water: 0,
                earth: 0,
                fire: 0,
                wind: 0,
                poison: 0,
                holy: 0,
                shadow: 0,
                ghost: 0,
                undead: 0,
            },
            addEffect: {
                poison: 0,
                stun: 0,
                freeze: 0,
                curse: 0,
                blind: 0,
                sleep: 0,
                silence: 0,
                confusion: 0,
                bleeding: 0,
                stone: 0,
            },
            magicAddEffect: {
                poison: 0,
                stun: 0,
                freeze: 0,
                curse: 0,
                blind: 0,
                sleep: 0,
                silence: 0,
                confusion: 0,
                bleeding: 0,
                stone: 0,
            },
            addEffectWhenHit: {
                poison: 0,
                stun: 0,
                freeze: 0,
                curse: 0,
                blind: 0,
                sleep: 0,
                silence: 0,
                confusion: 0,
                bleeding: 0,
                stone: 0,
            },
            resEffect: {
                poison: 0,
                stun: 0,
                freeze: 0,
                curse: 0,
                blind: 0,
                sleep: 0,
                silence: 0,
                confusion: 0,
                bleeding: 0,
                stone: 0,
            },
            breakArmorRate: 0,
            breakWeaponRate: 0,
            reflectShortWeaponDamage: 0,
            spCostReductionRate: 0,
            hpDrainRate: {
                chance: 0,
                value: 0,
            },
            spDrainRate: {
                chance: 0,
                value: 0,
            },
            hpRecoveryRate: 0,
            spRecoveryRate: 0,
            castRate: 0,
            castDelay: 0,
            healPower: {
                all: 0,
                heal: 0,
                sanctuary: 0,
                potionPitcher: 0,
                slimPotionPitcher: 0,
            },
            healPower2: {
                all: 0,
                heal: 0,
                sanctuary: 0,
                potionPitcher: 0,
                slimPotionPitcher: 0,
            },
            addGlobalItemHealRate: 0,
            addGlobalSpItemHealRate: 0,
            addItemHealRate: {},
            addItemGlobalHealRate: {},
            allowsRefine: true,
            isUnbreakable: false,
            addMonster: {},
            addDefMonster: {},
            skillAtk: {},
            autospell: {},
            enableSkill: {},
            skillCastRate: {},
            skillCastDelay: {},
            scPdFood: 0,
            scStrFood: 0,
            scAgiFood: 0,
            scVitFood: 0,
            scIntFood: 0,
            scDexFood: 0,
            scLukFood: 0,
            scHitFood: 0,
            scIncCrit: 0,
            scDefRate: 0,
            scMdefRate: 0,
            scCastRate: 0,
            scFleeFood: 0,
            scExpBoost: 0,
            scJexpBoost: 0,
            scAtkPotion: 0,
            scMatkPotion: 0,
            scAspdPotion: 0,
            scIncAtkRate: 0,
            scIncMatkRate: 0,
            scIncAspdRate: 0,
            scIncreaseAgi: 0,
        },
        activeStatus: {
            Sprint: 0
        }
    }
    private _sessionInfo: BehaviorSubject<SessionInfoV2>;
    public sessionInfo$: Observable<SessionInfoV2>;

    constructor(private core: TTCoreService) {
        this._str = 0;
        this._agi = 0;
        this._vit = 0;
        this._int = 0;
        this._dex = 0;
        this._luk = 0;
        this._hit = 0;
        this._atk = 0;
        this._aspd = 0;
        this._crit = 0;
        this._flee = 0;
        this._maxHp = 0;
        this._maxSp = 0;
        this._minMatk = 0;
        this._maxMatk = 0;
        this._baseAtk = 0;
        this._perfectDodge = 0;

        this._isDualWielding = false;

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
    changeBaseStats(stats: { [key in BaseStatsNames]: number }) {
        this._sessionInfoData.baseStats = { ...stats };
        this.updateSessionInfo();
    }

    /*** private methods ***/
    private updateSessionInfo() {
        this.resetBonus();
        this.updateClassSpecificData();
        // this.updateBonus(); // TODO
        // this.updateFoodBonus(); // TODO
        this.updateStats();

        /* HP / SP */
        this._sessionInfoData.maxHp = this.computeHpSp(this._vit, "HP");
        this._sessionInfoData.maxSp = this.computeHpSp(this._int, "SP");

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
    private updateClassSpecificData() {
        /* reset max levels */
        this._sessionInfoData.jobLevelMax = this._jobClass ? this._jobClass.maxJobLv : 10;
        /* calc job bonus */
        for (let stat in this._jobClass.jobBonus) {
            let statKey = stat as BaseStatsNames;
            this._sessionInfoData.activeBonus[statKey] = this._jobClass.jobBonus[statKey].reduce((sum, level) => {
                if (level <= this._sessionInfoData.jobLevel) {
                    return sum + 1;
                }
                else {
                    return sum;
                }
            }, 0);
        }
    }
    private updateStats() {
        this._str = this._sessionInfoData.baseStats.str +
            this._sessionInfoData.activeBonus.str +
            this._sessionInfoData.activeBonus.scStrFood;
        this._dex = this._sessionInfoData.baseStats.dex +
            this._sessionInfoData.activeBonus.dex +
            this._sessionInfoData.activeBonus.scDexFood;
        this._int = this._sessionInfoData.baseStats.int +
            this._sessionInfoData.activeBonus.int +
            this._sessionInfoData.activeBonus.scIntFood;
        this._luk = this._sessionInfoData.baseStats.luk +
            this._sessionInfoData.activeBonus.luk +
            this._sessionInfoData.activeBonus.scLukFood;
        this._agi = this._sessionInfoData.baseStats.agi +
            this._sessionInfoData.activeBonus.agi +
            this._sessionInfoData.activeBonus.scAgiFood +
            this._sessionInfoData.activeBonus.scIncreaseAgi;
        this._vit = this._sessionInfoData.baseStats.vit +
            this._sessionInfoData.activeBonus.vit +
            this._sessionInfoData.activeBonus.scVitFood;
    }
    private computeHpSp(statVitOrInt: number, mode: "HP" | "SP"): number {
        let maxHpSp: number = 0;
        let valueTable: number[];
        let maxHpSpBonus: number;
        let maxHpSpRateBonus: number;
        /* get values for HP or SP */
        if (mode === "HP") {
            valueTable = this._jobClass.hpTable
            maxHpSpBonus = this._sessionInfoData.activeBonus.maxHp;
            maxHpSpRateBonus = this._sessionInfoData.activeBonus.maxHpRate;
        }
        else {
            valueTable = this._jobClass.spTable
            maxHpSpBonus = this._sessionInfoData.activeBonus.maxSp;
            maxHpSpRateBonus = this._sessionInfoData.activeBonus.maxSpRate;
        }
        /* calculate values */
        maxHpSp = Math.floor(
            valueTable[this._sessionInfoData.baseLevel - 1] *
            (1 + statVitOrInt / 100) *
            (this._jobClass.isTrans ? 1.25 : 1)
        );
        maxHpSp += maxHpSpBonus
        maxHpSp = Math.floor(
            maxHpSp *
            (1 + maxHpSpRateBonus / 100)
        )
        return maxHpSp;
    }
    private resetBonus() {
        this.resetObject(this._sessionInfoData.activeBonus, 0);
        this.resetObject(this._sessionInfoData.activeStatus, 0);
    }

    /*** utiles (private) ***/
    private resetObject(obj: any, value: any) {
        for (let key in obj) {
            if (typeof obj[key] === 'object') {
                this.resetObject(obj[key], value);
            }
            else if (Array.isArray(obj[key])) {
                obj[key] = [];
            }
            else if (typeof obj[key] === 'number') {
                obj[key] = value;
            }
        }
    }
    /*** GETer ***/
    public get str(): number {
        return this._str;
    }
    public get agi(): number {
        return this._agi;
    }
    public get vit(): number {
        return this._vit;
    }
    public get int(): number {
        return this._int;
    }
    public get dex(): number {
        return this._dex;
    }
    public get luk(): number {
        return this._luk;
    }
    public get hit(): number {
        return this._hit;
    }
    public get atk(): number {
        return this._atk;
    }
    public get crit(): number {
        return this._crit;
    }
    public get aspd(): number {
        return this._aspd;
    }
    public get flee(): number {
        return this._flee;
    }
    public get maxHp(): number {
        return this._maxHp;
    }
    public get maxSp(): number {
        return this._maxSp;
    }
    public get minMatk(): number {
        return this._minMatk;
    }
    public get maxMatk(): number {
        return this._maxMatk;
    }
    public get baseAtk(): number {
        return this._baseAtk;
    }
    public get perfectDodge(): number {
        return this._perfectDodge;
    }
    public get isDualWielding(): boolean {
        return this._isDualWielding;
    }
}