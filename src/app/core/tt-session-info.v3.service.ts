/*** imports ***/
import { computed, effect, inject, Injectable, Signal, signal, untracked, WritableSignal } from "@angular/core";
import { BaseStatsAs, BaseStatsNames, BattleCalcEntry, DBItemCombo, DBJob, DBSkill, FoodStatsNames, RefineLocations, SessionBonus, SessionEquip, SkillBuff, WeaponTypeLeft } from "./models.v3";
import { createEmptySessionBonus, SESSION_INFO_DEFAULT } from "./session-info-default";
import { BonusSubstitution, TTBonusEngineService } from "./tt-bonus-engine.service";
import { TTCoreService } from "./tt-core.service";
import { TTCoreServiceV3 } from "./tt-core.v3.service";

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
export const SESSION_EQUIP_DEFAULT: SessionEquip = {
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
    private readonly _bonusSession = inject(TTBonusEngineService);

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
    weaponAtk: Signal<number>;
    perfectDodge: Signal<number>;
    // def: Signal<never>;

    /* bonus VERY BIG ONE */
    bonus: Signal<SessionBonus>;

    /* equip */
    equip: WritableSignal<SessionEquip> = signal({ ...SESSION_EQUIP_DEFAULT });
    isDualWielding: Signal<boolean>;

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

    /* skills */
    skillsJob: Signal<DBSkill[]>;
    private _skillsBuffState: WritableSignal<SkillBuff[]> = signal([]);
    skillsBuff = this._skillsBuffState.asReadonly();
    private _skillsPassiveState: WritableSignal<SkillBuff[]> = signal([]);
    skillsPassive = this._skillsPassiveState.asReadonly();

    /* foods */
    private _foodsStatsState: WritableSignal<{ [key in FoodStatsNames]: number }> = signal({
        AGI: 0,
        DEX: 0,
        INT: 0,
        STR: 0,
        VIT: 0,
        LUK: 0
    });
    foodsStats = this._foodsStatsState.asReadonly();

    private _foodsOtherState = signal<number[]>([]);
    foodsOther = this._foodsOtherState.asReadonly();

    speedPotion: WritableSignal<number> = signal(0);


    /* battle calcs */
    private _battleCalcID: number = 0; // for generating unique IDs for battle calcs
    private _battleCalcsPVM: WritableSignal<BattleCalcEntry[]> = signal([
        // {
        //     ID: this._getBattleCalcID(),
        //     target: 1751
        // },
        // {
        //     ID: this._getBattleCalcID(),
        //     target: 1708
        // },
        {
            ID: this._getBattleCalcID(),
            target: 1918
        }
    ]);
    battleCalcsPVM = this._battleCalcsPVM.asReadonly();

    constructor() {
        /* wait for core to be loaded */
        effect(() => {
            if (this._core.$loaded()) {
                const allJobs = this._core.allJobNames;
                // this.jobClassName.set(allJobs[0]);
                this.jobClassName.set('Clown');   // FIXME: debug
            }
        })

        /* create computed signals */
        this.jobClass = computed(() => {
            let newClass = this._core.jobDB.get(this.jobClassName());
            return newClass;
        })
        this.skillsJob = computed(() => {
            let job = this.jobClass();
            if (job) {
                const jobMask = Number(job.mask);
                const skillList: DBSkill[] = [];
                for (const [skillId, skill] of this._core.skillDB) {
                    if (
                        skill.isActive &&
                        (Number(skill.job) & jobMask) == jobMask
                    ) {
                        skillList.push(skill);
                    }
                }

                return skillList;
            }
            else {
                return [];
            }
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
        this.weaponAtk = computed(() => this._computeWeaponAtk());
        this.atk = computed(() => this._computeAtk());
        this.hit = computed(() => this._computeHit());
        this.flee = computed(() => this._computeFlee());
        this.aspd = computed(() => this._computeAspd());
        this.crit = computed(() => this._computeCrit());
        this.perfectDodge = computed(() => this._computePerfectDodge());
        this.matkMin = computed(() => this._computeMatk('MIN'));
        this.matkMax = computed(() => this._computeMatk('MAX'));
        this.isDualWielding = computed(() => {
            const equip = this.equip();
            if (equip.leftHandType === 'Shield' || equip.leftHandType === 'Unarmed') {
                return false;
            }
            else {
                return true;
            }
        });


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

        // load and map buff skills
        effect(() => {
            this._core.$loaded();
            const resBuff: SkillBuff[] = [];
            for (const [skillID, skill] of this._core.skillDB) {
                let value: number | boolean;
                if (skill.isBuff && skill.type) {
                    if (skill.type === 'check') {
                        value = false;
                    }
                    else {
                        value = 0;
                    }
                    resBuff.push({
                        id: skill.id,
                        maxLevel: skill.maxLevel,
                        name: skill.name,
                        value: value,
                        type: skill.type,
                        itemScript: skill.itemScript
                    });
                }
            }
            this._skillsBuffState.set(resBuff);
        });
        // load and map passive skills
        effect(() => {
            this._core.$loaded();
            const job = this.jobClass();
            if (!job) return;
            const jobMask = Number(job.mask);
            const resPassive: SkillBuff[] = [];
            for (const [skillID, skill] of this._core.skillDB) {
                let value: number | boolean;
                if (skill.isPassive) {
                    /* passive skill */
                    const skillMask = Number(skill.job);
                    if ((skillMask & jobMask) === jobMask) {
                        resPassive.push({
                            id: skill.id,
                            name: skill.name,
                            maxLevel: skill.maxLevel,
                            type: 'list',   // FIXME: allow boolean values somehow?
                            value: 0
                        });
                    }
                }
            }
            this._skillsPassiveState.set(resPassive);
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
    public updateSkillBuff(skillId: number, value: number | boolean) {
        this._skillsBuffState.update(skills =>
            skills.map(s => s.id === skillId ? { ...s, value: value } : s)
        )
    }
    public updateSkillPassive(skillId: number, value: number) {
        // all skils will be saved as numbers
        this._skillsPassiveState.update(skills =>
            skills.map(s => s.id === skillId ? { ...s, value: value } : s)
        )
    }
    public getSkillLvlOfSkillPassive(skillId: number): number {
        let lvl = 0;
        const skill = this._skillsPassiveState().find(_ => _.id === skillId);
        if (skill) {
            lvl = skill.value as number;    // FIXME: define passive skills always as numbers?
        }
        return lvl;
    }
    public getSkillLvlOfSkillBuff(skillId: number): number {
        let lvl = 0;
        const skill = this._skillsBuffState().find(_ => _.id === skillId);
        if (skill) {
            if (typeof skill.value === 'boolean') {
                lvl = skill.value ? 1 : 0;
            }
            else {
                lvl = skill.value;
            }
        }
        return lvl;
    }
    public updateStatFood(stat: FoodStatsNames, foodId: number) {
        this._foodsStatsState.update(foods => {
            return {
                ...foods,
                [stat]: foodId
            };
        })
    }
    public toogleOtherFood(foodId: number) {
        this._foodsOtherState.update(foods => {
            if (foods.includes(foodId)) {
                /* remove */
                return foods.filter(f => f !== foodId);
            }
            else {
                /* add */
                return [...foods, foodId];
            }
        })

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
        const bonus = this.bonus();

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
        baseAtk +=
            bonus.stats.baseAtk
            //    + this._sessionInfoData.activeBonus.scAtkPotion
            + bonus.stats.scIncAtkRate;


        return baseAtk;
    }
    private _computeWeaponAtk(): number {
        /* triggers */
        const equip = this.equip();
        const bonus = this.bonus();

        // right hand
        let rhWeaponAtk: number = 0;
        const rhWeapon = this._core.weaponDB.get(equip.rightHand);
        if (rhWeapon) {
            rhWeaponAtk = rhWeapon.attack;
        }

        // left hand
        let lhWeaponAtk: number = 0;
        const lhWeapon = this._core.weaponDB.get(equip.leftHand);
        if (lhWeapon) {
            lhWeaponAtk = lhWeapon.attack;
        }
        // but SC_INCATKRATE is also applied on weapon attack

        let weaponAtk = rhWeaponAtk + lhWeaponAtk + bonus.stats.scIncAtkRate;

        return weaponAtk;
    }

    private _computeAtk(): number {
        /* triggers */
        const baseAtk = this.baseAtk();
        const weaponAtk = this.weaponAtk();

        /* varbs */
        let atk = baseAtk + weaponAtk;

        // FIXME: Manage
        // FIXME: Manage Concentration
        // FIXME: Manage bAtkRate

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
        // FIXME bonus.stats.hit
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
        const bonus = this.bonus();
        const equip = this.equip();

        /* varbs */
        let aspd = 0;
        let aspdRate = 1000 - bonus.stats.aspdRate * 10;
        let attackMotion = 0;

        // TODO
        // Consider aspd potion and increase aspd rate status change
        // asdpRate -=
        //     this._sessionInfoData.activeBonus.scAspdPotion -
        //     this._sessionInfoData.activeBonus.scIncAspdRate;

        if (job) {
            attackMotion = job.baseAspd[equip.rightHandType];

            if (this.isDualWielding())
                attackMotion = Math.floor(
                    (attackMotion + job.baseAspd[equip.leftHandType]) * 0.7
                );

            attackMotion =
                attackMotion -
                Math.floor((attackMotion * (4 * stats.agi + stats.dex)) / 1000);
            attackMotion = attackMotion - bonus.stats.aspd * 10;
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
        const res: SessionBonus = createEmptySessionBonus();
        // trigers
        const jobClass = this.jobClass();
        const level = this.level();
        const equip = this.equip();
        const baseStats = this.baseStats();
        const refines = this.refines();
        const cards = this._cardsState();
        const combos = this.itemCombos();
        const skillsBuffs = this._skillsBuffState();
        const skillsPassive = this._skillsPassiveState();
        const foodsStat = this._foodsStatsState();
        const foodsOther = this._foodsOtherState();
        const speedPot = this.speedPotion();

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

        /* create base substituion obj FIXME*/
        const bonusSubs: Partial<BonusSubstitution> = {
        }
        /* reset bonus engine */
        this._bonusSession.resetBonus(res, equip, baseStats);

        /* equip bonus */
        for (let equipSlot in equip) {
            if (equipSlot === 'leftHandType' || equipSlot === 'rightHandType') continue;
            let itemId = equip[equipSlot as keyof SessionEquip] as number;
            let item = this._core.itemDB.get(itemId);
            if (item && item.itemScript) {
                let refine = 0;
                if (equipSlot in refines) refine = refines[equipSlot];
                this._bonusSession.applyBonus(item.itemScript, { refine });
            }
        }

        /* card bonus */
        for (let cardSlot in cards) {
            const cardId = cards[cardSlot];
            /* get refine of located equip */
            let refine = 0;
            if (cardSlot in refines) refine = refines[cardSlot];
            if (typeof cardId === 'number') {
                /* single card */
                const card = this._core.cardDB.get(cardId);
                if (card && card.itemScript) {
                    this._bonusSession.applyBonus(card.itemScript, { refine });
                }
            }
            else {
                /* multiple cards */
                for (const slotId of cardId as number[]) {
                    const card = this._core.cardDB.get(slotId);
                    if (card && card.itemScript) {
                        this._bonusSession.applyBonus(card.itemScript, { refine });
                    }
                }
            }
        }

        /* combo bonus */
        // FIXME: refines for combos?
        for (const combo of combos) {
            if (combo.effect) {
                this._bonusSession.applyBonus(combo.effect);
            }
        }

        /* foods */
        // FIXME: map to one food array?
        for (const statFood in foodsStat) {
            const foodId = foodsStat[statFood as FoodStatsNames];
            if (foodId > 0) {
                const food = this._core.itemDB.get(foodId);
                if (food && food.itemScript) {
                    this._bonusSession.applyBonus(food.itemScript);
                }
            }
        }
        for (const foodId of foodsOther) {
            if (foodId > 0) {
                const food = this._core.itemDB.get(foodId);
                if (food && food.itemScript) {
                    this._bonusSession.applyBonus(food.itemScript);
                }
            }
        }

        /* buffs */
        for (const buff of skillsBuffs) {
            if (buff.value && buff.itemScript) {
                let lvl: number;
                if (typeof buff.value === 'boolean') {
                    lvl = 1;
                }
                else {
                    lvl = buff.value;
                }
                this._bonusSession.applyBonus(buff.itemScript, {
                    customSubs: {
                        subSkillLvl: lvl
                    }
                })
            }
        }
        /* passive skills */
        for (const passive of skillsPassive) {
            if (passive.value) {
                // FIXME
            }
        }
        /* speed potion */
        if (speedPot > 0) {
            const item = this._core.itemDB.get(speedPot);
            if (item && item.itemScript) {
                this._bonusSession.applyBonus(item.itemScript);
            }
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