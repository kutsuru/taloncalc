import { inject, Injectable, signal } from "@angular/core";
import { BaseStatsAs, DBAmmo, DBMob, DBSkill, DBElement, RefineLocations, SessionBonus, SessionEquip, EquipState, DBWeaponTypeKey, DBWeaponTypeLeft } from "./tt-models.v3";
import { TTCoreServiceV3 } from "./tt-core.v3.service";
import { TTSessionInfoV3Service } from "./tt-session-info.v3.service";

type SessionData = {
    level: { base: number, job: number },
    bonus: SessionBonus,
    statsTotal: BaseStatsAs<number>,
    equip: EquipState,
    rightHandType: DBWeaponTypeKey,
    leftHandType: DBWeaponTypeLeft,
    matk: { min: number, max: number },
    baseAtk: number,
    weaponAtk: number,
    maxHp: number,
    maxSp: number,
    FIXME: {
        acitveSpheres: number,
        sprint: number,
        eska: number,
        magnumBreak: number
    }
}

@Injectable()
export class TTBattleSessionServiceV3 {
    /* injects */
    private readonly _core = inject(TTCoreServiceV3);
    private readonly _session = inject(TTSessionInfoV3Service);

    /* results */
    minDamage = signal(0);
    maxDamage = signal(0);

    /* varbs */
    private _skill: DBSkill | undefined;
    private _skillLvl = 0;
    private _target: DBMob | undefined;
    private _isPvp = false; // FIXME
    private _ammo: DBAmmo | undefined;  // FIXME
    private _appliedEndow: DBElement | undefined;
    private _sessionData!: SessionData;

    /*** public functions ***/
    public init() {
        /* init data without calculation */
    }
    public simulate() {
        let damage: number[] = [];
        if (this._skill && this._target) {
            /* fetch all data */
            this._sessionData = {
                bonus: this._session.bonus(),
                equip: this._session.equipment(),
                rightHandType: this._session.rightHandType(),
                leftHandType: this._session.leftHandType(),
                level: this._session.level(),
                statsTotal: this._session.totalStats(),
                matk: {
                    min: this._session.matkMin(),
                    max: this._session.matkMax()
                },
                baseAtk: this._session.baseAtk(),
                weaponAtk: this._session.weaponAtk(),
                maxHp: this._session.maxHp(),
                maxSp: this._session.maxSp(),
                FIXME: {
                    acitveSpheres: 0,
                    sprint: 0,
                    eska: 0,
                    magnumBreak: 0
                }
            }
            /* start calc */
            damage = this._calcAttackDmg(false, false);
        }
        // FIXME, manage dual wielding
        this.minDamage.set(damage[0]);
        this.maxDamage.set(damage[1]);
    }
    public updateSkill(skillId: number, skillLvl: number) {
        this._skill = this._core.skillDB.get(skillId);
        this._skillLvl = skillLvl;
    }
    public updateTarget(target: DBMob | undefined) {
        this._target = target;
    }

    /*** private functions ***/
    private _calcAttackDmg(isCritAtk: boolean, isDualWielding: boolean): number[] {
        let damage = [0, 0];  // 0: Min, 1: Max

        /* mange misc skill with fixed damage */
        if (this._skill!.id == 22)
            // Throw Stone#22
            return damage.map(() => 50);
        else if (this._skill!.id == 283)
            // Pressure#283
            return damage.map(() => 500 + 300 * this._skillLvl);
        else if (this._skill!.id == 397) {
            // Throw Zeny#397
            let zeny_min_damage = 500 * this._skillLvl;
            let zeny_max_damage = zeny_min_damage * 2;
            damage = [zeny_min_damage, zeny_max_damage];

            // Damage divided by 3 on boss type monsters
            // Damage divided by 2 on players, FIXME: better handling for Taijin
            return damage.map((x) => {
                return Math.floor(
                    x / (this._target!.mode.isBoss ? 3 : this._isPvp ? 2 : 1)
                );
            });
        }


        //skill_info = retrieve_skill_info(this._skill!.id, this._activeSkill['lv']);
        // console.log('before: calcPhysicalAttackDamage');
        // console.log(damage);

        if (this._skill!.isMagicAttack)
            damage = this._calcMagicalAttackDamage(damage);
        else
            damage = this._calcPhysicalAttackDamage(isCritAtk, isDualWielding);

        // console.log('after: calcPhysicalAttackDamage');
        // console.log(damage);
        // FIXME: hits is sometimes a "script" solve this
        // damage = damage.map((x) => {
        //     return this._skill!.isConsideredAsSingleHit
        //         ? x - (x % this._skill!.hits)
        //         : x * this._skill!.hits;
        // });

        // FIXME: Lex Aeterna
        // if (this._si['activeStatus']['Lex Aeterna']) {
        //     if (this._activeSkill['isMultiHits'])
        //         // Manage multi-hit
        //         damage = this.applyDamageModifier(
        //             damage,
        //             100 + 100 / this._activeSkill['hits']
        //         );
        //     else damage = this.applyDamageModifier(damage, 200);
        // }

        // FIXME: Manage damage reduction status
        // SC_ARMORCHANGE, SC_ENERGYCOAT, SC_FOGWALL, SC_DEFENDER, SC_ASSUMPTIO

        // FIXME: Manage RC2 damage modifier

        // Asura Strike#197#321 soft cap damage management
        if (197 == this._skill!.id || 321 == this._skill!.id)
            damage = damage.map((x) => this._applyAsuraSoftCap(x));

        return damage.map((x) => Math.max(0, x));
    }

    private _calcMagicalAttackDamage(damage: number[]): number[] {
        // Initialize damage list with min matk and max matk used for status display
        damage[0] = this._sessionData.matk.min;
        damage[1] = this._sessionData.matk.max;

        if (122 == this._skill!.id) {
            // Fire Pillar#122
            damage = this._applyDamageBonus(damage, 50);
        }
        // Turn Undead#102 and Magnus Exorcismus#104 only apply on undead monsters
        else if (
            (104 == this._skill!.id || 102 == this._skill!.id) &&
            ('undead' != this._target!.race)
        ) {
            damage[0] = damage[1] = 0;
        }
        else if (102 == this._skill!.id) {
            // FIXME: Input for remaining HP to avoid managing two variables
            let targetRemainingHp = 1;
            let tuMaxChance = Math.max(
                20 * this._skillLvl +
                this._sessionData.statsTotal.luk +
                this._sessionData.statsTotal.int +
                this._sessionData.level.base +
                200 -
                (200 * targetRemainingHp) / this._target!.hp,
                700
            );
            let tuMinChance = Math.max(
                20 * this._skillLvl + this._sessionData.statsTotal.luk + this._sessionData.statsTotal.int + this._sessionData.level.base,
                700
            );

            damage[0] = this._sessionData.level.base + this._sessionData.statsTotal.int + this._skillLvl * 10;
            damage[1] = this._target!.hp;
        }
        else if (325 == this._skill!.id) {
            // Gravitation Field#325
            damage[0] = damage[1] = 200 + 200 * this._skillLvl;
        }
        // FIXME: Manage heal/sanctuary
        // skill_calc_heal(this._skill!.id, this._activeSkill['lv']);

        let skillRatio: number = this._retrieveSkillRatio();
        damage = this._applyDamageModifier(damage, skillRatio);
        damage = this._applyMagicalSkillDamageRatio(damage);
        damage = this._applyMagicalDefenseReduction(damage, this._skill!.ignoreDefense);

        // Manage Grand & Dark Cross
        if (162 == this._skill!.id) {
            // Grand Cross#162 FIXME Invalid result
            let physicalDamage = this._calcPhysicalAttackDamage(false, false);
            damage = this._applyElementDamageRatio(
                damage.map((x, idx) => {
                    return Math.floor(
                        ((x + physicalDamage[idx]) * (100 + 40 * this._skillLvl)) / 100
                    );
                })
            );
        }
        else {
            damage = this._applyElementDamageRatio(damage);
        }

        if (this._skill!.allows_modifiers) {
            // MagicAddEle
            // Damage modifier on magic element
            const magicAtkEle = this._sessionData.bonus.magicAtkEle.get(this._skill!.element as DBElement);   // FIXME: looks bad
            let elementModifier = 100 + magicAtkEle;

            // Damage modifier for monster element
            const magicAddEle = this._sessionData.bonus.magicAddEle.get(this._target!.element);
            elementModifier += magicAddEle;

            // Damage modifier for race - bMagicAddRace
            // Dragonology#234 - Increases Attack Power, MATK and DEF against Dragon type monsters by 4% per SkillLV
            const dragonologyBonus =
                this._target!.race === 'dragon'
                    ? this._session.getSkillLvlOfSkillPassive(234) * 4
                    : 0;

            const magicAddRace = this._sessionData.bonus.magicAddRace.get(this._target!.race);
            let raceModifier =
                100 +
                magicAddRace +
                dragonologyBonus;

            // Increases magical damage against bosstype monsters - bMagicAddClass,Class_Boss
            const magicAddClassTarget = this._sessionData.bonus.magicAddClass.get(this._core.getMobClass(this._target!));
            const magicAddClassAll = this._sessionData.bonus.magicAddClass.get('all');
            let classModifier =
                100 +
                magicAddClassTarget +
                magicAddClassAll;

            // bMagicAddSize - unused modifier
            // bMagicAddRace2
            const magicAddRace2 = this._sessionData.bonus.magicAddRace2.get(this._target!.race2);
            let magicAddRace2Modifier =
                100 +
                100 +
                magicAddRace2;

            // bAddMagicDamageClass - unused modifier

            let modifiers =
                (((((raceModifier / 100) * elementModifier) / 100) * classModifier) /
                    100) *
                magicAddRace2Modifier;

            damage = this._applyDamageModifier(damage, modifiers);
        }

        return damage;
    }
    private _calcPhysicalAttackDamage(isCritAtk: boolean, isDualWielding: boolean): number[] {
        // check if dex based by looking for ammoType
        let isDexBased = false;
        const weaponTypeData = this._core.weaponTypeDB.get(this._sessionData.rightHandType);
        if (weaponTypeData && weaponTypeData.ammoType) {
            isDexBased = true;
        }

        let damage = this._calcSkillBaseDamage(
            this._sessionData.baseAtk,
            isCritAtk,
            isDualWielding,
            isDexBased
        );

        // Apply skill ratio
        let skillRatio = this._retrieveSkillRatio();
        damage = this._applyDamageModifier(damage, skillRatio);
        console.log('after: applyDamageModifier : Skill Ratio = ' + skillRatio);
        console.log(damage);
        damage = this._applyPhysicalSkillDamageModifiers(damage);
        // console.log('after: applyPhysicalSkillDamageModifiers');
        // console.log(damage);
        damage = this._applyMiscDamageBonus(damage);
        // console.log('after: applyMiscDamageBonus');
        // console.log(damage);
        damage = this._applyOffensiveStatusChange(damage);
        // console.log('after: applyOffensiveStatusChange');
        // console.log(damage);
        damage = this._applyDefenseReduction(damage);
        // console.log('after: applyDefenseReduction');
        // console.log(damage);
        damage = this._applyPostDefenseDamageBonus(damage, isDualWielding);
        // console.log('after: applyPostDefenseDamageBonus');
        // console.log(damage);
        damage = this._applyElementDamageRatio(damage);
        // console.log('after: applyElementDamageRatio');
        // console.log(damage);
        damage = this._applyAdditionalElementDamage(damage, this._sessionData.baseAtk);
        // console.log('after: applyAdditionalElementDamage');
        // console.log(damage);
        // FIXME: make use of addDamageClass<mobId, rate>

        // Throw Kunai#395 bonus damage
        if (395 == this._skill!.id) damage = damage.map((x) => x + 90);

        // Weaponry Research#148 damage bonus
        damage = damage.map(
            (x) => x + 2 * this._session.getSkillLvlOfSkillPassive(148)
        );

        // Envenom#17 [TF_Poison] damage bonus
        if (17 == this._skill!.id)
            damage = damage.map((x) => x + 15 * this._skillLvl);

        // Ground Drift#437 bonus damage
        if (437 == this._skill!.id)
            damage = damage.map((x) => x + 50 * this._skillLvl);

        // Hilt Binding#146 damage bonus, does not apply to Cart Revolution#66
        if (this._skill!.id != 66 && this._session.getSkillLvlOfSkillPassive(146)) {
            damage = damage.map((x) => x + 4);
        }

        // FIXME Star Crumb bonus, does not apply to Shield Boomerang#159#384
        // if (this._skill!.id != 159 && this._skill!.id != 384)
        // ATK_ADD2(wd.damage, wd.damage2, ((wd.div_ < 1) ? 1 : wd.div_) * sd->right_weapon.star, ((wd.div_ < 1) ? 1 : wd.div_) * sd->left_weapon.star);

        // Spirit Sphere damage bonus including Flip the Coin#416 for gunslingers
        let excludedSkills = [159, 197, 321, 324, 384]; // Shield Chain#324, Shield Boomerang#159#384, Asura Strike#197#321
        if (excludedSkills.findIndex((x) => x == this._skill!.id) < 0) {
            // FIXME: Better management for sphere consumption, Triple Action#418, Investigate#193, more ?
            if (192 == this._skill!.id) {
                // FIXME: add a field for active spheres
                damage = damage.map(
                    (x) => x + 3 * Math.pow(this._sessionData.FIXME.acitveSpheres, 2)
                );
            }
            // Investigate#193 is consuming one sphere, Triple Action#418 is applying 3 times the damage bonus
            else {
                damage = damage.map(
                    (x) =>
                        x + 3 * (
                            Math.max(
                                0,
                                this._sessionData.FIXME.acitveSpheres - (193 == this._skill!.id ? 1 : 0)
                            ) +
                            (418 == this._skill!.id ? 3 : 1) * this._session.getSkillLvlOfSkillPassive(418)
                        )
                );
            }
            // FIXME: Chain Action is considering twice this bonus for base attack max damage during the trigger
        }

        // Sprint#329 unarmed bonus for Whirlwind Kick#331, Axe Kick#333, Round Kick#335 and Counter Kick#337
        if (
            [331, 333, 335, 337].findIndex((x) => x == this._skill!.id) >
            -1 &&
            'Unarmed' == this._sessionData.rightHandType  // FIXME: does this work or do we need to get the type from the weaponDB?
        ) {
            damage = damage.map((x) => x + 10 * this._sessionData.FIXME.sprint);
        }

        // Refine bonus for Shield Chain#324 and Shield Boomerang#159#384
        if ([159, 324, 385].findIndex((x) => x == this._skill!.id) > -1)
            damage = damage.map((x) => x + this._sessionData.equip.leftHand.refine * 10);

        damage = this._applyPhysicalDamageModifiers(damage, isCritAtk);

        // Soul Breaker#263 misc damage part based on source INT
        if (263 == this._skill!.id) {
            damage = damage.map((x) => x + 500 + 5 * this._skillLvl * this._sessionData.statsTotal.int);
            damage[2] += 500; // Max damage must take into consideration the random part rnd()%500
        }

        return damage;
    }
    private _applyAsuraSoftCap(asuraDamage: number): number {
        let softCap = 200000;

        if (asuraDamage > softCap) {
            let overflowDamage = asuraDamage - softCap;
            let smoothedDamage =
                1.323031 +
                0.5996693 * overflowDamage -
                0.000001183789 * overflowDamage ** 2 +
                2.125968e-12 * overflowDamage ** 3 -
                2.736422e-18 * overflowDamage ** 4 +
                1.647955e-24 * overflowDamage ** 5;
            asuraDamage = Math.floor(200000 + smoothedDamage);
        }

        return asuraDamage;
    }

    private _applyDamageBonus(damage: number[], bonus: number): number[] {
        return damage.map((x) => x + bonus);
    }

    private _applyDamageModifier(damage: number[], modifier: number): number[] {
        return damage.map((x) => Math.floor((x * modifier) / 100));
    }

    private _retrieveSkillRatio(): number {
        let skillRatio: string | number = this._skill!.ratio;
        let misc = 0; // additinal flag to compute skill ratio

        // FIXME Hatred/Brandish
        // FIXME Set misc for dedicated skills

        if (typeof skillRatio === 'string') {
            // FIXME: eval is evil, find a better way to compute the formula
            switch (this._skill!.id) {
                case 197:
                case 321:
                    misc = this._sessionData.maxSp - 1;    //FIXME:
                    break;
            }
            skillRatio = eval(skillRatio)(this._skillLvl, misc);
        }
        return (skillRatio as number) * 100;
    }

    private _applyMagicalSkillDamageRatio(damage: number[]): number[] {
        // FIXME
        // Skill damage bonus - bSkillAtk
        // FIXME: same modifier than for physical damage, merge ?

        let skillModifier = 100; /* + StPlusCalc2(5000 + this._skill!.id) + StPlusCard(5000 + this._skill!.id);

      // [Mage Class] - Increases damage of the skills [Soul Strike], [Napalm Beat] and [Napalm Vulcan] by 20%
      if (n_A_JobSearch()==5 && (46 == this._skill!.id || 47 == this._skill!.id || 277 == this._skill!.id))
          skillModifier += 20 * CardNumSearch(474);

      // RJC Katyusha Flower#1146 - [Every Refine] Increases damage of [Heaven's Drive] and [Earth Spike] by 1%
      if ((132 == this._skill!.id || 133 == this._skill!.id) && EquipNumSearch(1146))
          skillModifier += this._si['refine']['rightHand'];

      // Lacrima Stick#1169 - [Every Refine] Increases damage of [Storm Gust] by 1%
      if (131 == this._skill!.id && EquipNumSearch(1169))
          skillModifier += this._si['refine']['rightHand'];

      // Chilly Spell Book#1653 - [Every Refine] Increases damage of [Storm Gust] and [Cold Bolt] by 3%
      if ((54 == this._skill!.id || 131 == this._skill!.id) && EquipNumSearch(1653))
          skillModifier += 3 * this._si['refine']['rightHand'];

      // Noah's Hat#1247 - [Acolyte Class] Increases damage of [Holy Light] by 5% [Refine Rate > 7] Increases damage of [Holy Light] by 5%
      if (n_A_JobSearch() == 3 && (37 == this._skill!.id || 387 == this._skill!.id) && EquipNumSearch(1247))
          skillModifier += 5 + 5 * Math.floor(n_A_HEAD_DEF_PLUS / 8);
      */
        return this._applyDamageModifier(damage, skillModifier);
    }

    private _applyMagicalDefenseReduction(damage: number[], ignoreDef: boolean): number[] {
        if (!ignoreDef) {
            let mdef2 = this._target!.int + Math.floor(this._target!.vit / 2); // FIXME include mdef2 in mobdb ?

            // mdef reduction already applied on target mdef
            damage[0] = Math.max(
                1,
                Math.floor((damage[0] * (100 - this._target!.mdef)) / 100 - mdef2)
            );
            damage[1] = Math.max(
                1,
                Math.floor((damage[1] * (100 - this._target!.mdef)) / 100 - mdef2)
            );
        }

        return damage;
    }

    private _applyElementDamageRatio(damage: number[]): number[] {
        let elementRatio = 100;
        let activeElement: DBElement = 'neutral';
        let aoeDamageBonus = [100, 110, 114, 117, 119, 120];

        if (!this._skill!.ignoreElement) {
            // console.log(this.ttCoreService.elementDb);

            if ('weapon' === this._skill!.element) {
                if (this._appliedEndow) activeElement = this._appliedEndow;
                // else if (this._ammo) activeElement = this._ammo['element'];  // FIXME
                // else activeElement = this._rhWeapon['element'];  // FIXME: get weapon ele from session.stats.atkEle??
            }
            else {
                activeElement = this._skill!.element;
            }
            // TargetEle -> ActiveEle -> TargetEleLevel
            let elementModifier = this._core.elementDB[this._target!.element][activeElement][this._target!.elementLv - 1];
            elementRatio *= Math.max(elementModifier, 0);
        }

        // FIXME Volcano on fire attack
        // let volcanoLv = this._si['activeBuff']['Volcano'];
        // if (volcanoLv && activeElement == 'fire')
        //     damage = this.applyDamageModifier(damage, aoeDamageBonus[volcanoLv]);

        // FIXME Deluge on water attack
        // let delugeLv = this._si['activeBuff']['Deluge'];
        // if (delugeLv && activeElement == 'water')
        //     damage = this.applyDamageModifier(damage, aoeDamageBonus[delugeLv]);

        // FIXME Violent Gale on wind attack
        // let violentGaleLv = this._si['activeBuff']['Violent Gale'];
        // if (violentGaleLv && activeElement == 'wind')
        //     damage = this.applyDamageModifier(damage, aoeDamageBonus[violentGaleLv]);

        // Fire damage are doubled on spider web
        // FIXME: Handle monster sc
        //if (this._si['isWebbed'] && this._activeSkill['element'] == 3)
        //  damage = this.applyDamageModifier(damage, 200);
        return this._applyDamageModifier(damage, elementRatio);
    }

    private _calcSkillBaseDamage(
        baseAtk: number,
        isCritAtk: boolean,
        isDualWielding: boolean,
        isDexBased: boolean
    ): number[] {
        let damage = [0, 0];
        let skillBaseDamage = 0;

        switch (this._skill!.id) {
            case 106: // Land Mine#106
                skillBaseDamage =
                    (this._skillLvl * (this._sessionData.statsTotal.dex + 75) * (100 + this._sessionData.statsTotal.int)) / 100;
                break;
            case 112: // Blast Mine#112
                skillBaseDamage =
                    (this._skillLvl *
                        (Math.floor(this._sessionData.statsTotal.dex / 2) + 50) *
                        (100 + this._sessionData.statsTotal.int)) /
                    100;
                break;
            case 113: // Claymore Trap#113
                skillBaseDamage =
                    (this._skillLvl *
                        (Math.floor(this._sessionData.statsTotal.dex / 2) + 75) *
                        (100 + this._sessionData.statsTotal.int)) /
                    100;
                break;
            case 118: // Blitz Beat#118
            case 271: // Falcon Assault#271
                let steel_crow_lv = this._session.getSkillLvlOfSkillPassive(119);
                skillBaseDamage =
                    (Math.floor(this._sessionData.statsTotal.dex / 10) +
                        Math.floor(this._sessionData.statsTotal.int / 2) +
                        steel_crow_lv * 3 +
                        40) *
                    2;

                if (271 == this._skill!.id) {
                    skillBaseDamage *= 5; // Number of hit from Blitz Beat#118 lv 5
                    skillBaseDamage = Math.floor(
                        (skillBaseDamage * (150 + 70 * this._skillLvl)) / 100
                    ); //Falcon Assault Modifier
                }
                break;
            case 200: // Dissonance#200
                skillBaseDamage = 30 + this._skillLvl * 10;
                skillBaseDamage += 3 * this._session.getSkillLvlOfSkillPassive(198); // Musical Lesson#198
                break;
            case 284: // Sacrifice#284
                skillBaseDamage = Math.floor((this._sessionData.maxHp * 9) / 100);
                break;
            case 405: // Final Strike#405 FIXME combine + input
                //skillBaseDamage =  Math.floor(40 * stats.str + eval(document.calcForm.SkillSubNum.value) * 8 * this._skill!.id / 100);
                break;
            case 438: // Final Strike [MaxHP - 1]#438
                skillBaseDamage = Math.floor(
                    40 * this._sessionData.statsTotal.str +
                    ((this._sessionData.maxHp - 1) * 8 * this._skill!.id) / 100   // FIXME: is this correct with skillID?
                );
                break;
            case 259: // Spiral Pierce#259
                const rhWeap = this._core.weaponDB.get(this._sessionData.equip.rightHand.item);
                let spearWeight = rhWeap?.weight ?? 0;
                skillBaseDamage = Math.floor(spearWeight * 0.8) * (1 + 0.5 * this._skillLvl); // 80% of weapon's weight x ratio which only applies to weight

                // Apply STR bonus
                let dstr = Math.floor(this._sessionData.statsTotal.str / 10);
                skillBaseDamage += dstr * dstr;

                // Apply size modifier
                skillBaseDamage = Math.floor(
                    skillBaseDamage * (1.25 - this._getTargetSizeAsValue() * 0.25)
                );
                break;
            case 384: // Shield Boomerang#384 [Soul Linked]
            case 159: // Shield Boomerang#159
            case 324: // Shield Chain#324
                const shield = this._core.shieldDB.get(this._sessionData.equip.leftHand.item);
                let shieldWeight = shield?.weight ?? 0;
                skillBaseDamage = baseAtk + shieldWeight;
                break;
            case 328: // Acid Demonstration#328
                skillBaseDamage =
                    (0.7 * this._sessionData.statsTotal.int * this._sessionData.statsTotal.int * this._target!.vit) /
                    (this._sessionData.statsTotal.int + this._target!.vit);
                break;
            default:
                damage = this._calcBaseAtk(
                    baseAtk,
                    isCritAtk,
                    isDualWielding,
                    isDexBased
                );
                // console.log('after: calcBaseAtk');
                // console.log(damage);

                // Critical Attack Rate damage bonus
                if (isCritAtk)
                    damage = this._applyDamageModifier(
                        damage,
                        100 + this._sessionData.bonus.stats.critAtkRate
                    );

                // Fighting Chant#342 damage bonus - TK_POWER
                let fightingChantLv = this._session.getSkillLvlOfSkillPassive(342);
                if (fightingChantLv) {
                    // Additional Party Members for Fighting Chant#380, not including player
                    let partyMembers = 1; //SkillSearch(380) FIXME
                    damage = this._applyDamageModifier(
                        damage,
                        100 + 2 * fightingChantLv * partyMembers
                    );
                }

                break;
        }

        // Manage Poison Knife base attack
        if (306 == this._skill!.id) damage[1] += 29;

        // Manage Shuriken/Kunai base attack
        if ((394 == this._skill!.id || 395 == this._skill!.id) && this._ammo) {
            damage[1] += this._ammo.attack - 1;
        }

        if (skillBaseDamage) {
            damage[0] = skillBaseDamage;
            damage[1] = skillBaseDamage;
        }

        return damage;
    }

    // FIXME: is this correct?
    private _getTargetSizeAsValue(): number {
        if (!this._target) return 0;
        switch (this._target.size) {
            case 'small':
                return 0;
            case 'medium':
                return 1;
            case 'large':
                return 2;
            default:
                return 0;   // FIXME: Size_ALL
        }
    }

    private _applyPhysicalSkillDamageModifiers(damage: number[]): number[] {
        // FIXME
        let skillModifier = 100;

        // Hatred
        /*
        if (this._isPvp) // PvP
        {
          if (SkillSearch(354))
            skillModifier += (this._baseLv + this._str + this._luk + this._dex) / (12 - SkillSearch(354) *3);
          else if(SkillSearch(352))
            skillModifier += (this._baseLv + this._luk + this._dex) / (12 - SkillSearch(352) *3);
          else if(SkillSearch(353))
            skillModifier += (this._baseLv + this._luk + this._dex) / (12 - SkillSearch(353) *3);
        }
        else // PvM
        {
          if (SkillSearch(354) && SkillSearch(365))
            skillModifier += (this._baseLv + this._str + this._luk + this._dex) / (12 - SkillSearch(354) *3);
          else if (SkillSearch(354) && "Large" === this._target['size'] && n_B[6] >= 17392)
            skillModifier += (this._baseLv + this._str + this._luk + this._dex) / (12 - SkillSearch(354) *3);
          else if (SkillSearch(352) && "Small" === this._target['size'])
            skillModifier += (this._baseLv + this._luk + this._dex) / (12 - SkillSearch(352) *3);
          else if (SkillSearch(353) && "Medium" === this._target['size'] && n_B[6] >= 5218)
            skillModifier += (this._baseLv + this._luk + this._dex) / (12 - SkillSearch(353) *3);
        }
    
        // Berserk#258 - Double damage
        if (SkillSearch(258))
          skillModifier += 100;
    
        // Poison React[Counter]#86
        if (this._skill!.id == 86 && (50 <= n_B[3] && n_B[3] < 60))
          skillModifier += 30 * this._skill!.idLV;
    
        if (this._skill!.id == 6 && n_A_SHOES_DEF_PLUS >= 9 && CardNumSearch(362))
          skillModifier += 10;
    
        if (this._skill!.id == 76 && (n_A_WeaponType == 2 || n_A_WeaponType == 3))
          skillModifier += 25 * CardNumSearch(464);
    
        if (this._skill!.id == 41 && n_A_WeaponType == 10)
          skillModifier += 50 * CardNumSearch(465);
    
        if (this._skill!.id == 40 && this._si['refine']['rightHand'] >= 9 && EquipNumSearch(1089))
          skillModifier += 20;
    
        //custom TalonRO rental - Bow of Evil: Double Strafe damage +25%
        if (this._skill!.id == 40 && EquipNumSearch(1332))
          skillModifier += 25;
    
        //custom TalonRO rental - Katar of Speed: Sonic Blow damage +25%
        if ((this._skill!.id == 83 || this._skill!.id == 388) && EquipNumSearch(1342))
          skillModifier += 25;
    
        //custom TalonRO rental - Mace of Madness: Cart Revolution damage +25%
        if (this._skill!.id == 66 && EquipNumSearch(1343))
          skillModifier += 25;
    
        //custom TalonRO rental - Monk Knuckle: Finger Offensive damage +25%
        if (this._skill!.id == 192 && EquipNumSearch(1346))
          skillModifier += 25;
    
        //custom TalonRO rental - Phenomena Whip: Throw Arrow damage +25%
        if (this._skill!.id == 207 && EquipNumSearch(1349))
          skillModifier += 25;
    
        //custom TalonRO rental - Spear of Excellent: Magnum Break damage +25%
        if (this._skill!.id == 7 && EquipNumSearch(1352))
          skillModifier += 25;
    
        if (this._skill!.id == 272 && EquipNumSearch(1045))
          skillModifier += this._si['refine']['rightHand'] * 3;
    
        //custom TalonRO Imperial Guard: Shield Chain damage +2% each refine above 6
        if(this._skill!.id == 324 && n_A_LEFT_DEF_PLUS > 6 && EquipNumSearch(1459))
          skillModifier += 2*(n_A_LEFT_DEF_PLUS-6);
    
        // Back Stab#169
        if (this._skill!.id == 169)
        {
          //custom TalonRO Black Wing: Back Stab damage +2% each refine
          if (EquipNumSearch(1463))
            skillModifier += 2 * this._si['refine']['rightHand'];
    
          //brave assassin damascus [Loa] 2018-07-24
          if(EquipNumSearch(897) && n_A_JobSearch2() == 14)
            skillModifier += 10;
        }
    
        // Raid#171
        if (this._skill!.id == 171 && EquipNumSearch(897) && n_A_JobSearch2() == 14)
          skillModifier += 10;
    
        // Cannon Spear#1516 - [Every 3 Refine] Increases Head Crush damage by 5%
        if (this._skill!.id == 260 && EquipNumSearch(1516))
          skillModifier += 5 * Math.floor(this._si['refine']['rightHand'] / 3);
    
        // Assaulter Spear#903 - [Refine level 8-10] Increase damage of Spiral Pierce by 20%
        if (EquipNumSearch(903) && this._si['refine']['rightHand'] >= 8 && this._skill!.id == 259)
          skillModifier += 20;
    
        // Glorious Tablet#1094 - Increase damage with [Flying Side Kick] by 10%.
        if (EquipNumSearch(1094) && (this._skill!.id == 339 || this._skill!.id == 305))
          skillModifier += 10;
    
        // Brave Assassin Damascus#897 - [Crusader Class] Add 5% more damage with [Shield Chain]
        if (EquipNumSearch(897) && n_A_JobSearch2() == 13 && this._skill!.id == 324)
          skillModifier += 5;
    
        // Soldier Grenade Launcher#929 - [Refine level 6-10] Increase damage of [Ground Drift] by 25%
        if (EquipNumSearch(929) && this._si['refine']['rightHand'] >= 6 && this._skill!.id == 437)
          skillModifier += 25;
    
        // Brave Gladiator Blade#900 - [Rogue and Crusader Classes]
        if (this._skill!.id == 161 	&& (n_A_JobSearch2() == 13 || n_A_JobSearch2() == 14)
                      && EquipNumSearch(900))
        {
          // Add 15% more damage with [Holy Cross] skill
          skillModifier += 15;
    
          // [Refine level 7-10] Add an additional 5% more damage with [Holy Cross] skill
          if (this._si['refine']['rightHand'] >= 7)
            skillModifier += 5;
    
          // For every refine +8 or higher, add 1% more damage with [Holy Cross] skill
          if (this._si['refine']['rightHand'] >= 8)
            skillModifier += this._si['refine']['rightHand'] - 7;
        }
    
        // Glorious Holy Avenger#1079 - [Refine Rate 7~10] Increases damage with [Holy Cross] by 15%
        if (this._skill!.id == 161 && this._si['refine']['rightHand'] >= 7 && EquipNumSearch(1079))
          skillModifier += 15;
    
        if (this._skill!.id == 428 && this._si['refine']['rightHand'] >= 9 && EquipNumSearch(1099))
          skillModifier += 2 * this._si['refine']['rightHand'];
    
        if (this._skill!.id == 430 && this._si['refine']['rightHand'] >= 9 && EquipNumSearch(1100))
          skillModifier += 3 * this._si['refine']['rightHand'];
    
        if (this._skill!.id == 436 && this._si['refine']['rightHand'] >= 9 && EquipNumSearch(1102))
          skillModifier += 2 * this._si['refine']['rightHand'];
    
        if (this._skill!.id == 437 && this._si['refine']['rightHand'] >= 9 && EquipNumSearch(1103))
          skillModifier += 2 * this._si['refine']['rightHand'];
    
        if ((this._skill!.id == 6 || this._skill!.id == 76) && this._activeSkill['lv'] == 10 && EquipNumSearch(1159))
          skillModifier += 50;
    
        if (this._skill!.id == 65 && (SU_LUK >= 90 || SU_DEX >= 90) && EquipNumSearch(1164))
          skillModifier += 15;
    
        if (this._skill!.id == 264 && EquipNumSearch(1176) && SkillSearch(81) == 10)
          skillModifier += 20;
    
        if (TyouEnkakuSousa3dan == -1 && EquipNumSearch(639))
          skillModifier += 15;
    
        // Meteor Assault#264
        if (this._skill!.id == 264)
        {
          // Enforcer Cape#1699 - [Every Refine Level] Increase [Meteor Assault] damage by 1%
          skillModifier += n_A_SHOULDER_DEF_PLUS * EquipNumSearch(1699)
    
          // Brave Carnage Katar#909 - [Refine level 7~10] Increase [Meteor Assault] damage by 15%
          if(this._si['refine']['rightHand'] >= 7)
            skillModifier += 15 * EquipNumSearch(909);
        }
    
        // Glorious Claw#1096
        if (EquipNumSearch(1096))
        {
          // [Every Refine Level] Increase [Triple Attack], [Chain Combo] and [Combo Finish] damage by 5%
          if (this._skill!.id >= 187 || this._skill!.id <= 189)
            skillModifier += 5 * this._si['refine']['rightHand'];
    
          // [Every Refine Level Above +5]  Increase [Tiger Knuckle Fist] and [Chain Crush Combo] damage by 5%
          if (this._skill!.id == 289 || this._skill!.id == 290)
            skillModifier += 5 * Math.max(0, this._si['refine']['rightHand'] - 5);
        }
    
        // Glorious Claymore#1080 - [Every Refine Level] Increase [Bowling Bash] and [Charge Attack] damage by 1% [Amor]
        if (this._skill!.id == 76 || this._skill!.id == 308)
          skillModifier += this._si['refine']['rightHand'] * EquipNumSearch(1080);
    
        // Mammonite#65
        if (this._skill!.id == 65)
        {
          // Glorious Two Handed Axe#1087 - [Every Refine Level] Increase [Mammonite] damage by 2% [Amor]
          skillModifier += 2 * this._si['refine']['rightHand'] * EquipNumSearch(1087);
    
          // Glorious Cleaver#1088 - [Every Refine Level] Increase [Mammonite] damage by 1% [Amor]
          skillModifier += this._si['refine']['rightHand'] * EquipNumSearch(1088);
        }
    
        // Glorious Flamberge#1077 - [Every Refine Level] Increase [Bash], [Mammonite] and [Back Stab] damage by 2% [Amor]
        if (this._skill!.id == 65 || this._skill!.id == 6 || this._skill!.id == 169)
          skillModifier += 2 * this._si['refine']['rightHand'] * EquipNumSearch(1077);
    
        // Glorious Grenade Launcher#1103 - [Every Refine Level] Increase [Ground Drift] damage by 2% [Amor]
        if (this._skill!.id == 437)
          skillModifier += 2 * this._si['refine']['rightHand'] * EquipNumSearch(1103);
    
        // Triple Action#418
        if (this._skill!.id == 418)
        {
          // Glorious Grenade Launcher#1103 - [Every Refine Level] Increase [Triple Action] damage by 1% [Amor]
          skillModifier += this._si['refine']['rightHand'] * EquipNumSearch(1103);
    
          // Glorious Grenade Launcher#1103, Glorious Rifle#1100, Glorious Shotgun#1102 - [If Scouter Is Not Equipped] Increase [Triple Action] damage by 30%
          if (!EquipNumSearch(1387))
            skillModifier += 30 * (EquipNumSearch(1103) + EquipNumSearch(1100) + EquipNumSearch(1102));
        }
    
        // Glorious Huuma Shuriken#1098 - [Every Refine Level] Increase [Throw Huuma Shuriken] damage by 3% [Amor]
        if (this._skill!.id == 396)
          skillModifier += 3 * this._si['refine']['rightHand'] * EquipNumSearch(1098);
    
        // Glorious Revolver#1099 - [Every Refine Level] Increase [Rapid Shower] damage by 1% [Amor]
        if (this._skill!.id == 428)
          skillModifier += this._si['refine']['rightHand'] * EquipNumSearch(1099);
    
        // Glorious Rifle#1100 - [Every Refine Level] Increase [Tracking] and [Piercing Shot] damage by 3% [Amor]
        if (this._skill!.id == 430 || this._skill!.id == 432)
          skillModifier += 3 * this._si['refine']['rightHand'] * EquipNumSearch(1100);
    
        // Glorious Shotgun#1102 - [Every Refine Level] Increase [Spread Attack] damage by 2% [Amor]
        if (this._skill!.id == 436)
          skillModifier += 2 * this._si['refine']['rightHand'] * EquipNumSearch(1102);
    
        // Valorous Battle CrossBow#913 - [Refine level 8-10] Increase damage with [Sharp Shooting] by 10%] [Gawk]
        if (this._skill!.id == 272 && this._si['refine']['rightHand'] >= 8)
          skillModifier += 10 * EquipNumSearch(913);
    
        // Glorious Hunter Bow#1089 - [Every Refine] Increases [Double Strafing] damage by 2%] [Gawk]
        if (this._skill!.id == 40)
          skillModifier += 2 * this._si['refine']['rightHand'] * EquipNumSearch(1089);
    
        // Valorous Carnage Katar#910 - [Refine Level 6~10] Increases damage with [Sonic Blow] by 10%.
        if (this._si['refine']['rightHand'] >= 6 && this._skill!.id == 83 && EquipNumSearch(910))
        {
          skillModifier += 10;
    
          // [Refine Level 9~10] - Increases damage with [Sonic Blow] by 20%.
          if (this._si['refine']['rightHand'] >= 9)
            skillModifier += 20;
        }
    
        skillModifier += StPlusCalc2(5000 + this._skill!.id) + StPlusCard(5000 + this._skill!.id);
        */

        return this._applyDamageModifier(damage, skillModifier);
    }

    private _applyMiscDamageBonus(damage: number[]): number[] {
        let misc_damage_bonus = [0, 0];

        // Throw Shuriken#394
        if (394 == this._skill!.id) {
            let shuriken_constant_damage_bonus = 4 * this._skillLvl;
            misc_damage_bonus = [
                shuriken_constant_damage_bonus,
                shuriken_constant_damage_bonus,
            ];
        }

        // Asura Strike#197#321
        if (197 == this._skill!.id || 321 == this._skill!.id) {
            let asura_constant_damage_bonus = 250 + 150 * this._skillLvl;
            misc_damage_bonus = [
                asura_constant_damage_bonus,
                asura_constant_damage_bonus,
            ];
        }

        // Magical Bullet#423
        if (423 == this._skill!.id)
            misc_damage_bonus = [
                this._sessionData.matk.min,
                this._sessionData.matk.max
            ];

        return [
            damage[0] + misc_damage_bonus[0],
            damage[1] + misc_damage_bonus[1]
        ];
    }

    private _applyOffensiveStatusChange(damage: number[]): number[] {
        if (!this._skill?.ignoreOffensiveStatus) {
            // True Sight#270 - Damage +20%
            // let trueSightLv = this._si['activeBuff']['True Sight'];
            let trueSightLv = this._session.getSkillLvlOfSkillPassive(270); // FIXME: passive skill correct?
            if (trueSightLv)
                damage = this._applyDamageModifier(damage, 100 + 2 * trueSightLv);

            // Link - Priest - Holy Light#387 - Managed through skill ratio
            // Link - Assassin - Sonic Blow#388 +25% on WoE +100% in PvM
            if (388 == this._skill!.id)
                damage = this._isPvp
                    ? this._applyDamageModifier(damage, 125)
                    : this._applyDamageModifier(damage, 200);

            // Link - Crusader - Shield Boomerang +100%
            if (384 == this._skill!.id) this._applyDamageModifier(damage, 200);

            // Venom Splasher#88, Soul Breaker#263, Meteor Assault#264 ignore EDP
            // let edp_lv = this._si['activeBuff']['Endless Deadly Poison'];
            let edp_lv = this._session.getSkillLvlOfSkillPassive(266);
            if (
                this._skill!.id != 88 &&
                this._skill!.id != 263 &&
                this._skill!.id != 264 &&
                edp_lv
            )
                this._applyDamageModifier(damage, 150 + 50 * edp_lv);

            // Miracle - All monsters are considered as Star monsters
            // Hatred
            /*
            uint16 anger_level;
            if (sd != nullptr && anger_id < MAX_PC_FEELHATE && (anger_level = pc_checkskill(sd, sg_info[anger_id].anger_id))) {
              int skillratio = sd->status.base_level + sstatus->dex + sstatus->luk;
      
              if (anger_id == 2)
                skillratio += sstatus->str; // SG_STAR_ANGER additionally has STR added in its formula.
              if (anger_level < 4)
                skillratio /= 12 - 3 * anger_level;
              ATK_ADDRATE(wd->damage, wd->damage2, skillratio);
            */
        }

        return damage;
    }

    private _applyDefenseReduction(damage: number[]): number[] {
        if (!this._skill!.ignoreDefense) {
            // FIXME: replace with target_info for def reduction
            // FIXME: VITDEF formula different for players
            let def2 = this._target!.vit;
            let vitDef = [0, 0, 0];
            let vitDefBonus = Math.floor(def2 / 20) * Math.floor(def2 / 20);

            if (!this._isPvp && this._sessionData.FIXME.eska)
                // Eska increases the random part of the formula by 100
                vitDefBonus += 100;

            vitDef[0] = def2;
            vitDef[1] = def2 + Math.max(0, (vitDefBonus - 1) / 2);
            vitDef[2] = def2 + Math.max(0, vitDefBonus - 1);

            // Defense reduction managed directly in monster properties
            let effective_def = this._target!.def;

            if (244 == this._skill!.id)
                // Acid Terror#244 ignores defense (but not vitdef)
                effective_def = 0;

            if (this._isAttackPiercing())
                // Investigate#193 damage are doubled
                damage = damage.map((x, idx) => {
                    return Math.floor(
                        (x * (effective_def + vitDef[idx])) /
                        (193 == this._skill!.id ? 50 : 100)
                    );
                });
            else
                damage = damage.map(function (x, idx) {
                    return Math.floor((x * (100 - effective_def)) / 100 - def2);
                });
        }

        return damage;
    }

    private _isAttackPiercing(): boolean {
        if (
            this._skill!.id != 162 &&
            this._skill!.id != 324 &&
            this._skill!.id != 284 &&
            this._skill!.id != 159 &&
            this._skill!.id != 384
        )
            // Sacrifice#284, Grand Cross#162, Shield Chain#324, Shield Boomerang#159#384
            return (
                193 == this._skill!.id ||
                this._sessionData.bonus.flags['defRatioAtkClass']
            ); // bDefRatioAtkClass, Investigate#193

        return false;
    }

    private _calcBaseAtk(
        baseAtk: number,
        isCriticalAttack: boolean,
        isDualWielding: boolean,
        isDexBased: boolean
    ) {
        let sizeModifier: number;
        const rhWeaponTypeData = this._core.weaponTypeDB.get(this._sessionData.rightHandType)!;
        if (this._sessionData.leftHandType !== 'Shield' && this._sessionData.leftHandType !== 'Unarmed') {
            // dual weapon
            sizeModifier = this._core.weaponTypeDB.get(this._sessionData.leftHandType)!.sizeModifier[this._target!.size];
        }
        else {
            sizeModifier = rhWeaponTypeData.sizeModifier[this._target!.size]
        }

        // FIXME: Use weapon type object instead of db access
        // Large size weapon modifier while riding with spears should be applied for medium-size target
        if (
            this._session.getSkillLvlOfSkillPassive(78) && //Cavalier Mastery#78
            (
                'One-Handed Spear' === this._sessionData.rightHandType ||
                'Two-Handed Spear' === this._sessionData.rightHandType
            ) &&
            'medium' == this._target!.size
        ) {
            sizeModifier = rhWeaponTypeData.sizeModifier.large;
        }

        let minAtk = 0;
        let maxAtk = this._sessionData.weaponAtk;

        let weaponLv: number;
        let weaponRefine: number;
        if (isDualWielding && this._sessionData.equip.leftHand.item > 0) {
            weaponLv = this._core.weaponDB.get(this._sessionData.equip.leftHand.item)?.weaponLevel ?? 0;
            weaponRefine = this._sessionData.equip.leftHand.refine;
        }
        else {
            weaponLv = this._core.weaponDB.get(this._sessionData.equip.rightHand.item)?.weaponLevel ?? 0;
            weaponRefine = this._sessionData.equip.rightHand.refine;
        }

        // if the attack is not a critical hit at the exception of arrows attack
        if (!isCriticalAttack || isDexBased) {
            minAtk = this._sessionData.statsTotal.dex;

            if (weaponLv) minAtk = Math.floor((minAtk * (80 + weaponLv * 20)) / 100);

            minAtk = Math.min(minAtk, maxAtk);

            if (isDexBased && !this._skill!.isMeleeAttack) {
                minAtk = Math.floor((minAtk * maxAtk) / 100);
                maxAtk = Math.max(minAtk, maxAtk);
            }
        }
        else {
            minAtk = maxAtk;
        }

        // Maximize Power#155
        if (this._session.getSkillLvlOfSkillPassive(155)) minAtk = maxAtk;

        let minDamage = minAtk;
        let maxDamage = maxAtk;

        // Add over refine bonus
        let minWeaponBonus = weaponLv && weaponRefine > 4 ? 1 : 0;
        let overRefineDamageBonus = this._calcWeaponOverRefineBonus(weaponRefine, weaponLv);

        // Magic Crasher#275 considers min MATK instead of base ATK
        let minMatk = this._sessionData.matk.min;
        minDamage =
            (275 == this._skill!.id ? minMatk : baseAtk) +
            minWeaponBonus +
            Math.floor(minDamage * sizeModifier);
        maxDamage =
            (275 == this._skill!.id ? minMatk : baseAtk) +
            overRefineDamageBonus +
            Math.floor(maxDamage * sizeModifier);

        if (isCriticalAttack) minDamage = maxDamage;

        if (
            (isDexBased && !this._skill!.isMeleeAttack) ||
            this._skill!.usesAmmos
        ) {
            // Add arrow base attack, except for Stalker melee skills
            // Add ammunition base attack, except for Bowling Bash
            let ammoBaseAtk = this._ammo ? this._ammo['attack'] : 0;
            if (isCriticalAttack) {
                minDamage += ammoBaseAtk;
                maxDamage += ammoBaseAtk;
            } else maxDamage += ammoBaseAtk - 1;
        }

        return [minDamage, maxDamage];
    }

    private _calcWeaponOverRefineBonus(weaponRefine: number, weaponLv: number): number {
        let refineDamageBonus = 0;

        if (weaponLv) {
            let safeRefine = [7, 6, 5, 4];
            let overRefineBonus = [3, 5, 8, 13];

            refineDamageBonus =
                Math.max(weaponRefine - safeRefine[weaponLv - 1], 0) *
                overRefineBonus[weaponLv - 1];
        }

        return refineDamageBonus;
    }

    private _applyPostDefenseDamageBonus(damage: number[], isDualWielding: boolean) {
        let damageBonus = 0;
        let weaponRefineBonus = 0;

        if (isDualWielding) {
            const lhWeapon = this._core.weaponDB.get(this._sessionData.equip.leftHand.item);
            weaponRefineBonus = this._calcWeaponRefineBonus(
                this._sessionData.equip.leftHand.refine,
                lhWeapon?.weaponLevel ?? 0
            );
        }
        else {
            const rhWeapon = this._core.weaponDB.get(this._sessionData.equip.rightHand.item);
            weaponRefineBonus = this._calcWeaponRefineBonus(
                this._sessionData.equip.rightHand.refine,
                rhWeapon?.weaponLevel ?? 0
            );
        }

        // Throwing Pratice#393 mastery damage bonus only applying to Throw Shuriken#394
        if (394 == this._skill!.id) {
            damageBonus += 3 * this._session.getSkillLvlOfSkillPassive(393);
        }

        // Weapon refine bonus not applying for Investigate#193, Asura Strike#197#321, Shield Chain#324, Acid Demonstration#328 and Shield Boomerang#159#384
        let excludedSkills = [159, 193, 197, 321, 324, 328, 384];
        if (192 == this._skill!.id)
            // Bonus counted #spheres#185 times for Finger Offensive#192
            damageBonus += weaponRefineBonus * this._sessionData.FIXME.acitveSpheres;
        else if (excludedSkills.findIndex((x) => x == this._skill!.id) < 0)
            damageBonus += weaponRefineBonus;

        // Aura Blade#254 damage bonus, not applied with Spiral Pierce#259
        if (this._skill!.id != 259)
            damageBonus += this._session.getSkillLvlOfSkillPassive(254) * 20;

        // Blade of Angels#1379 - #50 Enable Aura Blade lv 5
        /* FIXME SQI Bonus
        if (1379 == n_A_Equip[0] && SQI_Bonus_Effect.findIndex(x => x == 50) > -1)
          damageBonus += 100;*/

        damage = damage.map(function (x) {
            return x + damageBonus;
        });

        // Sonic Acceleration#381 - Sonic Blow damage#83#388 + 10%
        if (
            (83 == this._skill!.id || 388 == this._skill!.id) &&
            this._session.getSkillLvlOfSkillPassive(381)
        ) {
            damage = this._applyDamageModifier(damage, 110);
        }

        damage = this._applyMasteryBonus(damage);

        return damage;
    }

    private _calcWeaponRefineBonus(weaponRefine: number, weaponLv: number): number {
        let refineDamageBonus = 0;

        if (weaponLv) {
            let refineBonus = [2, 3, 5, 7];
            refineDamageBonus = weaponRefine * refineBonus[weaponLv - 1];
        }

        return refineDamageBonus;
    }

    private _applyMasteryBonus(damage: number[]): number[] {
        let masteryAtkBonus = 0;

        if (this._skill!.enableMasteries) {
            // Masteries related to weapons
            switch (this._sessionData.rightHandType) {
                case 'Dagger': // Dagger
                case 'One-Handed Sword': // One-handed Sword
                    masteryAtkBonus += 4 * this._session.getSkillLvlOfSkillPassive(3); // One-handed Sword Mastery#3
                    break;
                case 'Two-Handed Sword': // Two-handed Sword
                    masteryAtkBonus +=
                        4 * this._session.getSkillLvlOfSkillPassive(4); // Two-handed Sword Mastery#4
                    break;
                case 'One-Handed Spear': // One-handed Spear
                case 'Two-Handed Spear': // Two-handed Spear
                    masteryAtkBonus +=
                        (this._session.getSkillLvlOfSkillPassive(78) ? 5 : 4) *
                        this._session.getSkillLvlOfSkillPassive(69); // Spear Mastery#69 enhanced while Riding#78
                    break;
                case 'One-Handed Axe': // One-handed Axe
                case 'Two-Handed Axe': // Two-handed Axe
                    masteryAtkBonus += 3 * this._session.getSkillLvlOfSkillPassive(241); // Axe Mastery#241
                    break;
                case 'Mace': // Mace
                    masteryAtkBonus += 3 * this._session.getSkillLvlOfSkillPassive(89); // Mace Mastery#89
                    break;
                case 'Katar': // Katar
                    masteryAtkBonus += 3 * this._session.getSkillLvlOfSkillPassive(81); // Katar Mastery#81
                    break;
                case 'Book': // Book
                    masteryAtkBonus += 3 * this._session.getSkillLvlOfSkillPassive(224); // Advanced Book#224
                    break;
                case 'Unarmed': // Unarmed
                    masteryAtkBonus += 10 * this._session.getSkillLvlOfSkillPassive(329); // Sprint#329 [Unarmed]
                case 'Knuckle':
                    masteryAtkBonus += 3 * this._session.getSkillLvlOfSkillPassive(183); // Iron Hand#183, applied as well when unarmed
                    break;
                case 'Musical Instrument': // Instrument
                    masteryAtkBonus += 3 * this._session.getSkillLvlOfSkillPassive(198);    // Musical Lesson#198
                    break;
                case 'Whip': // Whip
                    masteryAtkBonus += 3 * this._session.getSkillLvlOfSkillPassive(206);    // Dancing Lesson#206
                    break;
                default:
                    break;
            }

            // Demon Bane#24, effective on Demon Race or Undead element 91-94
            // FIXME: Disabled on players
            if (
                this._session.getSkillLvlOfSkillPassive(24) &&
                ('demon' === this._target!.race || 'undead' === this._target!.element)
            )
                masteryAtkBonus +=
                    Math.floor(3 + 0.05 * (this._sessionData.level.base + 1)) *
                    this._session.getSkillLvlOfSkillPassive(24)

            // Beast Bane#116 effective on Brute and Insect
            if (this._target!.race === 'brute' || this._target!.race === 'insect') {
                masteryAtkBonus += 4 * this._session.getSkillLvlOfSkillPassive(116);

                if (this._session.getSkillLvlOfSkillPassive(390)) {
                    // Hunter Link#390
                    masteryAtkBonus += this._sessionData.statsTotal.str;
                }
            }
        }

        return this._applyDamageBonus(damage, masteryAtkBonus);
    }

    private _applyAdditionalElementDamage(damage: number[], baseAtk: number): number[] {
        let additionalDamage = [0, 0];

        if (this._sessionData.FIXME.magnumBreak) {
            // Apply Magnum Break#7 SC_WATK_ELEMENT damage bonus
            let fireLv1Ratio = this._core.elementDB['fire'][this._target!.element][this._target!.elementLv - 1];
            additionalDamage = this._applyDamageModifier(
                this._calcBaseAtk(baseAtk, false, false, false),
                20
            ); // 20% of base attack

            additionalDamage = this._applyDamageModifier(
                additionalDamage, 100 * Math.max(fireLv1Ratio, 0)
            ); // With fire property
        }

        return damage.map(function (x, idx) {
            return x + additionalDamage[idx];
        });
    }

    private _applyPhysicalDamageModifiers(damage: number[], isCriticalAttack: boolean): number[] {
        // if(wBCEDPch==0 && not_use_card == 0)
        // FIXME: Some skills disable modifiers
        // FIXME: EDP impacts modifiers ?
        let modifiers = 100;

        if (this._skill!.allows_modifiers) {
            // bAddRace - physical damage modifier against race r
            let raceModifier = 100 + this._sessionData.bonus.addRace.get(this._target!.race);

            // bAddEle - Physical damage modifier against element e
            let elementModifier = 100 + this._sessionData.bonus.addEle.get(this._target!.element);

            // bAddSize - Physical damage modifier against size s
            let sizeModifier = 100 + this._sessionData.bonus.addSize.get(this._target!.size);

            // bLongAtkRate - Physical damage modifier for long ranged attacks
            // FIXME: What's the purpose of TyouEnkakuSousa3dan
            let rangeModifier = 100;
            if (this._skill!.isRangeAttack) {
                // FIXME: && TyouEnkakuSousa3dan != -1) // Is range attack ?
                rangeModifier += this._sessionData.bonus.stats.longAtkRate;;
            }

            // bAddClass - Physical damage modifier against class c
            let classModifier =
                100 +
                this._sessionData.bonus.addClass.get(this._core.getMobClass(this._target!)) +
                this._sessionData.bonus.addClass.get('all')

            // FIXME : Ensure that Sharp Shooting#401 benefits from this modifier
            // bCritAtkRate - Increases critical damage modifier
            let criticalModifier = 100;
            if (isCriticalAttack && this._skill!.id != 401) {
                criticalModifier += this._sessionData.bonus.stats.critAtkRate;
            }

            // bAddRace2 - damage modifier against dedicated monster race
            let race2Modifier = 100 + this._sessionData.bonus.addRace2.get(this._target!.race2);

            let advKatarMastery = 100;
            if (
                'Katar' === this._sessionData.rightHandType &&
                this._session.getSkillLvlOfSkillPassive(262)
            ) {
                // Advanced Katar Mastery#262 functions similar to a +%ATK card
                advKatarMastery += 10 + 2 * this._session.getSkillLvlOfSkillPassive(262);
            }

            // wBaiCI = Math.floor(tPlusDamCut(wBaiCI));
            // FIXME: tPlusDamCut ?
            // FIXME: Ugly refactor
            modifiers *=
                ((((((((((((((raceModifier / 100) * race2Modifier) / 100) *
                    elementModifier) /
                    100) *
                    classModifier) /
                    100) *
                    criticalModifier) /
                    100) *
                    sizeModifier) /
                    100) *
                    rangeModifier) /
                    100) *
                    advKatarMastery) /
                100;
        }

        return this._applyDamageModifier(damage, modifiers);
    }
}