import { computed, inject, Injectable, signal, untracked } from "@angular/core";
import { TTCoreServiceV3 } from "./tt-core.v3.service";
import { TTSessionInfoV3Service } from "./tt-session-info.v3.service";
import { DBMob, DBSkill, Element } from "./models.v3";
import { createEmptySessionBonus } from "./session-info-default";

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
    private _isPvp = false; // TODO
    private _appliedEndow: Element | undefined;
    private _bonus = createEmptySessionBonus();

    // TODO: add auto. calc to battle-session?

    /*** public functions ***/
    public init() {
        /* init data without calculation */
    }
    public simulate() {
        console.log('Battle is simualted...');
        this._bonus = this._session.bonus();    // FIXME: needed?
        let damage: number[] = [];
        if (this._skill && this._target) {
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
    private _calcAttackDmg(isCritAttack: boolean, isDualWielding: boolean): number[] {
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


        //skill_info = retrieve_skill_info(this._activeSkill['id'], this._activeSkill['lv']);
        console.log('before: calcPhysicalAttackDamage');
        console.log(damage);

        if (this._skill!.isMagicAttack)
            damage = this._calcMagicalAttackDamage(damage);
        else
            damage = this._calcPhysicalAttackDamage(isCritAttack, isDualWielding);

        console.log('after: calcPhysicalAttackDamage');
        console.log(damage);
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
        const statsTotal = this._session.totalStats();
        const level = this._session.level();
        const passiveSkills = this._session.skillsPassive();
        // Initialize damage list with min matk and max matk used for status display
        damage[0] = this._session.matkMin();
        damage[1] = this._session.matkMax();

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
                statsTotal.luk +
                statsTotal.int +
                level.base +
                200 -
                (200 * targetRemainingHp) / this._target!.hp,
                700
            );
            let tuMinChance = Math.max(
                20 * this._skillLvl + statsTotal.luk + statsTotal.int + level.base,
                700
            );

            damage[0] = level.base + statsTotal.int + this._skillLvl * 10;
            damage[1] = this._target!.hp;
        }
        else if (325 == this._skill!.id) {
            // Gravitation Field#325
            damage[0] = damage[1] = 200 + 200 * this._skillLvl;
        }
        // FIXME: Manage heal/sanctuary
        // skill_calc_heal(this._activeSkill['id'], this._activeSkill['lv']);

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
            const magicAtkEle = this._bonus.magicAtkEle[this._skill!.element] ?? 0;
            let elementModifier = 100 + magicAtkEle;

            // Damage modifier for monster element
            const magicAddEle = this._bonus.magicAddEle[this._target!.element] ?? 0;
            elementModifier += magicAddEle;

            // Damage modifier for race - bMagicAddRace
            // Dragonology#234 - Increases Attack Power, MATK and DEF against Dragon type monsters by 4% per SkillLV

            const dragonologyBonus =
                this._target!.race === 'dragon'
                    ? this._session.getSkillLvlOfPassiveSkill(234) * 4
                    : 0;

            const magicAddRace = this._bonus.magicAddRace[this._target!.race] ?? 0;
            let raceModifier =
                100 +
                magicAddRace +
                dragonologyBonus;

            // Increases magical damage against bosstype monsters - bMagicAddClass,Class_Boss
            const magicAddClassTarget = this._bonus.magicAddClass[this._core.getMobClass(this._target!)] ?? 0;
            const magicAddClassAll = this._bonus.magicAddClass['all'] ?? 0;
            let classModifier =
                100 +
                magicAddClassTarget +
                magicAddClassAll;

            // bMagicAddSize - unused modifier
            // bMagicAddRace2
            const magicAddRace2 = this._bonus.magicAddRace2[this._target!.race2] ?? 0;
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
    private _calcPhysicalAttackDamage(isCriticalAttack: boolean, isDualWielding: boolean): number[] {
        return [0, 0];
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
            skillRatio = eval(skillRatio)(this._skillLvl, misc);
        }
        return (skillRatio as number) * 100;
    }

    private _applyMagicalSkillDamageRatio(damage: number[]): number[] {
        // FIXME
        // Skill damage bonus - bSkillAtk
        // FIXME: same modifier than for physical damage, merge ?

        let skillModifier = 100; /* + StPlusCalc2(5000 + this._activeSkill['id']) + StPlusCard(5000 + this._activeSkill['id']);

      // [Mage Class] - Increases damage of the skills [Soul Strike], [Napalm Beat] and [Napalm Vulcan] by 20%
      if (n_A_JobSearch()==5 && (46 == this._activeSkill['id'] || 47 == this._activeSkill['id'] || 277 == this._activeSkill['id']))
          skillModifier += 20 * CardNumSearch(474);

      // RJC Katyusha Flower#1146 - [Every Refine] Increases damage of [Heaven's Drive] and [Earth Spike] by 1%
      if ((132 == this._activeSkill['id'] || 133 == this._activeSkill['id']) && EquipNumSearch(1146))
          skillModifier += this._si['refine']['rightHand'];

      // Lacrima Stick#1169 - [Every Refine] Increases damage of [Storm Gust] by 1%
      if (131 == this._activeSkill['id'] && EquipNumSearch(1169))
          skillModifier += this._si['refine']['rightHand'];

      // Chilly Spell Book#1653 - [Every Refine] Increases damage of [Storm Gust] and [Cold Bolt] by 3%
      if ((54 == this._activeSkill['id'] || 131 == this._activeSkill['id']) && EquipNumSearch(1653))
          skillModifier += 3 * this._si['refine']['rightHand'];

      // Noah's Hat#1247 - [Acolyte Class] Increases damage of [Holy Light] by 5% [Refine Rate > 7] Increases damage of [Holy Light] by 5%
      if (n_A_JobSearch() == 3 && (37 == this._activeSkill['id'] || 387 == this._activeSkill['id']) && EquipNumSearch(1247))
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
        let activeElement: Element = 'neutral';
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
            let elementModifier = this._core.elementDb[this._target!.element][activeElement][this._target!.elementLv - 1];
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
}