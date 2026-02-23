/*** imports ***/
import { computed, effect, inject, Injectable, Signal, signal, untracked, WritableSignal } from "@angular/core";
import { BaseStatsAs, BaseStatsNames, BattleCalcEntry, CardLocations, DBItemCombo, DBJob, ItemLocations, RefineLocations, SessionBonus, SessionEquip, WeaponTypeLeft } from "./models.v3";
import { createEmptySessionBonus, SESSION_INFO_DEFAULT } from "./session-info-default";
import { TTCoreService } from "./tt-core.service";
import { TTCoreServiceV3 } from "./tt-core.v3.service";
import { TTBonusEngineService } from "./tt-bonus-engine.service";

/** Dependencies 
 * BaseStats        Pure-Stats without any bonus
 * Equip            Pure equip
 * Refines          Pure refines
 * Bonus            f(BaseStats, Job, Equip, Refines)          
 * TotalStats       f(BaseStats, Bonus)
 * "DerivedStats"   ATK/Flee/... f("all above")
**/

/*** types ***/
type CardState = {
    armor: number;
    garment: number;
    leftHand: number[];
    rightHand: number[];
    shoes: number;
    upperHg: number;
    lhAccessory: number;
    rhAccessory: number;
    middleHg: number;
};

/*** definitons ***/
const SESSION_EQUIP_DEFAULT: SessionEquip = {
    armor: 0,
    garment: 0,
    leftHand: 0,
    leftHandType: 'Unarmed',
    lowerHg: 0,
    middleHg: 0,
    rightHand: 0,
    rightHandType: 'Unarmed',
    rhAccessory: 0,
    lhAccessory: 0,
    shoes: 0,
    upperHg: 0
}

/*** service ***/
@Injectable({ providedIn: 'root' })
export class TTSessionInfoV3Service {
    /* injects */
    private readonly _core = inject(TTCoreServiceV3);
    private readonly _bonusEngine = inject(TTBonusEngineService);

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
    totalStats: Signal<BaseStatsAs<number>>;
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
    equip: WritableSignal<SessionEquip> = signal({ ...SESSION_EQUIP_DEFAULT });

    /* refines */
    refines: WritableSignal<Record<RefineLocations, number>> = signal({
        armor: 0,
        garment: 0,
        leftHand: 0,
        rightHand: 0,
        shoes: 0,
        upperHg: 0
    });

    /* cards */
    private _cardsState: WritableSignal<CardState> = signal({
        armor: 0,
        garment: 0,
        leftHand: [0],
        rightHand: [0],
        shoes: 0,
        upperHg: 0,
        lhAccessory: 0,
        rhAccessory: 0,
        middleHg: 0
    });
    cards = this._cardsState.asReadonly();

    /* item combos */
    itemCombos: Signal<DBItemCombo[]>;

    /* battle calcs */
    private _battleCalcID: number = 0; // for generating unique IDs for battle calcs
    private _battleCalcsPVM: WritableSignal<BattleCalcEntry[]> = signal([
        {
            ID: this._getBattleCalcID(),
            target: 1751
        },
        {
            ID: this._getBattleCalcID(),
            target: 1708
        }
    ]);
    battleCalcsPVM = this._battleCalcsPVM.asReadonly();

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
        this.totalStats = computed(() => {
            let bonus = this.bonus();
            let baseStats = this.baseStats();

            return {
                agi: baseStats.agi + bonus.stats.agi,
                str: baseStats.str + bonus.stats.str,
                vit: baseStats.vit + bonus.stats.vit,
                int: baseStats.int + bonus.stats.int,
                dex: baseStats.dex + bonus.stats.dex,
                luk: baseStats.luk + bonus.stats.luk
            };
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
        this.bonus = computed(() => this._computeBonus());
        this.itemCombos = computed(() => this._computeItemCombos());
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
                    const equip = this.equip();
                    const jobMask = Number(job.mask);
                    let update = false;
                    // right hand type
                    let wT = equip.rightHandType;
                    if (wT === 'Unarmed' || !job.compatibleWeapons.includes(wT)) {
                        equip.rightHandType = 'Unarmed';
                        equip.rightHand = 0;
                        update = true;
                    }
                    // left hand type
                    const jobClassName = untracked(() => this.jobClassName());
                    let allowedLeftHandTypes: WeaponTypeLeft[] = ['Unarmed', 'Shield'];
                    if (jobClassName.includes('Assassin')) {
                        allowedLeftHandTypes = [...job.compatibleWeapons, 'Shield'];
                    }
                    if (!allowedLeftHandTypes.includes(equip.leftHandType)) {
                        equip.leftHandType = 'Unarmed';
                        update = true;
                    }
                    // upper headgear
                    let upperHg = this._core.headgearDB.get(equip.upperHg);
                    if (!upperHg || !this._core.canWearItem(jobMask, upperHg)) {
                        equip.upperHg = SESSION_EQUIP_DEFAULT.upperHg;
                        update = true;
                    }
                    // middle headgear
                    let middleHg = this._core.headgearDB.get(equip.middleHg);
                    if (!middleHg || !this._core.canWearItem(jobMask, middleHg)) {
                        equip.middleHg = SESSION_EQUIP_DEFAULT.middleHg
                        update = true;
                    }
                    // lower headgear
                    let lowerHg = this._core.headgearDB.get(equip.lowerHg);
                    if (!lowerHg || !this._core.canWearItem(jobMask, lowerHg)) {
                        equip.middleHg = SESSION_EQUIP_DEFAULT.lowerHg;
                        update = true;
                    }
                    // armor
                    let armor = this._core.armorDB.get(equip.armor);
                    if (!armor || !this._core.canWearItem(jobMask, armor)) {
                        equip.armor = SESSION_EQUIP_DEFAULT.armor;
                        update = true;
                    }
                    // garment
                    let gar = this._core.garmentDB.get(equip.garment);
                    if (!gar || !this._core.canWearItem(jobMask, gar)) {
                        equip.garment = SESSION_EQUIP_DEFAULT.garment;
                        update = true
                    }
                    // shoes
                    let shoes = this._core.shoesDB.get(equip.shoes);
                    if (!shoes || !this._core.canWearItem(jobMask, shoes)) {
                        equip.shoes = SESSION_EQUIP_DEFAULT.shoes;
                        update = true;
                    }
                    // accessory
                    let accR = this._core.accessoryDB.get(equip.rhAccessory);
                    let accL = this._core.accessoryDB.get(equip.lhAccessory);
                    if (!accR || !this._core.canWearItem(jobMask, accR)) {
                        equip.rhAccessory = SESSION_EQUIP_DEFAULT.rhAccessory;
                        update = true;
                    }
                    if (!accL || !this._core.canWearItem(jobMask, accL)) {
                        equip.lhAccessory = SESSION_EQUIP_DEFAULT.lhAccessory;
                        update = true;
                    }

                    if (update) {
                        this.equip.set({ ...equip });
                    }
                })
            }
        });

        // update card slots based on types & equip
        effect(() => {
            // TODO: only reduce card slots instead of restet-ing all?
            const equip = this.equip();
            const cards = untracked(() => this._cardsState());
            const slotsLH = cards.leftHand.length;
            const slotsRH = cards.rightHand.length;
            let update = false;

            /* left hand (type) */
            if (equip.leftHandType === 'Shield') {
                if (slotsLH != 1) {
                    cards.leftHand = [0];
                    update = true;
                }
            }
            else {
                const weapon = this._core.weaponDB.get(equip.leftHand);
                if (weapon) {
                    if (slotsLH !== weapon.slots) {
                        cards.leftHand = new Array(weapon.slots).fill(0);
                        update = true;
                    }
                }
                else if (slotsLH !== 1) {
                    cards.leftHand = [0];
                    update = true;
                }
            }

            /* right hand */
            const weaponRH = this._core.weaponDB.get(equip.rightHand);
            if (weaponRH) {
                if (slotsRH !== weaponRH.slots) {
                    cards.rightHand = new Array(weaponRH.slots).fill(0);
                    update = true;
                }
            }
            else if (slotsRH !== 1) {
                /* reset to one slot TODO: or zero? */
                cards.rightHand = [0];
                update = true;
            }

            /* update */
            if (update) {
                this._cardsState.set({ ...cards });
            }
        });
    }

    /*** public functions ***/
    public updateCard(key: keyof CardState, val: number, slot = -1) {
        this._cardsState.update(cards => {
            if (key === 'leftHand' || key === 'rightHand') {
                if (slot >= 0) {
                    let arr = cards[key];
                    arr[slot] = val;
                    cards[key] = [...arr];  // create new array to trigger change-detection
                }
                else {
                    cards[key] = [val];
                }
            }
            else {
                cards[key] = val;
            }

            return { ...cards };
        });
    }
    public addBattleCalcPVM(target: number) {
        const newEntry: BattleCalcEntry = {
            ID: this._getBattleCalcID(),
            target: target
        };
        this._battleCalcsPVM.update(prev => [...prev, newEntry]);
    }
    public removeBattleCalcPVM(id: number) {
        this._battleCalcsPVM.update(prev => prev.filter(e => e.ID !== id));    // TODO: does it trigger change detection if we filter the same array? or do we need to spread it like [...prev.filter(...)]?
    }
    public updateBattleCalcPVM(id: number, target: number) {
        this._battleCalcsPVM.update(prev => prev.map(e => e.ID === id ? { ...e, target: target } : e));
    }

    /*** private functions ***/
    private _computeHpSp(mode: 'HP' | 'SP'): number {
        /* triggers */
        const stats = this.totalStats();
        const level = this.level();
        const job = this.jobClass();
        const bonus = this.bonus();

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
                maxHpSpBonus = bonus.stats.maxHP;
                maxHpSpRateBonus = bonus.stats.maxHPRate;
            }
            else {
                valueTable = job.spTable
                stateValue = stats.int;
                maxHpSpBonus = bonus.stats.maxSP
                maxHpSpRateBonus = bonus.stats.maxSPRate;
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
        const stats = this.totalStats();

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
        const stats = this.totalStats();

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
        const stats = this.totalStats();

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
        const stats = this.totalStats();

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
        const stats = this.totalStats();

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
        const stats = this.totalStats();

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
        const stats = this.totalStats();
        const bonus = this.bonus();

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
            dInt / factor +
            bonus.stats.matk
            // TODO
            //  +
            // this._sessionInfo['activeBonus']['scMatkPotion']
        );

        // TODO
        matk = Math.floor(
            matk * (1 + bonus.stats.matkRate / 100)
        );

        return matk;
    }
    private _computeItemCombos(): DBItemCombo[] {
        const res: DBItemCombo[] = [];
        /* trigger */
        const cards = this._cardsState();
        const equip = this.equip();

        /* create map with item ids and counter how many of each */
        const itemCnt: Map<number, number> = new Map();
        for (const cardSlot in cards) {
            const card = cards[cardSlot as keyof CardState];
            if (typeof card === 'number') {
                if (card > 0) {
                    itemCnt.set(card, (itemCnt.get(card) ?? 0) + 1);
                }
            }
            else {
                for (const cardId of card) {
                    if (cardId > 0) {
                        itemCnt.set(cardId, (itemCnt.get(cardId) ?? 0) + 1);
                    }
                }
            }
        }
        for (const equipSlot in equip) {
            if (equipSlot === 'leftHandType' || equipSlot === 'rightHandType') continue;
            const itemId = equip[equipSlot as keyof SessionEquip] as number;
            if (itemId > 0) {
                itemCnt.set(itemId, (itemCnt.get(itemId) ?? 0) + 1);
            }
        }
        /** loop over all combos and than check:
         * - n = max("cnt of all needed items")
         * - add combo n*times to list
         */
        for (const combo of this._core.itemComboDB) {
            let amount = 0;
            for (const itemId of combo.items) {
                let curCnt = itemCnt.get(itemId) ?? 0;
                if (curCnt === 0) {
                    // item missing
                    amount = 0;
                    break;
                }
                if (curCnt > amount) amount = curCnt;
            }
            /* add combo to result */
            for (let i = 0; i < amount; i++) {
                res.push(combo); // TODO: or do we need spread operator?
            }
        }
        return res;
    }

    private _computeBonus() {
        let res: SessionBonus = createEmptySessionBonus();
        // trigers
        let jobClass = this.jobClass();
        let level = this.level();
        let equip = this.equip();
        let baseStats = this.baseStats();
        let refines = this.refines();
        let cards = this._cardsState();
        let combos = this.itemCombos();

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
                res.stats[stat] = bonus;
            }
        }

        /* equip bonus */
        for (let equipSlot in equip) {
            if (equipSlot === 'leftHandType' || equipSlot === 'rightHandType') continue;
            let itemId = equip[equipSlot as keyof SessionEquip] as number;
            let item = this._core.itemDB.get(itemId);
            if (item && item.itemScript) {
                this._bonusEngine.applyBonus(res, item.itemScript);
            }
        }

        /* card bonus */
        for (let cardSlot in cards) {
            const cardId = cards[cardSlot];
            if (typeof cardId === 'number') {
                /* single card */
                const card = this._core.cardDB.get(cardId);
                if (card && card.itemScript) {
                    this._bonusEngine.applyBonus(res, card.itemScript);
                }
            }
            else {
                /* multiple cards */
                for (const slotId of cardId as number[]) {
                    const card = this._core.cardDB.get(slotId);
                    if (card && card.itemScript) {
                        this._bonusEngine.applyBonus(res, card.itemScript);
                    }
                }
            }
        }

        /* combo bonus */
        for (const combo of combos) {
            if (combo.effect) this._bonusEngine.applyBonus(res, combo.effect);
        }

        /* debug */
        // console.log('Computing bonus');
        // console.log(res);
        return res;
    }

    private _getBattleCalcID(): number {
        return this._battleCalcID++;
    }
}