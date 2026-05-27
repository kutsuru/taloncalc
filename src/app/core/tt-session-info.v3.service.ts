/*** imports ***/
import { computed, effect, inject, Injectable, Signal, signal, untracked, WritableSignal } from "@angular/core";
import { BonusID, BonusSubstitution, TTBonusEngineService } from "./item-script/tt-bonus-engine.service";
import { createEmptySessionBonus, defaultBaseStats, defaultEquipSlotState, SESSION_INFO_DEFAULT } from "./session-info-default";
import { TTCoreService } from "./tt-core.service";
import { TTCoreServiceV3 } from "./tt-core.v3.service";
import { BaseStatsAs, BaseStatsNames, BattleCalcEntry, CLASS_SPECIFIC_SQI, ClassWithSQI, DBItemCombo, DBJob, DBSkill, DBSkillEnum, DBWeaponTypeKey, DBWeaponTypeLeft, EQUIP_META, EquipSlotState, EquipState, FoodStatsNames, ItemLocations, SessionBonus, SkillBuff } from "./tt-models.v3";
import { DefaultMap, DefaultMaxMap, isTwoHandedWeapon } from "./utils";
import { BuildData, TTBodyBuilderService } from "./tt-body-builder.service";
import { TTSnackbarService } from "../tt-snackbar/tt-snackbar.service";

/**
 * FIXME FIXME FIXME FIXME FIXME 
 * FIXME #### Generel #### FIXME
 * FIXME FIXME FIXME FIXME FIXME
 * - Soul-Link (bonus) effects
 *      - [Priest Link] adds heal 20% more with [Heal] and 15% with [Sanctuary]
 *      - [Wizard Link] adds ignore 50% of Holy/Shadow element Fire/Water/Wind/Earth Resistance
 *      - Auto-Cast [Acid Terror] when attacking at [Alchemist Spirit] level, auto-Cast [Holy Cross] when attacking at [Crusader Spirit] level
 *      - Auto-Cast [Frost Joker] when attacking at [Bard Dancer Spirit] level
 */

/** Signal dependency graph for TTSessionInfoV3Service */
/*
 * See docs/tt-session-info-v3-service-signal-graph.md for the full signal dependency tree.
 *
 * This service uses Angular signals for:
 *   - raw inputs and state storage
 *   - computed values derived from those inputs
 *   - effects that update signals in response to other signal changes
 */

/*** types ***/
/*** definitons ***/
export const DEF_PER_REFINE = 2 / 3;
export const SQI_BONUS_CNT_MAX = 4;

/*** service ***/
@Injectable({ providedIn: 'root' })
export class TTSessionInfoV3Service {
    /* injects */
    readonly #core = inject(TTCoreServiceV3);
    readonly #bonusSession = inject(TTBonusEngineService);
    readonly #bodyBuilder = inject(TTBodyBuilderService);
    readonly #snackBar = inject(TTSnackbarService);

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
    baseStatsPure: WritableSignal<BaseStatsAs<number>> = signal(defaultBaseStats());
    baseStats: Signal<BaseStatsAs<number>>;
    jobBonusStats: Signal<BaseStatsAs<number>>;
    statPointsRemaining: Signal<number>;

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
    def: Signal<number>;
    // mdef: Signal<number>;    // FIXME

    /* bonus VERY BIG ONE */
    bonus: Signal<SessionBonus>;

    /* equip */
    #equipmentState: WritableSignal<EquipState> = signal(
        Object.fromEntries(
            Object.keys(EQUIP_META).map(slot => [slot, defaultEquipSlotState()])
        ) as EquipState
    );
    equipment = this.#equipmentState.asReadonly();
    // FIXME: react on job changes
    rightHandType: WritableSignal<DBWeaponTypeKey> = signal('Unarmed');
    leftHandType: WritableSignal<DBWeaponTypeLeft> = signal('Shield');

    isDualWielding: Signal<boolean>;
    /* sqi */
    sqiEquipped: Signal<number>;
    #sqiBonusState: WritableSignal<string[]> = signal([]);
    sqiBonus = this.#sqiBonusState.asReadonly();

    /* item combos */
    itemCombos: Signal<DBItemCombo[]>;

    /* skills */
    skillsJob: Signal<DBSkill[]>;
    #skillsBuffState: WritableSignal<SkillBuff[]> = signal([]);
    skillsBuff = this.#skillsBuffState.asReadonly();
    #skillsPassiveState: WritableSignal<SkillBuff[]> = signal([]);
    skillsPassive = this.#skillsPassiveState.asReadonly();

    /* foods */
    #foodsStatsState: WritableSignal<{ [key in FoodStatsNames]: number }> = signal({
        AGI: 0,
        DEX: 0,
        INT: 0,
        STR: 0,
        VIT: 0,
        LUK: 0
    });
    foodsStats = this.#foodsStatsState.asReadonly();

    #foodsOtherState = signal<number[]>([]);
    foodsOther = this.#foodsOtherState.asReadonly();

    /* others */
    speedPotion: WritableSignal<number> = signal(0);
    pet: WritableSignal<number> = signal(0);

    /* autobonus map */
    // FIXME: add to builder
    // FIXME: cleanup when autobonus is no longer present
    #autoBonusState = signal<BonusID[]>([]);
    autoBonus = this.#autoBonusState.asReadonly();

    /* battle calcs */
    #battleCalcID: number = 0; // for generating unique IDs for battle calcs
    #battleCalcsPVM: WritableSignal<BattleCalcEntry[]> = signal([
        // {
        //     ID: this._getBattleCalcID(),
        //     target: 1751
        // },
        // {
        //     ID: this._getBattleCalcID(),
        //     target: 1708
        // },
        {
            ID: this.#getBattleCalcID(),
            target: 1002
        }
    ]);
    battleCalcsPVM = this.#battleCalcsPVM.asReadonly();

    constructor() {
        /* wait for core to be loaded */
        effect(() => {
            if (this.#core.$loaded()) {
                const allJobs = this.#core.allJobNames;
                this.jobClassName.set(allJobs[0]);

                // DEBUG BUILD 1
                // this.jobClassName.set('Lord Knight');   // FIXME: debug
                // this.updateRightHandType("One-Handed Spear");
                // this.updateEquipmentId("rightHand", 1430);
                // this._sqiBonusState.set(["1430_12", "1430_8"]);

                // DEBUG BUILD 2
                this.jobClassName.set('Paladin');
                // this.updateRightHandType("Whip");
                // this.updateEquipmentId('rightHand', 1990);
                this.updateEquipmentId('leftHand', 2150);
                this.updateRightHandType("One-Handed Sword");
                this.updateEquipmentId('rightHand', 13421);
            }
        })

        /* create computed signals */
        this.jobClass = computed(() => {
            let newClass = this.#core.jobDB.get(this.jobClassName());
            return newClass;
        })
        this.skillsJob = computed(() => {
            let job = this.jobClass();
            if (job) {
                const jobMask = Number(job.mask);
                const skillList: DBSkill[] = [];
                for (const [skillId, skill] of this.#core.skillDB) {
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
        this.baseStats = computed(() => {
            const baseStatsPure = this.baseStatsPure();
            const stats = { ...baseStatsPure };

            /* SN no death bonus counts as base stats */
            if (this.getSkillPassiveLvl('SN_NO_DEATH_BONUS') > 0) {
                stats.agi += 10;
                stats.dex += 10;
                stats.int += 10;
                stats.luk += 10;
                stats.str += 10;
                stats.vit += 10;
            }

            return stats;
        })
        this.jobBonusStats = computed(() => {
            const jobClass = this.jobClass();
            const level = this.level();
            const stats = defaultBaseStats();

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
                    stats[stat] = bonus;
                }
            }

            return stats;
        });
        this.totalStats = computed(() => {
            let bonus = this.bonus();
            let baseStats = this.baseStats();
            let jobBonusStats = this.jobBonusStats();

            return {
                agi: baseStats.agi + bonus.stats.agi + jobBonusStats.agi,
                str: baseStats.str + bonus.stats.str + jobBonusStats.str,
                vit: baseStats.vit + bonus.stats.vit + jobBonusStats.vit,
                int: baseStats.int + bonus.stats.int + jobBonusStats.int,
                dex: baseStats.dex + bonus.stats.dex + jobBonusStats.dex,
                luk: baseStats.luk + bonus.stats.luk + jobBonusStats.luk
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
        this.bonus = computed(() => this.#computeBonus());
        this.itemCombos = computed(() => this.#computeItemCombos());
        this.maxHp = computed(() => this.#computeHpSp('HP'));
        this.maxSp = computed(() => this.#computeHpSp('SP'));
        this.baseAtk = computed(() => this.#computeBaseAtk());
        this.weaponAtk = computed(() => this.#computeWeaponAtk());
        this.atk = computed(() => this.#computeAtk());
        this.hit = computed(() => this.#computeHit());
        this.flee = computed(() => this.#computeFlee());
        this.aspd = computed(() => this.#computeAspd());
        this.crit = computed(() => this.#computeCrit());
        this.perfectDodge = computed(() => this.#computePerfectDodge());
        this.matkMin = computed(() => this.#computeMatk('MIN'));
        this.matkMax = computed(() => this.#computeMatk('MAX'));
        this.isDualWielding = computed(() => {
            // FIXME
            const lhType = this.leftHandType();
            if (lhType === 'Shield' || lhType === 'Unarmed') {
                return false;
            }
            else {
                return true;
            }
        });
        this.def = computed(() => this.#computeDEF());
        this.sqiEquipped = computed(() => {
            const equip = this.#equipmentState();
            const jobClassName = this.jobClassName();

            if (!(jobClassName in CLASS_SPECIFIC_SQI)) return 0;    // class without SQI

            const sqiID = CLASS_SPECIFIC_SQI[jobClassName as ClassWithSQI];

            // FIXME: how to handle SN with link?
            const equipedIDs = Object.values(equip).map(_ => _.item);

            return equipedIDs.includes(sqiID) ? sqiID : 0;
        });
        this.statPointsRemaining = computed(() => {
            const baseStats = this.baseStats();
            const baseLevel = this.level().base;
            const job = this.jobClass();

            /* total calc */
            let total = 48;
            if (job && job.isTrans) {
                total = 100;
            }
            for (let lvl = 1; lvl < baseLevel; lvl++) {
                total += Math.floor(lvl / 5) + 3;
            }
            /* used calc */
            let used = 0;
            for (const curStatVal of Object.values(baseStats)) {
                for (let i = 2; i <= curStatVal; i++) {
                    used += Math.floor((i - 2) / 10) + 2;
                }
            }

            return total - used;
        });

        /* effects */
        // update rightHandtype when job changes
        effect(() => {
            const job = this.jobClass();
            // FIXME
            /*
            let wT = equip.rightHandType;
                    if (wT === 'Unarmed' || !job.compatibleWeapons.includes(wT)) {
                        equip.rightHandType = 'Unarmed';
                        equip.rightHand = 0;
                        update = true;
                    }
            // left hand type
                    const jobClassName = untracked(() => this.jobClassName());
                    let allowedLeftHandTypes: DBWeaponTypeLeft[] = ['Unarmed', 'Shield'];
                    if (jobClassName.includes('Assassin')) {
                        allowedLeftHandTypes = [...job.compatibleWeapons, 'Shield'];
                    }
                    if (!allowedLeftHandTypes.includes(equip.leftHandType)) {
                        equip.leftHandType = 'Unarmed';
                        update = true;
                    }
            */
        });
        // update equips if job class changes
        effect(() => {
            const job = this.jobClass();
            if (job) {
                untracked(() => {
                    const equipUpdated = { ...this.#equipmentState() };
                    const jobMask = Number(job.mask);
                    let update = false;
                    for (const slot in equipUpdated) {
                        const equipSlot = equipUpdated[slot as ItemLocations];
                        if (equipSlot.item > 0) {
                            const item = this.#core.itemDB.get(equipSlot.item);
                            if (!item || !this.#core.canWearItem(jobMask, item)) {
                                // cant wear create new empty item
                                equipUpdated[slot] = defaultEquipSlotState();
                                update = true;
                            }
                        }
                    }
                    if (update) {
                        this.#equipmentState.set(equipUpdated);
                    }
                })
            }
        });

        // load and map buff skills
        effect(() => {
            this.#core.$loaded();
            const resBuff: SkillBuff[] = [];
            for (const [skillID, skill] of this.#core.skillDB) {
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
                        enum: skill.enum,
                        value: value,
                        type: skill.type,
                        itemScript: skill.itemScript
                    });
                }
            }
            this.#skillsBuffState.set(resBuff);
        });
        // load and map passive skills
        effect(() => {
            this.#core.$loaded();
            const job = this.jobClass();
            if (!job) return;
            const jobMask = Number(job.mask);
            const resPassive: SkillBuff[] = [];
            for (const [skillID, skill] of this.#core.skillDB) {
                let value: number | boolean;
                if (skill.isPassive) {
                    /* passive skill */
                    const skillMask = Number(skill.job);
                    if ((skillMask & jobMask) === jobMask) {
                        resPassive.push({
                            id: skill.id,
                            name: skill.name,
                            enum: skill.enum,
                            maxLevel: skill.maxLevel,
                            type: 'list',   // FIXME: allow boolean values somehow?
                            value: 0
                        });
                    }
                }
            }
            this.#skillsPassiveState.set(resPassive);
        });
        // clear SQI bonus, if the SQI changes
        effect(() => {
            const sqiID = this.sqiEquipped(); // everytime it changes
            if (sqiID === 0) {
                /* set to empty */
                this.#sqiBonusState.set([]);
            }
            else {
                /* remove bonis of wrong SQI */
                this.#sqiBonusState.update(bonis => {
                    return bonis.filter(b => b.startsWith(sqiID.toString()));
                });
            }
        });
    }

    /*** public functions ***/
    public updateEquipment(slot: ItemLocations, update: Partial<EquipSlotState>) {
        // FIXME: correct slots etc
        this.#equipmentState.update(old => ({
            ...old,
            [slot]: { ...old[slot], ...update }
        }));
    }
    public updateEquipmentId(slot: ItemLocations, itemId: number) {
        let newItem = defaultEquipSlotState();
        if (itemId > 0) {
            const dbItem = this.#core.itemDB.get(itemId);
            newItem.item = itemId;
            if (dbItem) {
                if (newItem.cards.length != dbItem.slots) {
                    newItem.cards = Array(dbItem.slots).fill(0);
                }
                if (dbItem.enchant) {
                    newItem.enchants = Array(dbItem.enchant.length).fill(0);
                }
            }
        }
        this.updateEquipment(slot, newItem);
    }
    public updateCard(slot: ItemLocations, cardId: number, cardSlot: number = 0) {
        let cards = this.#equipmentState()[slot].cards.map((val, idx) => idx === cardSlot ? cardId : val);
        this.updateEquipment(slot, { cards });
    }
    public updateEnchant(slot: ItemLocations, enchantSlot: number, enchantId: number) {
        const enchants = this.#equipmentState()[slot].enchants.map((val, idx) => idx === enchantSlot ? enchantId : val);
        this.updateEquipment(slot, { enchants })
    }
    public updateRightHandType(newType: DBWeaponTypeKey) {
        this.rightHandType.set(newType);
        /* update equip */
        this.updateEquipmentId('rightHand', 0);
        /* set lefthand to "none" in case of 2h */
        if (isTwoHandedWeapon(newType)) {
            this.updateEquipmentId('leftHand', 0);
        }
    }
    public updateLeftHandType(newType: DBWeaponTypeLeft) {
        this.leftHandType.set(newType)
    }

    public addBattleCalcPVM(target: number) {
        const newEntry: BattleCalcEntry = {
            ID: this.#getBattleCalcID(),
            target: target
        };
        this.#battleCalcsPVM.update(prev => [...prev, newEntry]);
    }
    public removeBattleCalcPVM(id: number) {
        this.#battleCalcsPVM.update(prev => prev.filter(e => e.ID !== id));    // TODO: does it trigger change detection if we filter the same array? or do we need to spread it like [...prev.filter(...)]?
    }
    public updateBattleCalcPVM(id: number, target: number) {
        this.#battleCalcsPVM.update(prev => prev.map(e => e.ID === id ? { ...e, target: target } : e));
    }
    public updateSkillBuff(skillId: number, value: number | boolean) {
        this.#skillsBuffState.update(skills =>
            skills.map(s => s.id === skillId ? { ...s, value: value } : s)
        )
    }
    public updateSkillPassive(skillEnum: DBSkillEnum, value: number) {
        // all skils will be saved as numbers
        this.#skillsPassiveState.update(skills =>
            skills.map(s => s.enum === skillEnum ? { ...s, value: value } : s)
        )
    }
    public getSkillLvlOfSkillPassive(skillId: number): number {
        let lvl = 0;
        const skill = this.#skillsPassiveState().find(_ => _.id === skillId);
        if (skill) {
            lvl = skill.value as number;    // FIXME: define passive skills always as numbers?
        }
        return lvl;
    }
    public getSkillPassiveLvl(skillEnum: DBSkillEnum): number {
        let lvl = 0;
        const skill = this.#skillsPassiveState().find(_ => _.enum === skillEnum);
        if (skill) {
            lvl = skill.value as number;    // FIXME: define passive skills always as numbers?
        }
        return lvl;
    }

    public getSkillLvlOfSkillBuff(skillId: number): number {
        let lvl = 0;
        const skill = this.#skillsBuffState().find(_ => _.id === skillId);
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
        this.#foodsStatsState.update(foods => {
            return {
                ...foods,
                [stat]: foodId
            };
        })
    }
    public toogleOtherFood(foodId: number) {
        this.#foodsOtherState.update(foods => {
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
    public toggleSQIBonus(bonusId: string) {
        this.#sqiBonusState.update(bonis => {
            if (bonis.includes(bonusId)) {
                /* remove */
                return bonis.filter(b => b !== bonusId);
            }
            else if (bonis.length < SQI_BONUS_CNT_MAX) {
                /* add */
                return [...bonis, bonusId];
            }
            else {
                /* keep untouched */
                return [...bonis];
            }
        })
    }
    public toggleAutoBonus(bonus: BonusID) {
        this.#autoBonusState.update(ab => {
            if (ab.includes(bonus)) {
                return ab.filter(b => b !== bonus);
            }
            else {
                return [...ab, bonus];
            }
        })
    }
    public applyBuild(builder: BuildData) {
        // FIXME: destruct maybe?
        if (!this.#bodyBuilder.verifyBuild(builder)) {
            this.#snackBar.show(`Loaded build includes invalid data`, 'debug');
        }
        this.jobClassName.set(builder.jobClassName);
        this.level.set(builder.level);
        this.baseStatsPure.set(builder.baseStats);

        /* equip */
        if (builder.equip) {
            /* base equip */
            for (const slot in builder.equip) {
                const equip = builder.equip[slot as ItemLocations]!;
                this.updateEquipment(slot as ItemLocations, equip);
            }
            /* update rightHandType */
            if (builder.equip.rightHand) {
                const item = this.#core.itemDB.get(builder.equip.rightHand.item);
                if (item) {
                    this.rightHandType.set(item.subType as DBWeaponTypeKey);
                }
            }
            /* update leftHandType */
            if (builder.equip.leftHand) {
                const item = this.#core.itemDB.get(builder.equip.leftHand.item);
                if (item) {
                    this.leftHandType.set(item.subType as DBWeaponTypeLeft);    // this is either a weapon or shield
                }
            }
        }
        else {
            // FIXME: reset equip??
            // Object.fromEntries(
            //     Object.keys(EQUIP_META).map(slot => [slot, defaultEquipSlotState()])
            // ) as EquipState
        }

        /* rest */
        if (builder.sqiBonus) this.#sqiBonusState.set(builder.sqiBonus);
        if (builder.speedPotion) this.speedPotion.set(builder.speedPotion);
        if (builder.pet) this.pet.set(builder.pet);
    }

    /*** private functions ***/
    #computeHpSp(mode: 'HP' | 'SP'): number {
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
    #computeBaseAtk(): number {
        /* triggers */
        const stats = this.totalStats();
        const bonus = this.bonus();

        /* varbs */
        let baseAtk = 0;
        let datk = 0;

        const isDexBased = !!this.#core.weaponTypeDB.get(this.rightHandType())?.isDexBased;

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
        baseAtk += bonus.stats.baseAtk
            + bonus.stats.scAtkPotion
            + bonus.stats.scIncAtkRate;

        return baseAtk;
    }
    #computeWeaponAtk(): number {
        /* triggers */
        const equip = this.#equipmentState();
        const bonus = this.bonus();

        // right hand
        let rhWeaponAtk: number = 0;
        const rhWeapon = this.#core.weaponDB.get(equip.rightHand.item);
        if (rhWeapon) {
            rhWeaponAtk = rhWeapon.attack;
        }

        // left hand
        let lhWeaponAtk: number = 0;
        const lhWeapon = this.#core.weaponDB.get(equip.leftHand.item);
        if (lhWeapon) {
            lhWeaponAtk = lhWeapon.attack;
        }
        // but SC_INCATKRATE is also applied on weapon attack

        let weaponAtk = rhWeaponAtk + lhWeaponAtk + bonus.stats.scIncAtkRate + bonus.stats.weaponAtk;

        return weaponAtk;
    }

    #computeAtk(): number {
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
    #computeHit(): number {
        /* trigger */
        const level = this.level();
        const stats = this.totalStats();
        const bonus = this.bonus();

        /* varbs */
        let hit = level.base
            + stats.dex
            + bonus.stats.hit;

        // FIXME: hitRate correct used?
        hit = hit * (1 + (bonus.stats.hitRate / 100));
        // TODO
        // +
        // this._sessionInfoData.activeBonus.flee
        return hit;
    }
    #computeFlee(): number {
        /* triggers */
        const level = this.level();
        const stats = this.totalStats();
        const bonus = this.bonus();

        /* varbs */
        let flee = level.base
            + stats.agi
            + bonus.stats.flee;
        // FIXME: bonus.stats.fleeRate?
        // TODO
        // +
        // this._sessionInfoData.activeBonus.flee +
        // this._sessionInfoData.activeBonus.scFleeFood;

        return flee;
    }
    #computeAspd(): number {
        /* triggers */
        const job = this.jobClass();
        const stats = this.totalStats();
        const bonus = this.bonus();
        const lhType = this.leftHandType();
        const rhType = this.rightHandType();

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
            attackMotion = job.baseAspd[rhType]!;   // FIXME: maybe default backup value

            if (this.isDualWielding())
                attackMotion = Math.floor(
                    (attackMotion + job.baseAspd[lhType]) * 0.7
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
    #computeCrit(): number {
        /* triggers */
        const stats = this.totalStats();
        const bonus = this.bonus();

        let crit = Math.floor(
            1 + stats.luk / 3
            + bonus.stats.critical
            + bonus.stats.scIncCrit
            // TODO:
            // +
            // this._sessionInfo['activeBonus']['crit'] +
            // this._sessionInfo['activeBonus']['scIncCrit']
        );
        // FIXME: Manage following SC
        // SC_INCCRI, SC_CRIFOOD, SC_EXPLOSIONSPIRITS, SC_FORTUNE, SC_TRUESIGHT, SC_CLOAKING, SC_STRIKING

        // Double critical rate if Katar type weapon is equipped
        if (this.rightHandType() === "Katar")
            crit *= 2;

        return crit;
    }
    #computePerfectDodge(): number {
        /* triggers */
        const stats = this.totalStats();
        const bonus = this.bonus();

        let pd = Math.floor(
            1
            + stats.luk * 0.1
            + bonus.stats.flee2
            // TODO
            // +
            // this._sessionInfo['activeBonus']['perfectDodge'] +
            // this._sessionInfo['activeBonus']['scPdFood']
        );

        return pd;
    }
    #computeMatk(mode: 'MIN' | 'MAX'): number {
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
            stats.int
            + dInt / factor
            + bonus.stats.matk
            + bonus.stats.scMatkPotion
        );

        // TODO
        matk = Math.floor(
            matk * (1 + bonus.stats.matkRate / 100)
        );

        if (mode === 'MIN') {
            matk += bonus.stats.minMatk;
        }

        return matk;
    }

    #computeDEF(): number {
        const equip = this.#equipmentState();
        const bonus = this.bonus();
        const lhType = this.leftHandType();

        let def = 0;

        /* equip */
        for (const equipSlot in equip) {
            // no weapon (rightHand) or 2nd hand if not shield
            let equipSlotKey = equipSlot as ItemLocations;
            if (
                equipSlotKey === 'rightHand' ||
                (equipSlotKey === 'leftHand' && lhType !== 'Shield')) continue;

            /* gear DEF */
            const gear = this.#core.itemDB.get(equip[equipSlotKey].item);
            if (gear) {
                def += gear.defense;
            }
            /* refine DEF */
            def += DEF_PER_REFINE * equip[equipSlotKey].refine;
        }

        /* bonus */
        def += bonus.stats.def;
        def = Math.floor(def * (1 + bonus.stats.defRate / 100));

        return def;
    }
    #computeItemCombos(): DBItemCombo[] {
        const res: DBItemCombo[] = [];
        /* trigger */
        const equip = this.#equipmentState();

        /* create map with item ids and counter how many of each */
        const itemCnt = new DefaultMap(0);
        for (const equipSlotKey in equip) {
            const equipSlot = equip[equipSlotKey as ItemLocations];
            // equip
            if (equipSlot.item > 0) {
                itemCnt.set(equipSlot.item, itemCnt.get(equipSlot.item) + 1);
            }
            // cards
            for (const cardId of equipSlot.cards) {
                if (cardId > 0) {
                    itemCnt.set(cardId, itemCnt.get(cardId) + 1);
                }
            }
        }
        /** loop over all combos and than check:
         * - n = max("cnt of all needed items")
         * - add combo n*times to list
         */
        for (const combo of this.#core.itemComboDB) {
            let amount = 0;
            for (const itemId of combo.items) {
                let curCnt = itemCnt.get(itemId);
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

    #computeBonus() {
        const res: SessionBonus = createEmptySessionBonus();
        // trigers
        const jobClass = this.jobClass();
        const level = this.level();
        const equip = this.#equipmentState();
        const baseStats = this.baseStats();
        const combos = this.itemCombos();
        const skillsBuffs = this.#skillsBuffState();
        const skillsPassive = this.#skillsPassiveState();
        const foodsStat = this.#foodsStatsState();
        const foodsOther = this.#foodsOtherState();
        const speedPot = this.speedPotion();
        const sqiBonis = this.#sqiBonusState();
        const petId = this.pet();
        const autoBonus = this.#autoBonusState();
        // FIXME: how to handle getskilllv of active skills? not needed?

        /* create base substituion obj FIXME*/
        const bonusSubs: Partial<BonusSubstitution> = {
        }
        /* reset bonus engine */
        this.#bonusSession.resetBonus(res, {
            level: { ...level },
            baseStats: baseStats,
            equip: equip,
            lefhtHandtType: this.leftHandType(),
            rightHandType: this.rightHandType(),
            isPVP: false,   // FIXME: we need this in battle-service
            skills: [...skillsBuffs, ...skillsPassive],
            job: jobClass
        });

        /* equip bonus & card bonus */
        for (let equipSlotKey in equip) {
            const equipSlot = equip[equipSlotKey as ItemLocations];
            /* item bonus */
            let item = this.#core.itemDB.get(equipSlot.item);
            if (item && item.itemScript) {
                this.#bonusSession.applyBonus('item', item.ID, item.itemScript, { refine: equipSlot.refine });
            }
            /* card bonus */
            for (const cardId of equipSlot.cards) {
                const card = this.#core.itemDB.get(cardId);
                if (card && card.itemScript) {
                    // use refine of located equip
                    this.#bonusSession.applyBonus('item', card.ID, card.itemScript, { refine: equipSlot.refine });
                }
            }
            /* enchants */
            for (const enchantId of equipSlot.enchants) {
                const enchant = this.#core.itemDB.get(enchantId);
                if (enchant && enchant.itemScript) {
                    this.#bonusSession.applyBonus('item', enchant.ID, enchant.itemScript);
                }
            }
        }
        /* SQI bonus */
        const sqiID = untracked(() => this.sqiEquipped());
        if (sqiID > 0) {
            const SQI = this.#core.itemDB.get(sqiID);
            if (SQI && SQI.sqiBonus) {
                for (const bonusID of sqiBonis) {
                    const curSQIBonus = SQI.sqiBonus[bonusID];
                    // FIXME: fix all bonus scripts
                    this.#bonusSession.applyBonus('sqiBonus', bonusID, curSQIBonus.bonus);
                }
            }
        }


        /* combo bonus */
        // FIXME: refines for combos?
        for (const combo of combos) {
            if (combo.effect) {
                this.#bonusSession.applyBonus('itemCombo', 0, combo.effect);    // FIXME: if we need it...
            }
        }

        /* foods */
        // FIXME: map to one food array?
        for (const statFood in foodsStat) {
            const foodId = foodsStat[statFood as FoodStatsNames];
            if (foodId > 0) {
                const food = this.#core.itemDB.get(foodId);
                if (food && food.itemScript) {
                    this.#bonusSession.applyBonus('item', food.ID, food.itemScript);
                }
            }
        }
        for (const foodId of foodsOther) {
            if (foodId > 0) {
                const food = this.#core.itemDB.get(foodId);
                if (food && food.itemScript) {
                    this.#bonusSession.applyBonus('item', food.ID, food.itemScript);
                }
            }
        }
        /* pet */
        if (petId > 0) {
            const pet = this.#core.petDB.get(petId);
            if (pet) {
                this.#bonusSession.applyBonus('pet', pet.ID, pet.bonus);
            }
        }

        /* SKILLS */
        // loop over skills from equip/sqi/... and map them into one list and map skill enum into skill id
        // the DefaultMaxMap makes sure, the highest values stays, if same skills are in the list multiple times
        const skillsAll = new DefaultMaxMap<number>(0);
        for (const [skillid, level] of res.skills.entries()) {
            skillsAll.set(skillid, level);
        }
        // now merge skills from UI into the list */
        for (const buff of skillsBuffs) {
            if (buff.value) {
                let lvl: number;
                if (typeof buff.value === 'boolean') {
                    lvl = 1;
                }
                else {
                    lvl = buff.value;
                }
                skillsAll.set(buff.id, lvl);
            }
        }
        for (const passive of skillsPassive) {
            if (passive.value) {
                let lvl: number;
                if (typeof passive.value === 'boolean') {
                    lvl = 1;
                }
                else {
                    lvl = passive.value;
                }
                skillsAll.set(passive.id, lvl);
            }
        }

        // now run the scripts
        for (const [skillId, level] of skillsAll.entries()) {
            if (level > 0) {
                const skill = this.#core.skillDB.get(skillId);
                if (skill && skill.itemScript) {
                    this.#bonusSession.applyBonus('skill', skill.id, skill.itemScript, { customSubs: { subSkillLvl: level } });
                }
            }
        }

        /* speed potion */
        if (speedPot > 0) {
            const item = this.#core.itemDB.get(speedPot);
            if (item && item.itemScript) {
                this.#bonusSession.applyBonus('item', item.ID, item.itemScript);
            }
        }

        /* autobonus */
        for (const abID of autoBonus) {
            const abScripts = res.autoBonus.get(abID);
            if (abScripts) {
                for (const script of abScripts) {
                    this.#bonusSession.applyBonus('autoBonus', abID, script);
                }
            }
        }

        /* debug */
        // console.log('Computing bonus');
        // console.log(res);
        return res;
    }

    #getBattleCalcID(): number {
        return this.#battleCalcID++;
    }
}