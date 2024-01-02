import { Injectable } from "@angular/core";
import { ActiveFood, Armor, BaseStatsNames, BattleCalcInfo, Card, Food, FoodDB_V2, FoodStatsNames, FoodStatsObj, Item, ItemLocations, JobDB_V2, JobDbEntry, ObjWithKeyString, MobRace, SessionCard, SessionChangeEvent, SessionEquip, SessionEquipBase, SessionInfoV2, Skill, VanillaMode, Weapon, WeaponType, WeaponTypeLeft, Element } from "./models";
import { TTCoreService } from "./tt-core.service";
import { BehaviorSubject, Observable, Subject, debounceTime, distinctUntilChanged, filter } from "rxjs";
import { SESSION_INFO_DEFAULT } from "./session-info-default";

export type SkillList = {
    [key: string]: Skill
};
export type SessionInfoMsg = {
    event: SessionChangeEvent,
    data: SessionInfoV2
}

@Injectable({
    providedIn: 'root',
})
export class TTSessionInfoV2Service {
    /* DB object of current selected class */
    private _jobClassName!: string;
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

    /* skills */
    private _buffSkills: SkillList;
    private _activeSkills: SkillList;
    private _passiveSkills: SkillList;
    private _buffSkills$: BehaviorSubject<SkillList>;
    private _activeSkills$: BehaviorSubject<SkillList>;
    private _passiveSkills$: BehaviorSubject<SkillList>;
    public buffSkills$: Observable<SkillList>;
    public activeSkills$: Observable<SkillList>;
    public passiveSkills$: Observable<SkillList>;

    /* session info for current build */
    private _sessionInfoData: SessionInfoV2 = SESSION_INFO_DEFAULT;
    private _sessionInfo: BehaviorSubject<SessionInfoMsg>;
    public sessionInfo$: Observable<SessionInfoMsg>;

    /* battle calcs */
    private _battleCalcID: number;
    private _battleCalcPVMData: BattleCalcInfo[];
    private _battleCalcPVM: BehaviorSubject<BattleCalcInfo[]>;
    public battleCalcPVM$: Observable<BattleCalcInfo[]>;

    /* chaches */
    private _rightHandLast: string;
    private _leftHandLast: string;

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

        this._buffSkills = {};
        this._activeSkills = {};
        this._passiveSkills = {};
        this._buffSkills$ = new BehaviorSubject({});
        this._activeSkills$ = new BehaviorSubject({});
        this._passiveSkills$ = new BehaviorSubject({});

        this._sessionInfo = new BehaviorSubject<SessionInfoMsg>({
            event: SessionChangeEvent.INIT,
            data: this._sessionInfoData
        });

        /* create observabel */
        this.sessionInfo$ = this._sessionInfo.asObservable();
        this.buffSkills$ = this._buffSkills$.asObservable();
        this.activeSkills$ = this._activeSkills$.asObservable();
        this.passiveSkills$ = this._passiveSkills$.asObservable();

        this._battleCalcID = 1;
        this._battleCalcPVMData = [];
        this._battleCalcPVM = new BehaviorSubject<BattleCalcInfo[]>(this._battleCalcPVMData);
        this.battleCalcPVM$ = this._battleCalcPVM.asObservable();

        /* init chaches */
        this._rightHandLast = '_';
        this._leftHandLast = '_';

        /* subscripe to trigger event which debounce the calcuation / publish until a specific time */
        // this._triggerSessionInfoCalc.asObservable().pipe(debounceTime(1000)).subscribe((_) => {
        //     /* now trigger the calcuation */
        //     this.calcSessionInfo();
        // });

        /* wait until core is loaded */
        this.core.loaded$.pipe(distinctUntilChanged()).subscribe((_) => {
            if (_) {
                this._jobClassName = Object.keys(this.core.jobDbV2)[0];
                this._jobClass = this.core.jobDbV2[this._jobClassName];
                this.updateSessionInfo(SessionChangeEvent.INIT);

                /* DEBUG TODO */
                this._battleCalcPVMData.push(
                    {
                        id: this.getBattleCalcID(),
                        target: 'Valkyrie Randgris'
                    },
                    {
                        id: this.getBattleCalcID(),
                        target: 'Hardrock Mammoth'
                    }
                );
                this._battleCalcPVM.next(this._battleCalcPVMData);
            }
        });
    }

    /*** public methods ***/
    eventFilter(...events: SessionChangeEvent[]) {
        return filter<SessionInfoMsg>((val) => {
            if (events.includes(val.event)) {
                return true;
            }
            else {
                return false;
            }
        })
    }
    eventFilterExcept(...events: SessionChangeEvent[]) {
        return filter<SessionInfoMsg>((val) => {
            if (events.includes(val.event)) {
                return false;
            }
            else {
                return true;
            }
        });
    }
    addBattleCalcPVM(target: string) {
        this._battleCalcPVMData.push({
            id: this.getBattleCalcID(),
            target: target
        });
        this._battleCalcPVM.next(this._battleCalcPVMData);
    }
    removeBattleCalcPVM(id: number) {
        let idx = this._battleCalcPVMData.findIndex((val, idx) => val.id === id);
        if (idx >= 0) {
            this._battleCalcPVMData.splice(idx, 1);
            this._battleCalcPVM.next(this._battleCalcPVMData);
        }
    }
    updateBattleCalcPVM(id: number, target: string) {
        let idx = this._battleCalcPVMData.findIndex((val, idx) => val.id === id);
        if (idx >= 0) {
            this._battleCalcPVMData[idx].target = target;
            this._battleCalcPVM.next(this._battleCalcPVMData);
        }
    }
    getDefReduction(targetClass: 'boss' | 'normal', race: MobRace, element: Element): number {
        return (
            this._sessionInfoData.activeBonus.ignoreDefClass.all +
            this._sessionInfoData.activeBonus.ignoreDefClass[targetClass] +
            this._sessionInfoData.activeBonus.ignoreDefRace[race] +
            this._sessionInfoData.activeBonus.ignoreDefElement[element]
        );
    }
    getMdefReduction(targetClass: 'boss' | 'normal', race: MobRace, element: Element): number {
        return (
            this._sessionInfoData.activeBonus.ignoreMdefClass.all +
            this._sessionInfoData.activeBonus.ignoreMdefClass[targetClass] +
            this._sessionInfoData.activeBonus.ignoreMdefRace[race] +
            this._sessionInfoData.activeBonus.ignoreMdefElement[element]
        );
    }

    /*** public methods (Session info change events) ***/
    changeClass(className: keyof JobDB_V2) {
        this._jobClassName = <string>className;
        this._jobClass = this.core.jobDbV2[className];
        this.updateSessionInfo(SessionChangeEvent.CLASS);
    }
    changeLevel(baseLvl: number, jobLvl: number) {
        this._sessionInfoData.baseLevel = baseLvl;
        this._sessionInfoData.jobLevel = jobLvl;
        this.updateSessionInfo(SessionChangeEvent.LEVEL);
    }
    changeBaseStats(stats: { [key in BaseStatsNames]: number }) {
        this._sessionInfoData.baseStats = { ...stats };
        this.updateSessionInfo(SessionChangeEvent.BASE_STATS);
    }
    changeRefine(equip: ItemLocations, refine: number) {
        this._sessionInfoData.refine[equip] = refine;
        this.updateSessionInfo(SessionChangeEvent.REFINE);
    }
    changeRefines(refines: SessionEquipBase<number>) {
        this._sessionInfoData.refine = { ...refines };
        this.updateSessionInfo(SessionChangeEvent.REFINE);
    }
    changeEquip(equipLocation: keyof SessionEquip, equip: string | WeaponType) {
        /* change gear */
        if ((equipLocation === 'leftHandType') || (equipLocation === 'rightHandType')) {
            this._sessionInfoData.equip[equipLocation] = equip as WeaponType;
            /* reset weapon */
            if (equipLocation === 'leftHandType') {
                if (equip === 'Unarmed') {
                    /* reset to Unarmed */
                    this._sessionInfoData.equip.leftHand = 'Unarmed';
                }
                else {
                    /* reset to "None" */
                    this._sessionInfoData.equip.leftHand = '';
                }
                this._leftHandLast = '_';   // trigger hand slots reset
                /* reset current card in when switchting to shield */
                if (equip === 'Shield') {
                    this._sessionInfoData.card.leftHand = [''];
                }
            }
            else {
                /* right hand type */
                if (equip === 'Unarmed') {
                    /* reset to Unarmed */
                    this._sessionInfoData.equip.rightHand = 'Unarmed';
                }
                else {
                    /* reset to "None" */
                    this._sessionInfoData.equip.rightHand = '';
                }
            }
        }
        else {
            this._sessionInfoData.equip[equipLocation] = equip;
        }
        /* update session */
        this.updateSessionInfo(SessionChangeEvent.EQUIP);
    }
    changeVanillaMode(mode: VanillaMode) {
        this._sessionInfoData.vanillaMode = mode;
        this.updateSessionInfo(SessionChangeEvent.VANILLA_MODE);
    }
    changeCard(cardLocation: keyof SessionCard, card: string, slot: number = -1) {
        if ((cardLocation === 'leftHand' || cardLocation === 'rightHand')) {
            // TODO: check if array is already fine or idx is not to big
            if (slot >= 0) {
                this._sessionInfoData.card[cardLocation][slot] = card;
            }
        }
        else {
            this._sessionInfoData.card[cardLocation] = card;
        }
        this.updateSessionInfo(SessionChangeEvent.CARD);
    }
    changeActiveBuff(skillName: string, value: boolean | number) {
        this._sessionInfoData.activeBuff[skillName] = value;
        this.updateSessionInfo(SessionChangeEvent.ACTIVE_BUFF);
    }
    changePassiveBuff(skillName: string, value: number) {
        this._sessionInfoData.passiveSkill[skillName] = value;
        this.updateSessionInfo(SessionChangeEvent.PASSIVE_SKILL);
    }

    /*** private methods ***/
    private updateSessionInfo(event: SessionChangeEvent) {
        this.resetBonus();
        this.updateClassSpecificData();
        this.updateHandSlots();
        this.updateEquipBonus();
        this.updateFoodBonus();
        this.updateStats();

        /* HP / SP */
        this._maxHp = this.computeHpSp(this._vit, "HP");
        this._maxSp = this.computeHpSp(this._int, "SP");

        this.computeAttackSpeed();

        // All weapons with ammunitions are considered as DEX type
        let isDexBased: boolean = this._sessionInfoData.ammoType !== undefined;   // TODO

        this.computeHit();
        this.computeFlee();
        this.computePerfectDodge();
        this.computeAtk(isDexBased);
        this.computeMatk();
        this.computeCriticalRate();

        /* publish data */
        this._buffSkills$.next(this._buffSkills);
        this._activeSkills$.next(this._activeSkills);
        this._passiveSkills$.next(this._passiveSkills);
        this._sessionInfo.next({
            event: event,
            data: this._sessionInfoData
        });
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
        /* skills */
        // clean up
        this._buffSkills = {};
        this._activeSkills = {};
        this._passiveSkills = {};
        if (this._jobClass) {
            let jobMask = Number(this._jobClass.mask);
            for (let skillName in this.core.skillDbV2) {
                let skill = this.core.skillDbV2[skillName];
                let skillMatchJob = (Number(skill.job) & jobMask) === jobMask;
                if (skill.isBuff) {
                    this._buffSkills[skillName] = skill;
                }
                else if (skill.isActive && skillMatchJob) {
                    this._activeSkills[skillName] = skill;
                }
                else if (skill.isPassive && skillMatchJob) {
                    this._passiveSkills[skillName] = skill;
                }
            }
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
    private updateEquipBonus() {
        // Retrieve bonus from equipment
        // define dual wielding
        if (this._sessionInfoData.equip.leftHandType === 'Shield' || this._sessionInfoData.equip.leftHandType === 'Unarmed') {
            this._isDualWielding = false;
        }
        else {
            this._isDualWielding = true;
        }
        // weapon / right hand
        if (
            this._sessionInfoData.equip.rightHandType &&
            this._sessionInfoData.equip.rightHand
        ) {
            let rhBonus: string = this.core.weaponDbV2[this._sessionInfoData.equip.rightHandType][this._sessionInfoData.equip.rightHand].bonus;
            if (rhBonus) eval(rhBonus)(this._sessionInfoData.activeBonus);
        }

        if (
            this._sessionInfoData.equip.leftHandType &&
            this._sessionInfoData.equip.leftHand &&
            'Unarmed' != this._sessionInfoData.equip.leftHand
        ) {
            let lhBonus: string = '';

            if (this._isDualWielding && this._sessionInfoData.equip.leftHandType !== 'Shield')
                lhBonus = this.core.weaponDbV2[this._sessionInfoData.equip.leftHandType][this._sessionInfoData.equip.leftHand].bonus;
            else
                lhBonus = this.core.shieldDbV2[this._sessionInfoData.equip.leftHand].bonus;

            if (lhBonus) eval(lhBonus)(this._sessionInfoData.activeBonus);
        }

        if (this._sessionInfoData.equip.upperHg) {
            this.evalBonus(this.core.headgearDbV2.Upper[this._sessionInfoData.equip.upperHg]);
        }

        if (this._sessionInfoData.equip.middleHg) {
            this.evalBonus(this.core.headgearDbV2.Middle[this._sessionInfoData.equip.middleHg]);
        }

        if (this._sessionInfoData.equip.lowerHg) {
            this.evalBonus(this.core.headgearDbV2.Lower[this._sessionInfoData.equip.lowerHg]);
        }

        if (this._sessionInfoData.equip.armor) {
            this.evalBonus(this.core.armorDbV2[this._sessionInfoData.equip.armor]);
        }

        if (this._sessionInfoData.equip.garment) {
            this.evalBonus(this.core.garmentDbV2[this._sessionInfoData.equip.garment]);
        }

        if (this._sessionInfoData.equip.shoes) {
            this.evalBonus(this.core.shoesDbV2[this._sessionInfoData.equip.shoes]);
        }

        if (this._sessionInfoData.equip.rhAccessory) {
            this.evalBonus(this.core.accessoryDbV2[this._sessionInfoData.equip.rhAccessory]);
        }

        if (this._sessionInfoData.equip.lhAccessory) {
            this.evalBonus(this.core.accessoryDbV2[this._sessionInfoData.equip.lhAccessory]);
        }

        // Apply skill bonus which are ignoring cards/enchants bonus

        // Retrieve bonus from cards
        for (let location in this._sessionInfoData.card) {
            let locationKey = location as keyof SessionCard;
            if (typeof this._sessionInfoData.card[locationKey] === 'string' && this._sessionInfoData.card[locationKey]) {
                this.evalBonus(this.core.cardDbV2[this._sessionInfoData.card[locationKey] as string]);
            }
            else {
                for (let card of this._sessionInfoData.card[locationKey]) {
                    if (card) {
                        this.evalBonus(this.core.cardDbV2[card]);
                    }
                }
            }
        }

        // TODO: Retrieve bonus from enchants
    }
    private updateFoodBonus() {
        for (let category in this._sessionInfoData.activeFood) {
            let catKey = category as keyof ActiveFood;
            for (let foodKey in this._sessionInfoData.activeFood[catKey]) {
                let foodName: string;
                let foodInfo: Food;
                // TODO: how ti make this more universal?
                if (catKey === "Stats") {
                    let foodNameKey = foodKey as keyof FoodStatsObj<string>;
                    /* its a STATS food */
                    foodName = this._sessionInfoData.activeFood[catKey][foodNameKey] as string;
                    foodInfo = this.core.foodDbV2.Stats[foodNameKey][foodName];
                }
                else {
                    /* it a regular food */
                    if (this._sessionInfoData.activeFood[catKey][foodKey]) {
                        foodName = foodKey;
                        let foodDbCat = <ObjWithKeyString<Food>>this.core.foodDbV2[catKey];
                        foodInfo = foodDbCat[foodName];
                    }
                    else {
                        /* food not active */
                        break;
                    }
                }
                this.evalBonus(foodInfo);
            }
        }
    }
    private computeAttackSpeed() {
        let asdpRate = 1000 - this._sessionInfoData.activeBonus.aspdRate * 10;

        // Consider aspd potion and increase aspd rate status change
        asdpRate -=
            this._sessionInfoData.activeBonus.scAspdPotion -
            this._sessionInfoData.activeBonus.scIncAspdRate;

        let attackMotion = this._jobClass.baseAspd[this._sessionInfoData.equip.rightHandType];

        if (this._isDualWielding)
            attackMotion = Math.floor(
                (attackMotion + this._jobClass.baseAspd[this._sessionInfoData.equip.leftHandType]) * 0.7
            );

        attackMotion =
            attackMotion -
            Math.floor((attackMotion * (4 * this._agi + this._dex)) / 1000);
        attackMotion = attackMotion - this._sessionInfoData.activeBonus.aspd * 10;

        attackMotion = Math.floor((attackMotion * asdpRate) / 1000);
        this._aspd = Math.min(Math.floor((2000 - attackMotion) / 10), 190);
    }
    private computeHit() {
        this._hit =
            this._sessionInfoData.baseLevel +
            this._dex +
            this._sessionInfoData.activeBonus.flee +
            this._sessionInfoData.activeBonus.scHitFood;
    }
    private computeFlee() {
        this._flee =
            this._sessionInfoData.baseLevel +
            this._agi +
            this._sessionInfoData.activeBonus.flee +
            this._sessionInfoData.activeBonus.scFleeFood;
    }
    private computePerfectDodge() {
        this._perfectDodge = Math.floor(
            1 +
            this._luk * 0.1 +
            this._sessionInfoData.activeBonus.perfectDodge +
            this._sessionInfoData.activeBonus.scPdFood
        );
    }
    private computeAtk(isDexBased: boolean) {
        this._baseAtk = 0;
        let datk = 0;

        if (isDexBased) {
            datk = Math.floor(this._dex / 10) * Math.floor(this._dex / 10);
            this._baseAtk =
                this._dex +
                datk +
                Math.floor(this._str / 5) +
                Math.floor(this._luk / 5);
        } else {
            datk = Math.floor(this._str / 10) * Math.floor(this._str / 10);
            this._baseAtk =
                this._str +
                datk +
                Math.floor(this._dex / 5) +
                Math.floor(this._luk / 5);
        }

        // SC_INCATKRATE is applied on base attack
        this._baseAtk +=
            this._sessionInfoData.activeBonus.atk +
            this._sessionInfoData.activeBonus.scAtkPotion +
            this._sessionInfoData.activeBonus.scIncAtkRate;

        let rhWeaponAtk: number = 0;
        let rhWeaponType = this._sessionInfoData.equip.rightHandType;
        if (rhWeaponType && this._sessionInfoData.equip.rightHand)
            rhWeaponAtk = this.core.weaponDbV2[rhWeaponType][this._sessionInfoData.equip.rightHand].attack;

        // Update left hand information
        let lhWeaponAtk: number = 0;
        let lhWeaponType = this._sessionInfoData.equip.leftHandType;
        if (this._isDualWielding && this._sessionInfoData.equip.leftHand && (lhWeaponType !== 'Shield'))
            lhWeaponAtk = this.core.weaponDbV2[lhWeaponType][this._sessionInfoData.equip.leftHand].attack;

        // but SC_INCATKRATE is also applied on weapon attack

        this._sessionInfoData.weaponAtk =
            rhWeaponAtk +
            lhWeaponAtk +
            this._sessionInfoData.activeBonus.scIncAtkRate;
        this._atk = this._baseAtk + this._sessionInfoData.weaponAtk;

        // FIXME: Manage

        // FIXME: Manage Concentration

        // FIXME: Manage bAtkRate
    }
    private computeMatk() {
        let dint = this._int * this._int;
        this._minMatk = Math.floor(
            this._int +
            dint / 49 +
            this._sessionInfoData.activeBonus.matk +
            this._sessionInfoData.activeBonus.scMatkPotion
        );
        this._maxMatk = Math.floor(
            this._int +
            dint / 25 +
            this._sessionInfoData.activeBonus.matk +
            this._sessionInfoData.activeBonus.scMatkPotion
        );

        this._minMatk = Math.floor(
            this._minMatk * (1 + this._sessionInfoData.activeBonus.matkRate / 100)
        );
        this._maxMatk = Math.floor(
            this._maxMatk * (1 + this._sessionInfoData.activeBonus.matkRate / 100)
        );
    }
    private computeCriticalRate() {
        this._crit = Math.floor(
            1 +
            this._luk / 3 +
            this._sessionInfoData.activeBonus.crit +
            this._sessionInfoData.activeBonus.scIncCrit
        );
    }
    private updateHandSlots() {
        /* update card slots on weapon */
        if (this._sessionInfoData.equip.rightHand) {
            if (this._sessionInfoData.equip.rightHand != this._rightHandLast) {
                let weap = this.core.weaponDbV2[this._sessionInfoData.equip.rightHandType][this._sessionInfoData.equip.rightHand];
                // this._sessionInfoData.card.rightHand = Array.from({ length: weap.slots as number }, (_) => '');
                let diffOfCards = (weap.slots as number) - this._sessionInfoData.card.rightHand.length;
                if (diffOfCards > 0) {
                    /* add more slots */
                    this._sessionInfoData.card.rightHand.push(...Array.from({ length: diffOfCards }, (_) => ''));
                }
                else if (diffOfCards === 0) {
                    /* no diffrence */
                }
                else {
                    /* remove slots */
                    this._sessionInfoData.card.rightHand = this._sessionInfoData.card.rightHand.slice(0, diffOfCards);
                }

                // save value
                this._rightHandLast = this._sessionInfoData.equip.rightHand
            }
        }
        else {
            this._sessionInfoData.card.rightHand = [];
        }
        /* update card slots on left hand (waepon or shield) */
        if (this._leftHandLast !== this._sessionInfoData.equip.leftHand) {
            // TODO: avoid change if shield is and was selected?
            let diffOfCards = 0;
            switch (this._sessionInfoData.equip.leftHandType) {
                case 'Shield':
                    diffOfCards = 1 - this._sessionInfoData.card.leftHand.length; // only 1 slot
                    break;
                case 'Unarmed':
                    diffOfCards = - this._sessionInfoData.card.leftHand.length; // remove all
                    break;
                default:
                    /* weapon */
                    let weap = this.core.weaponDbV2[this._sessionInfoData.equip.leftHandType][this._sessionInfoData.equip.leftHand];
                    if (weap) {
                        diffOfCards = (weap.slots as number) - this._sessionInfoData.card.leftHand.length;
                    }
                    else {
                        diffOfCards = - this._sessionInfoData.card.leftHand.length; // remove all
                    }
                    break;
            }
            if (diffOfCards > 0) {
                /* add more slots */
                this._sessionInfoData.card.leftHand.push(...Array.from({ length: diffOfCards }, (_) => ''));
            }
            else if (diffOfCards === 0) {
                /* no diffrence */
            }
            else {
                /* remove slots */
                this._sessionInfoData.card.leftHand = this._sessionInfoData.card.leftHand.slice(0, diffOfCards);
            }

            // save value
            this._leftHandLast = this._sessionInfoData.equip.leftHand;
        }

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
    private evalBonus(item: { bonus: string }): void {
        let bonus: string = item.bonus;
        if (bonus) eval(bonus)(this._sessionInfoData.activeBonus);
    }
    private getBattleCalcID() {
        return this._battleCalcID++;
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
    public get jobClass(): JobDbEntry {
        return this._jobClass;
    }
    public get jobClassName(): string {
        return this._jobClassName;
    }
}