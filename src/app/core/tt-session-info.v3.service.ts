/*** imports ***/
import { computed, effect, inject, Injectable, Signal, signal, untracked, WritableSignal } from "@angular/core";
import { SessionEquip } from "./models";
import { BaseStatsAs, BaseStatsNames, DBJob } from "./models.v3";
import { BONUS_DEFAULT, SESSION_INFO_DEFAULT } from "./session-info-default";
import { TTCoreService } from "./tt-core.service";
import { TTCoreServiceV3 } from "./tt-core.v3.service";

/** Dependencies 
 * BaseStats        Pure-Stats without any bonus
 * Bonus            f(BaseStats, Job, Equip)          
 * TotalStats       f(BaseStats, Bonus)
 * "DerivedStats"   ATK/Flee/... f("all above")
**/

/*** types ***/
export type SessionBonus = BaseStatsAs<number> & {
    debug: string
}

/*** definitons ***/

/*** service ***/
@Injectable({ providedIn: 'root' })
export class TTSessionInfoV3Service {
    /* injects */
    private readonly _core = inject(TTCoreServiceV3);

    /* job data */
    jobClassName = signal('');
    jobClass: Signal<DBJob | undefined>;

    /* level */
    levelMax: Signal<{ base: number, job: number }>;
    level = signal({
        base: SESSION_INFO_DEFAULT.baseLevel,
        job: SESSION_INFO_DEFAULT.jobLevel
    });

    /* base stats */
    baseStats: WritableSignal<BaseStatsAs<number>> = signal({ ...SESSION_INFO_DEFAULT.baseStats });

    /* total stats */
    stats: Signal<BaseStatsAs<number>>;
    /* secondory stats */
    atk: Signal<number>;
    hit: Signal<number>;
    aspd: Signal<number>;
    crit: Signal<number>;
    flee: Signal<number>;
    maxHp: Signal<number>;
    maxSp: Signal<number>;
    matkMin: Signal<number>;
    matkMax: Signal<number>;
    baseAtk: Signal<number>;
    perfectDodge: Signal<number>;
    // def: Signal<never>;

    /* bonus VERY BIG ONE */
    bonus: Signal<SessionBonus>;

    /* equip */
    equip: WritableSignal<SessionEquip> = signal({ ...SESSION_INFO_DEFAULT.equip });

    constructor() {
        /* wait for core to be loaded */
        effect(() => {
            if (this._core.$loaded()) {
                const allJobs = this._core.allJobNames;
                this.jobClassName.set(allJobs[0]);
            }
        })

        /* create computed signals */
        this.jobClass = computed(() => {
            let newClass = this._core.jobDB.get(this.jobClassName());
            return newClass;
        });
        this.stats = computed(() => {
            let bonus = this.bonus();
            let baseStats = this.baseStats();

            return {
                agi: baseStats.agi + bonus.agi,
                str: baseStats.str + bonus.str,
                vit: baseStats.vit + bonus.vit,
                int: baseStats.int + bonus.int,
                dex: baseStats.dex + bonus.dex,
                luk: baseStats.luk + bonus.luk
            }
        });
        this.levelMax = computed(() => {
            const jobClass = this.jobClass();
            if (jobClass) {
                untracked(() => {
                    const level = this.level();
                    if (level.job > jobClass.maxJobLv) {
                        this.level.set({
                            base: level.base,
                            job: jobClass.maxJobLv
                        });
                    }
                })
                return {
                    base: TTCoreService.MAX_LVL,
                    job: jobClass.maxJobLv
                }
            }
            else {
                return {
                    base: TTCoreService.MAX_LVL,
                    job: 10
                }
            }

        });
        this.bonus = computed(() => {
            // TODO: 
            let res: SessionBonus = {
                ...BONUS_DEFAULT
            };
            // trigers
            let jobClass = this.jobClass();
            let level = this.level();

            // job level stats bonus
            if (jobClass) {
                for (let stat in jobClass.jobBonus) {
                    let bonus = jobClass.jobBonus[stat as BaseStatsNames].reduce((sum, bonusAt) => {
                        if (bonusAt <= level.job) {
                            return sum + 1;
                        }
                        else {
                            return sum;
                        }
                    }, 0);
                    res[stat] = bonus;
                }
            }

            return res;
        });

        this.maxHp = computed(() => this._computeHpSp('HP'));
        this.maxSp = computed(() => this._computeHpSp('SP'));
        this.baseAtk = computed(() => this._computeBaseAtk());
        this.atk = computed(() => this._computeAtk());
        this.hit = computed(() => this._computeHit());
        this.flee = computed(() => this._computeFlee());
        this.aspd = computed(() => this._computeAspd());
        this.crit = computed(() => this._computeCrit());
        this.perfectDodge = computed(() => this._computePerfectDodge());
        this.matkMin = computed(() => this._computeMatk('MIN'));
        this.matkMax = computed(() => this._computeMatk('MAX'));

        /* effects */
        // update equips if job class changes
        effect(() => {
            const job = this.jobClass();
            if (job) {
                untracked(() => {
                    // const equip = this.equip();
                    // const jobMask = Number(job.mask);
                    // let update = false;
                    // // right hand type
                    // if (!job.compatibleWeapons.includes(equip.rightHandType)) {
                    //     equip.rightHandType = 'Unarmed';
                    //     equip.rightHand = 'Unarmed'
                    //     update = true;
                    // }
                    // // left hand type
                    // const jobClassName = untracked(() => this.jobClassName());
                    // let allowedLeftHandTypes: WeaponTypeLeft[] = ['Unarmed', 'Shield'];
                    // if (jobClassName.includes('Assassin')) {
                    //     allowedLeftHandTypes = [...job.compatibleWeapons, 'Shield'];
                    // }
                    // if (!allowedLeftHandTypes.includes(equip.leftHandType)) {
                    //     equip.leftHandType = 'Unarmed';
                    //     update = true;
                    // }
                    // // upper headgear
                    // if (!this.canWearItem(jobMask, Number(this._core.headgearDbV2.Upper[equip.upperHg].job))) {
                    //     equip.upperHg = SESSION_INFO_DEFAULT.equip.upperHg;
                    //     update = true;
                    // }
                    // // middle headgear
                    // if(!this.canWearItem(jobMask, Number(this._core.headgearDbV2.Middle[equip.middleHg].job))){
                    //     equip.middleHg = SESSION_INFO_DEFAULT.equip.middleHg;
                    //     update = true;
                    // }
                    // // lower headgear
                    // if(!this.canWearItem(jobMask, Number(this._core.headgearDbV2.Lower[equip.lowerHg].job))){
                    //     equip.middleHg = SESSION_INFO_DEFAULT.equip.lowerHg;
                    //     update = true;
                    // }
                    // // armor
                    // if(!this.canWearItem(jobMask, Number(this._core.armorDbV2[equip.armor].job))){
                    //     equip.armor = SESSION_INFO_DEFAULT.equip.armor;
                    //     update = true;
                    // }
                    // // garment
                    // if(!this.canWearItem(jobMask, Number(this._core.garmentDbV2[equip.garment].job))){
                    //     equip.garment = SESSION_INFO_DEFAULT.equip.garment;
                    //     update = true
                    // }
                    // // shoes
                    // if(!this.canWearItem(jobMask, Number(this._core.shoesDbV2[equip.shoes].job))){
                    //     equip.shoes = SESSION_INFO_DEFAULT.equip.shoes;
                    //     update = true;
                    // }
                    // // accessory
                    // if(!this.canWearItem(jobMask, Number(this._core.accessoryDbV2[equip.rhAccessory].job))){
                    //     equip.rhAccessory = SESSION_INFO_DEFAULT.equip.rhAccessory;
                    //     update = true;
                    // }
                    // if(!this.canWearItem(jobMask, Number(this._core.accessoryDbV2[equip.lhAccessory].job))){
                    //     equip.lhAccessory = SESSION_INFO_DEFAULT.equip.lhAccessory;
                    //     update = true;
                    // }

                    // if (update) {
                    //     this.equip.set({ ...equip });
                    // }
                })
            }
        });
    }

    /*** private functions ***/
    private _computeHpSp(mode: 'HP' | 'SP'): number {
        /* triggers */
        const stats = this.stats();
        const level = this.level();
        const job = this.jobClass();

        if (job) {
            let maxHpSp: number = 0;
            let valueTable: number[];
            let maxHpSpBonus: number = 0;
            let maxHpSpRateBonus: number = 0;
            let stateValue: number;
            /* get values for HP or SP */
            if (mode === "HP") {
                valueTable = job.hpTable;
                stateValue = stats.vit;
                // TODO
                // maxHpSpBonus = this._sessionInfoData.activeBonus.maxHp;
                // maxHpSpRateBonus = this._sessionInfoData.activeBonus.maxHpRate;
            }
            else {
                valueTable = job.spTable
                stateValue = stats.int;
                // TODO
                // maxHpSpBonus = this._sessionInfoData.activeBonus.maxSp;
                // maxHpSpRateBonus = this._sessionInfoData.activeBonus.maxSpRate;
            }
            /* calculate values */
            maxHpSp = Math.floor(
                valueTable[level.base - 1] *
                (1 + stateValue / 100) *
                (job.isTrans ? 1.25 : 1)
            );
            maxHpSp += maxHpSpBonus
            maxHpSp = Math.floor(
                maxHpSp *
                (1 + maxHpSpRateBonus / 100)
            )
            return maxHpSp;
        }
        else {
            return 0;
        }
    }
    private _computeBaseAtk(): number {
        /* triggers */
        const stats = this.stats();

        /* varbs */
        let baseAtk = 0;
        let datk = 0;

        // TODO
        let isDexBased = false;

        if (isDexBased) {
            datk = Math.floor(stats.dex / 10) * Math.floor(stats.dex / 10);
            baseAtk =
                stats.dex +
                datk +
                Math.floor(stats.str / 5) +
                Math.floor(stats.luk / 5);
        } else {
            datk = Math.floor(stats.str / 10) * Math.floor(stats.str / 10);
            baseAtk =
                stats.str +
                datk +
                Math.floor(stats.dex / 5) +
                Math.floor(stats.luk / 5);
        }

        // TODO
        // SC_INCATKRATE is applied on base attack
        // baseAtk +=
        //     this._sessionInfoData.activeBonus.atk +
        //     this._sessionInfoData.activeBonus.scAtkPotion +
        //     this._sessionInfoData.activeBonus.scIncAtkRate;


        return baseAtk;
    }
    private _computeAtk(): number {
        /* triggers */
        const baseAtk = this.baseAtk();

        /* varbs */
        let atk = 0;

        // TODO
        // let rhWeaponAtk: number = 0;
        // let rhWeaponType = this._sessionInfoData.equip.rightHandType;
        // if (rhWeaponType && this._sessionInfoData.equip.rightHand)
        //     rhWeaponAtk = this.core.weaponDbV2[rhWeaponType][this._sessionInfoData.equip.rightHand].attack;

        // // Update left hand information
        // let lhWeaponAtk: number = 0;
        // let lhWeaponType = this._sessionInfoData.equip.leftHandType;
        // if (this._isDualWielding && this._sessionInfoData.equip.leftHand && (lhWeaponType !== 'Shield'))
        //     lhWeaponAtk = this.core.weaponDbV2[lhWeaponType][this._sessionInfoData.equip.leftHand].attack;

        // // but SC_INCATKRATE is also applied on weapon attack

        // this._sessionInfoData.weaponAtk =
        //     rhWeaponAtk +
        //     lhWeaponAtk +
        //     this._sessionInfoData.activeBonus.scIncAtkRate;
        // this._atk = baseAtk + this._sessionInfoData.weaponAtk;
        atk = baseAtk;

        return atk;
    }
    private _computeHit(): number {
        /* trigger */
        const level = this.level();
        const stats = this.stats();

        /* varbs */
        let hit = level.base +
            stats.dex;
        // TODO
        // +
        // this._sessionInfoData.activeBonus.flee +
        // this._sessionInfoData.activeBonus.scHitFood;

        return hit;
    }
    private _computeFlee(): number {
        /* triggers */
        const level = this.level();
        const stats = this.stats();

        /* varbs */
        let flee = level.base +
            stats.agi
        // TODO
        // +
        // this._sessionInfoData.activeBonus.flee +
        // this._sessionInfoData.activeBonus.scFleeFood;

        return flee;
    }
    private _computeAspd(): number {
        /* triggers */
        const job = this.jobClass();
        const stats = this.stats();

        /* varbs */
        let aspd = 0;
        // let asdpRate = 1000 - this._sessionInfoData.activeBonus.aspdRate * 10;
        let aspdRate = 1000;
        let attackMotion = 0;

        // TODO
        // Consider aspd potion and increase aspd rate status change
        // asdpRate -=
        //     this._sessionInfoData.activeBonus.scAspdPotion -
        //     this._sessionInfoData.activeBonus.scIncAspdRate;

        if (job) {
            // attackMotion = job.baseAspd[this._sessionInfoData.equip.rightHandType];

            // if (this._isDualWielding)
            //     attackMotion = Math.floor(
            //         (attackMotion + this._jobClass.baseAspd[this._sessionInfoData.equip.leftHandType]) * 0.7
            //     );

            // attackMotion =
            //     attackMotion -
            //     Math.floor((attackMotion * (4 * stats.agi + stats.dex)) / 1000);
            // attackMotion = attackMotion - this._sessionInfoData.activeBonus.aspd * 10;
        }

        attackMotion = Math.floor((attackMotion * aspdRate) / 1000);
        aspd = Math.min(Math.floor((2000 - attackMotion) / 10), 190);

        return aspd;
    }
    private _computeCrit(): number {
        /* triggers */
        const stats = this.stats();

        let crit = Math.floor(
            1 +
            stats.luk / 3
            // TODO:
            // +
            // this._sessionInfo['activeBonus']['crit'] +
            // this._sessionInfo['activeBonus']['scIncCrit']
        );

        return crit;
    }
    private _computePerfectDodge(): number {
        /* triggers */
        const stats = this.stats();

        let pd = Math.floor(
            1 +
            stats.luk * 0.1
            // TODO
            // +
            // this._sessionInfo['activeBonus']['perfectDodge'] +
            // this._sessionInfo['activeBonus']['scPdFood']
        );

        return pd;
    }
    private _computeMatk(mode: 'MIN' | 'MAX'): number {
        /* triggers */
        const stats = this.stats();

        const dInt = stats.int * stats.int;

        let factor;
        if (mode === 'MIN') {
            factor = 49;
        }
        else {
            factor = 25;
        }
        let matk = Math.floor(
            stats.int +
            dInt / factor
            // TODO
            //  +
            // this._sessionInfo['activeBonus']['matk'] +
            // this._sessionInfo['activeBonus']['scMatkPotion']
        );

        // TODO
        // matk = Math.floor(
        //     matk * (1 + this._sessionInfo['activeBonus']['matkRate'] / 100)
        // );

        return matk;
    }

    /*** public functions ***/
    public canWearItem(jobMask: number, itemMask: number): boolean {
        return (itemMask & jobMask) == jobMask
    }
}