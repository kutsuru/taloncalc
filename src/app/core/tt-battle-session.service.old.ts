import { Injectable } from '@angular/core';
import { DictDb, SessionInfo } from './models';
import { TTCoreService } from './tt-core.service';
import { TTSessionInfoService } from './tt-session-info.service';

@Injectable()
export class TTBattleSessionServiceOld {
  private _si: SessionInfo;
  private _ammo: any | null;
  private _result: any;
  private _target: any;
  private _rhWeapon: any;
  private _rhWeaponType: any;
  private _lhWeapon: any | null;
  private _lhWeaponType: any;
  private _appliedEndow: string;
  private _activeSkill: DictDb;
  private _activeSkillLv: number;

  private _isPvp: boolean;

  private _str: number;
  private _agi: number;
  private _vit: number;
  private _int: number;
  private _dex: number;
  private _luk: number;
  private _baseLv: number;

  constructor(
    private ttCoreService: TTCoreService,
    private ttSessionInfoService: TTSessionInfoService
  ) {
    this._str = 0;
    this._agi = 0;
    this._vit = 0;
    this._int = 0;
    this._dex = 0;
    this._luk = 0;
    this._baseLv = 0;
    this._isPvp = false;
    this._activeSkill = {};
    this._appliedEndow = '';
    this._activeSkillLv = 0;
    this._si = this.ttSessionInfoService.sessionInfo;
  }

  init(
    target: any,
    activeSkill: DictDb,
    activeSkillLv: number,
    selectedAmmo: any | null = null,
    appliedEndow: string = ''
  ): void {
    this._result = {
      castTime: 0,
      hitRatio: 0,
      castDelay: 0,
      minDamage: 0,
      maxDamage: 0,
      minNbHits: 0,
      maxNbHits: 0,
      critChance: 0,
      critDamage: 0,
      dodgeRatio: 0,
      battleDuration: 0,
    };

    this._target = target;

    // FIXME: Factorize through session information as already required for atk display
    // Update right hand weapon information
    this._rhWeaponType = this._si['equip']['rightHandType'];
    if (this._rhWeaponType)
      this._rhWeapon =
        this.ttCoreService.weaponDb[this._rhWeaponType][
          this._si['equip']['rightHand']
        ];

    // Update left hand information
    // FIXME: Add unarmed entry in weapon db for simplicity
    this._lhWeaponType = this._si['equip']['leftHandType'];
    if (this._lhWeaponType && 'Shield' === this._lhWeaponType)
      this._lhWeapon =
        this.ttCoreService.shieldDb[this._si['equip']['leftHand']];
    else
      this._lhWeapon =
        this.ttCoreService.weaponDb[this._lhWeaponType][
          this._si['equip']['leftHand']
        ];

    this._ammo = selectedAmmo;
    this._appliedEndow = appliedEndow;
    this._activeSkill = activeSkill;
    this._activeSkillLv = activeSkillLv;
    this._baseLv = this.ttSessionInfoService.sessionInfo['baseLv'];

    this._str = this.ttSessionInfoService.str;
    this._agi = this.ttSessionInfoService.agi;
    this._vit = this.ttSessionInfoService.vit;
    this._int = this.ttSessionInfoService.int;
    this._dex = this.ttSessionInfoService.dex;
    this._luk = this.ttSessionInfoService.luk;
  }

  public simulate(): number[] {
    let damage: number[] = [];
    if (this._target && this._activeSkill) {
      damage = this.calcAttackDamage(false, false);
      let critDamage = this.calcAttackDamage(true, false);
    }
    // FIXME, manage dual wielding
    return damage;
  }

  public get result() {
    return this._result;
  }

  private applyDamageModifier(damage: number[], modifier: number): number[] {
    damage[0] = Math.floor((damage[0] * modifier) / 100);
    damage[1] = Math.floor((damage[1] * modifier) / 100);

    return damage;
  }

  private applyDamageBonus(damage: number[], bonus: number): number[] {
    return damage.map(function (x) {
      return x + bonus;
    });
  }

  // Base attack computation
  private calcBaseAtk(
    baseAtk: number,
    isCriticalAttack: boolean,
    isDualWielding: boolean,
    isDexBased: boolean
  ) {
    let sizeModifier = isDualWielding
      ? this.ttCoreService.weaponTypeDb[this._lhWeaponType]['sizeModifier'][
          this._target['size']
        ]
      : this.ttCoreService.weaponTypeDb[this._rhWeaponType]['sizeModifier'][
          this._target['size']
        ];

    // FIXME: Use weapon type object instead of db access
    // Large size weapon modifier while riding with spears should be applied for medium-size target
    if (
      this._si['passiveSkill']['Cavalier Mastery'] &&
      ('Spear' === this._rhWeaponType ||
        'Two-handed Spear' === this._rhWeaponType) &&
      1 == this._target['size']
    )
      sizeModifier =
        this.ttCoreService.weaponTypeDb[this._rhWeaponType]['large'];

    let minAtk = 0;
    let maxAtk = this._si['weaponAtk'];

    let weaponLv =
      isDualWielding && this._lhWeapon
        ? this._lhWeapon['weaponLv']
        : this._rhWeapon['weaponLv'];
    let weaponRefine = isDualWielding
      ? this._si['refine']['leftHand']
      : this._si['refine']['rightHand'];

    // if the attack is not a critical hit at the exception of arrows attack
    if (!isCriticalAttack || isDexBased) {
      minAtk = this._dex;

      if (weaponLv) minAtk = Math.floor((minAtk * (80 + weaponLv * 20)) / 100);

      minAtk = Math.min(minAtk, maxAtk);

      if (isDexBased && !this._activeSkill['isMeleeAttack']) {
        minAtk = Math.floor((minAtk * maxAtk) / 100);
        maxAtk = Math.max(minAtk, maxAtk);
      }
    } else minAtk = maxAtk;

    // Maximize Power#155
    if (this._si['activeBuff']['isMaximizePowerActive']) minAtk = maxAtk;

    let minDamage = minAtk;
    let maxDamage = maxAtk;

    // Add over refine bonus
    let minWeaponBonus = weaponLv && weaponRefine > 4 ? 1 : 0;
    let overRefineDamageBonus = this.calcWeaponOverRefineBonus(
      weaponRefine,
      weaponLv
    );

    // Magic Crasher#275 considers min MATK instead of base ATK
    let minMatk = this.ttSessionInfoService.minMatk;
    minDamage =
      (275 == this._activeSkill['id'] ? minMatk : baseAtk) +
      minWeaponBonus +
      Math.floor(minDamage * sizeModifier);
    maxDamage =
      (275 == this._activeSkill['id'] ? minMatk : baseAtk) +
      overRefineDamageBonus +
      Math.floor(maxDamage * sizeModifier);

    if (isCriticalAttack) minDamage = maxDamage;

    if (
      (isDexBased && !this._activeSkill['isMeleeAttack']) ||
      this._activeSkill['usesAmmos']
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

  private applyMasteryBonus(damage: number[]): number[] {
    let masteryAtkBonus = 0;

    if (this._activeSkill['enable_masteries']) {
      // Masteries related to weapons
      switch (this._rhWeapon['weaponType']) {
        case 'Dagger': // Dagger
        case 'Sword': // One-handed Sword
          masteryAtkBonus += 4 * this._si['passiveSkill']['Sword Mastery']; // One-handed Sword Mastery#3
          break;
        case 'Two-Handed Sword': // Two-handed Sword
          masteryAtkBonus +=
            4 * this._si['passiveSkill']['Two-handed Sword Mastery']; // Two-handed Sword Mastery#4
          break;
        case 'Spear': // One-handed Spear
        case 'Two-Handed Spear': // Two-handed Spear
          masteryAtkBonus +=
            (this._si['passiveSkill']['Cavalier Mastery'] ? 5 : 4) *
            this._si['passiveSkill']['Spear Mastery']; // Spear Mastery#69 enhanced while Riding#78
          break;
        case 'Axe': // One-handed Axe
        case 'Two-handed Axe': // Two-handed Axe
          masteryAtkBonus += 3 * this._si['passiveSkill']['Axe Mastery']; // Axe Mastery#241
          break;
        case 'Mace': // Mace
          masteryAtkBonus += 3 * this._si['passiveSkill']['Mace Mastery']; // Mace Mastery#89
          break;
        case 'Katar': // Katar
          masteryAtkBonus += 3 * this._si['passiveSkill']['Katar Mastery']; // Katar Mastery#81
          break;
        case 'Book': // Book
          masteryAtkBonus += 3 * this._si['passiveSkill']['Advanced Book']; // Advanced Book#224
          break;
        case 'Unarmed': // Unarmed
          masteryAtkBonus += 10 * this._si['passiveSkill']['Sprint Unarmed']; // Sprint#329 [Unarmed]
        case 'Knuckles':
          masteryAtkBonus += 3 * this._si['passiveSkill']['Iron Hand']; // Iron Hand#183, applied as well when unarmed
          break;
        case 'Instrument': // Instrument
          masteryAtkBonus += 3 * this._si['passiveSkill']['Musical Lesson'];
          break;
        case 'Whip': // Whip
          masteryAtkBonus += 3 * this._si['passiveSkill']['Dance Lesson'];
          break;
        default:
          break;
      }

      // Demon Bane#24, effective on Demon Race or Undead element 91-94
      // FIXME: Disabled on players
      if (
        this._si['passiveSkill']['Demon Bane'] &&
        ('Demon' === this._target['race'] ||
          'Undead' === this._target['element'])
      )
        masteryAtkBonus +=
          Math.floor(3 + 0.05 * (this._baseLv + 1)) *
          this._si['passiveSkill']['Demon Bane'];

      // Beast Bane#116 effective on Brute and Insect
      if (
        'Brute' === this._target['race'] ||
        'Insect' === this._target['race']
      ) {
        masteryAtkBonus += 4 * this._si['passiveSkill']['Beast Bane'];

        if (this._si['passiveSkill']['Hunter Link'])
          // Hunter Link#390
          masteryAtkBonus += this._str;
      }
    }

    return this.applyDamageBonus(damage, masteryAtkBonus);
  }

  private calcSkillBaseDamage(
    baseAtk: number,
    isCriticalAttack: boolean,
    isDualWielding: boolean,
    isDexBased: boolean
  ): number[] {
    let damage = [0, 0];
    let skillBaseDamage = 0;

    switch (this._activeSkill['id']) {
      case 106: // Land Mine#106
        skillBaseDamage =
          (this._activeSkillLv * (this._dex + 75) * (100 + this._int)) / 100;
        break;
      case 112: // Blast Mine#112
        skillBaseDamage =
          (this._activeSkillLv *
            (Math.floor(this._dex / 2) + 50) *
            (100 + this._int)) /
          100;
        break;
      case 113: // Claymore Trap#113
        skillBaseDamage =
          (this._activeSkillLv *
            (Math.floor(this._dex / 2) + 75) *
            (100 + this._int)) /
          100;
        break;
      case 118: // Blitz Beat#118
      case 271: // Falcon Assault#271
        let steel_crow_lv = this._si['passiveSkill']['Steel Crow']; // Steel Crow#119
        skillBaseDamage =
          (Math.floor(this._dex / 10) +
            Math.floor(this._int / 2) +
            steel_crow_lv * 3 +
            40) *
          2;

        if (271 == this._activeSkill['id']) {
          skillBaseDamage *= 5; // Number of hit from Blitz Beat#118 lv 5
          skillBaseDamage = Math.floor(
            (skillBaseDamage * (150 + 70 * this._activeSkillLv)) / 100
          ); //Falcon Assault Modifier
        }
        break;
      case 200: // Dissonance#200
        skillBaseDamage = 30 + this._activeSkillLv * 10;
        skillBaseDamage += 3 * this._si['passiveSkill']['Musical Lesson']; // Musical Lesson#198
        break;
      case 284: // Sacrifice#284
        skillBaseDamage = Math.floor((this._si['maxHp'] * 9) / 100);
        break;
      case 405: // Final Strike#405 FIXME combine + input
        //skillBaseDamage =  Math.floor(40 * this._str + eval(document.calcForm.SkillSubNum.value) * 8 * this._activeSkill['id'] / 100);
        break;
      case 438: // Final Strike [MaxHP - 1]#438
        skillBaseDamage = Math.floor(
          40 * this._str +
            ((this._si['maxHp'] - 1) * 8 * this._activeSkill['id']) / 100
        );
        break;
      case 259: // Spiral Pierce#259
        let spearWeight = this._rhWeapon['weight'];
        skillBaseDamage =
          Math.floor(spearWeight * 0.8) * (1 + 0.5 * this._activeSkillLv); // 80% of weapon's weight x ratio which only applies to weight

        // Apply STR bonus
        let dstr = Math.floor(this._str / 10);
        skillBaseDamage += dstr * dstr;

        // Apply size modifier
        skillBaseDamage = Math.floor(
          skillBaseDamage * (1.25 - this._target['size'] * 0.25)
        );
        break;
      case 384: // Shield Boomerang#384 [Soul Linked]
      case 159: // Shield Boomerang#159
      case 324: // Shield Chain#324
        let shieldWeight = this._lhWeapon['weight'];
        skillBaseDamage = baseAtk + shieldWeight;
        break;
      case 328: // Acid Demonstration#328
        skillBaseDamage =
          (0.7 * this._int * this._int * this._target['vit']) /
          (this._int + this._target['vit']);
        break;
      default:
        damage = this.calcBaseAtk(
          baseAtk,
          isCriticalAttack,
          isDualWielding,
          isDexBased
        );
        console.log('after: calcBaseAtk');
        console.log(damage);
        // Critical Attack Rate damage bonus
        if (isCriticalAttack)
          damage = this.applyDamageModifier(
            damage,
            100 + this._si['activeBonus']['criticalAtkRate']
          );

        // Fighting Chant#342 damage bonus - TK_POWER
        let fightingChantLv = this._si['passiveSkill']['Fighting Chant'];
        if (fightingChantLv) {
          // Additional Party Members for Fighting Chant#380, not including player
          let partyMembers = 1; //SkillSearch(380) FIXME
          damage = this.applyDamageModifier(
            damage,
            100 + 2 * fightingChantLv * partyMembers
          );
        }

        break;
    }

    // Manage Poison Knife base attack
    if (306 == this._activeSkill['id']) damage[1] += 29;

    // Manage Shuriken/Kunai base attack
    if (394 == this._activeSkill['id'] || 395 == this._activeSkill['id'])
      damage[1] += this._ammo?.['attack'] - 1;

    if (skillBaseDamage) {
      damage[0] = skillBaseDamage;
      damage[1] = skillBaseDamage;
    }

    return damage;
  }

  private applyPhysicalDamageModifiers(
    damage: number[],
    isCriticalAttack: boolean
  ): number[] {
    // if(wBCEDPch==0 && not_use_card == 0)
    // FIXME: Some skills disable modifiers
    // FIXME: EDP impacts modifiers ?
    let modifiers = 100;

    if (this._activeSkill['allowsModifiers']) {
      // bAddRace - physical damage modifier against race r
      let raceModifier =
        100 + this._si['activeBonus']['addRace'][this._target['race']];

      // bAddEle - Physical damage modifier against element e
      let elementModifier =
        100 + this._si['activeBonus']['addEle'][this._target['element']];

      // bAddSize - Physical damage modifier against size s
      let sizeModifier =
        100 + this._si['activeBonus']['addSize'][this._target['size']];

      // bLongAtkRate - Physical damage modifier for long ranged attacks
      // FIXME: What's the purpose of TyouEnkakuSousa3dan
      let rangeModifier = 100;
      if (this._activeSkill['isRangeAttack'])
        // FIXME: && TyouEnkakuSousa3dan != -1) // Is range attack ?
        rangeModifier += this._si['activeBonus']['longAtkRate'];

      // bAddClass - Physical damage modifier against class c
      let classModifier =
        100 +
        this._si['activeBonus']['addClass'][this._target['class']] +
        this._si['activeBonus']['addClass']['all'];

      // FIXME : Ensure that Sharp Shooting#401 benefits from this modifier
      // bCritAtkRate - Increases critical damage modifier
      let criticalModifier = 100;
      if (isCriticalAttack && this._activeSkill['id'] != 401)
        criticalModifier += this._si['activeBonus']['criticalAtkRate'];

      // bAddRace2 - damage modifier against dedicated monster race
      let race2Modifier =
        100 + this._si['activeBonus']['addRace2'][this._target['race2']];

      let advKatarMastery = 100;
      if (
        'Katar' === this._rhWeapon['weaponType'] &&
        this._si['passiveSkill']['Advanced Katar Mastery']
      )
        // Adv. Katar Mastery functions similar to a +%ATK card
        advKatarMastery +=
          10 + 2 * this._si['passiveSkill']['Advanced Katar Mastery'];

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

    return this.applyDamageModifier(damage, modifiers);
  }

  private applyPhysicalSkillDamageModifiers(damage: number[]): number[] {
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
    if (this._activeSkill['id'] == 86 && (50 <= n_B[3] && n_B[3] < 60))
      skillModifier += 30 * this._activeSkill['id']LV;

    if (this._activeSkill['id'] == 6 && n_A_SHOES_DEF_PLUS >= 9 && CardNumSearch(362))
      skillModifier += 10;

    if (this._activeSkill['id'] == 76 && (n_A_WeaponType == 2 || n_A_WeaponType == 3))
      skillModifier += 25 * CardNumSearch(464);

    if (this._activeSkill['id'] == 41 && n_A_WeaponType == 10)
      skillModifier += 50 * CardNumSearch(465);

    if (this._activeSkill['id'] == 40 && this._si['refine']['rightHand'] >= 9 && EquipNumSearch(1089))
      skillModifier += 20;

    //custom TalonRO rental - Bow of Evil: Double Strafe damage +25%
    if (this._activeSkill['id'] == 40 && EquipNumSearch(1332))
      skillModifier += 25;

    //custom TalonRO rental - Katar of Speed: Sonic Blow damage +25%
    if ((this._activeSkill['id'] == 83 || this._activeSkill['id'] == 388) && EquipNumSearch(1342))
      skillModifier += 25;

    //custom TalonRO rental - Mace of Madness: Cart Revolution damage +25%
    if (this._activeSkill['id'] == 66 && EquipNumSearch(1343))
      skillModifier += 25;

    //custom TalonRO rental - Monk Knuckle: Finger Offensive damage +25%
    if (this._activeSkill['id'] == 192 && EquipNumSearch(1346))
      skillModifier += 25;

    //custom TalonRO rental - Phenomena Whip: Throw Arrow damage +25%
    if (this._activeSkill['id'] == 207 && EquipNumSearch(1349))
      skillModifier += 25;

    //custom TalonRO rental - Spear of Excellent: Magnum Break damage +25%
    if (this._activeSkill['id'] == 7 && EquipNumSearch(1352))
      skillModifier += 25;

    if (this._activeSkill['id'] == 272 && EquipNumSearch(1045))
      skillModifier += this._si['refine']['rightHand'] * 3;

    //custom TalonRO Imperial Guard: Shield Chain damage +2% each refine above 6
    if(this._activeSkill['id'] == 324 && n_A_LEFT_DEF_PLUS > 6 && EquipNumSearch(1459))
      skillModifier += 2*(n_A_LEFT_DEF_PLUS-6);

    // Back Stab#169
    if (this._activeSkill['id'] == 169)
    {
      //custom TalonRO Black Wing: Back Stab damage +2% each refine
      if (EquipNumSearch(1463))
        skillModifier += 2 * this._si['refine']['rightHand'];

      //brave assassin damascus [Loa] 2018-07-24
      if(EquipNumSearch(897) && n_A_JobSearch2() == 14)
        skillModifier += 10;
    }

    // Raid#171
    if (this._activeSkill['id'] == 171 && EquipNumSearch(897) && n_A_JobSearch2() == 14)
      skillModifier += 10;

    // Cannon Spear#1516 - [Every 3 Refine] Increases Head Crush damage by 5%
    if (this._activeSkill['id'] == 260 && EquipNumSearch(1516))
      skillModifier += 5 * Math.floor(this._si['refine']['rightHand'] / 3);

    // Assaulter Spear#903 - [Refine level 8-10] Increase damage of Spiral Pierce by 20%
    if (EquipNumSearch(903) && this._si['refine']['rightHand'] >= 8 && this._activeSkill['id'] == 259)
      skillModifier += 20;

    // Glorious Tablet#1094 - Increase damage with [Flying Side Kick] by 10%.
    if (EquipNumSearch(1094) && (this._activeSkill['id'] == 339 || this._activeSkill['id'] == 305))
      skillModifier += 10;

    // Brave Assassin Damascus#897 - [Crusader Class] Add 5% more damage with [Shield Chain]
    if (EquipNumSearch(897) && n_A_JobSearch2() == 13 && this._activeSkill['id'] == 324)
      skillModifier += 5;

    // Soldier Grenade Launcher#929 - [Refine level 6-10] Increase damage of [Ground Drift] by 25%
    if (EquipNumSearch(929) && this._si['refine']['rightHand'] >= 6 && this._activeSkill['id'] == 437)
      skillModifier += 25;

    // Brave Gladiator Blade#900 - [Rogue and Crusader Classes]
    if (this._activeSkill['id'] == 161 	&& (n_A_JobSearch2() == 13 || n_A_JobSearch2() == 14)
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
    if (this._activeSkill['id'] == 161 && this._si['refine']['rightHand'] >= 7 && EquipNumSearch(1079))
      skillModifier += 15;

    if (this._activeSkill['id'] == 428 && this._si['refine']['rightHand'] >= 9 && EquipNumSearch(1099))
      skillModifier += 2 * this._si['refine']['rightHand'];

    if (this._activeSkill['id'] == 430 && this._si['refine']['rightHand'] >= 9 && EquipNumSearch(1100))
      skillModifier += 3 * this._si['refine']['rightHand'];

    if (this._activeSkill['id'] == 436 && this._si['refine']['rightHand'] >= 9 && EquipNumSearch(1102))
      skillModifier += 2 * this._si['refine']['rightHand'];

    if (this._activeSkill['id'] == 437 && this._si['refine']['rightHand'] >= 9 && EquipNumSearch(1103))
      skillModifier += 2 * this._si['refine']['rightHand'];

    if ((this._activeSkill['id'] == 6 || this._activeSkill['id'] == 76) && this._activeSkill['lv'] == 10 && EquipNumSearch(1159))
      skillModifier += 50;

    if (this._activeSkill['id'] == 65 && (SU_LUK >= 90 || SU_DEX >= 90) && EquipNumSearch(1164))
      skillModifier += 15;

    if (this._activeSkill['id'] == 264 && EquipNumSearch(1176) && SkillSearch(81) == 10)
      skillModifier += 20;

    if (TyouEnkakuSousa3dan == -1 && EquipNumSearch(639))
      skillModifier += 15;

    // Meteor Assault#264
    if (this._activeSkill['id'] == 264)
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
      if (this._activeSkill['id'] >= 187 || this._activeSkill['id'] <= 189)
        skillModifier += 5 * this._si['refine']['rightHand'];

      // [Every Refine Level Above +5]  Increase [Tiger Knuckle Fist] and [Chain Crush Combo] damage by 5%
      if (this._activeSkill['id'] == 289 || this._activeSkill['id'] == 290)
        skillModifier += 5 * Math.max(0, this._si['refine']['rightHand'] - 5);
    }

    // Glorious Claymore#1080 - [Every Refine Level] Increase [Bowling Bash] and [Charge Attack] damage by 1% [Amor]
    if (this._activeSkill['id'] == 76 || this._activeSkill['id'] == 308)
      skillModifier += this._si['refine']['rightHand'] * EquipNumSearch(1080);

    // Mammonite#65
    if (this._activeSkill['id'] == 65)
    {
      // Glorious Two Handed Axe#1087 - [Every Refine Level] Increase [Mammonite] damage by 2% [Amor]
      skillModifier += 2 * this._si['refine']['rightHand'] * EquipNumSearch(1087);

      // Glorious Cleaver#1088 - [Every Refine Level] Increase [Mammonite] damage by 1% [Amor]
      skillModifier += this._si['refine']['rightHand'] * EquipNumSearch(1088);
    }

    // Glorious Flamberge#1077 - [Every Refine Level] Increase [Bash], [Mammonite] and [Back Stab] damage by 2% [Amor]
    if (this._activeSkill['id'] == 65 || this._activeSkill['id'] == 6 || this._activeSkill['id'] == 169)
      skillModifier += 2 * this._si['refine']['rightHand'] * EquipNumSearch(1077);

    // Glorious Grenade Launcher#1103 - [Every Refine Level] Increase [Ground Drift] damage by 2% [Amor]
    if (this._activeSkill['id'] == 437)
      skillModifier += 2 * this._si['refine']['rightHand'] * EquipNumSearch(1103);

    // Triple Action#418
    if (this._activeSkill['id'] == 418)
    {
      // Glorious Grenade Launcher#1103 - [Every Refine Level] Increase [Triple Action] damage by 1% [Amor]
      skillModifier += this._si['refine']['rightHand'] * EquipNumSearch(1103);

      // Glorious Grenade Launcher#1103, Glorious Rifle#1100, Glorious Shotgun#1102 - [If Scouter Is Not Equipped] Increase [Triple Action] damage by 30%
      if (!EquipNumSearch(1387))
        skillModifier += 30 * (EquipNumSearch(1103) + EquipNumSearch(1100) + EquipNumSearch(1102));
    }

    // Glorious Huuma Shuriken#1098 - [Every Refine Level] Increase [Throw Huuma Shuriken] damage by 3% [Amor]
    if (this._activeSkill['id'] == 396)
      skillModifier += 3 * this._si['refine']['rightHand'] * EquipNumSearch(1098);

    // Glorious Revolver#1099 - [Every Refine Level] Increase [Rapid Shower] damage by 1% [Amor]
    if (this._activeSkill['id'] == 428)
      skillModifier += this._si['refine']['rightHand'] * EquipNumSearch(1099);

    // Glorious Rifle#1100 - [Every Refine Level] Increase [Tracking] and [Piercing Shot] damage by 3% [Amor]
    if (this._activeSkill['id'] == 430 || this._activeSkill['id'] == 432)
      skillModifier += 3 * this._si['refine']['rightHand'] * EquipNumSearch(1100);

    // Glorious Shotgun#1102 - [Every Refine Level] Increase [Spread Attack] damage by 2% [Amor]
    if (this._activeSkill['id'] == 436)
      skillModifier += 2 * this._si['refine']['rightHand'] * EquipNumSearch(1102);

    // Valorous Battle CrossBow#913 - [Refine level 8-10] Increase damage with [Sharp Shooting] by 10%] [Gawk]
    if (this._activeSkill['id'] == 272 && this._si['refine']['rightHand'] >= 8)
      skillModifier += 10 * EquipNumSearch(913);

    // Glorious Hunter Bow#1089 - [Every Refine] Increases [Double Strafing] damage by 2%] [Gawk]
    if (this._activeSkill['id'] == 40)
      skillModifier += 2 * this._si['refine']['rightHand'] * EquipNumSearch(1089);

    // Valorous Carnage Katar#910 - [Refine Level 6~10] Increases damage with [Sonic Blow] by 10%.
    if (this._si['refine']['rightHand'] >= 6 && this._activeSkill['id'] == 83 && EquipNumSearch(910))
    {
      skillModifier += 10;

      // [Refine Level 9~10] - Increases damage with [Sonic Blow] by 20%.
      if (this._si['refine']['rightHand'] >= 9)
        skillModifier += 20;
    }

    skillModifier += StPlusCalc2(5000 + this._activeSkill['id']) + StPlusCard(5000 + this._activeSkill['id']);
    */

    return this.applyDamageModifier(damage, skillModifier);
  }

  private applyMagicalSkillDamageRatio(damage: number[]): number[] {
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
    return this.applyDamageModifier(damage, skillModifier);
  }

  private applyElementDamageRatio(damage: number[]): number[] {
    let elementRatio = 100;
    let activeElement: string = 'neutral';
    let aoeDamageBonus = [100, 110, 114, 117, 119, 120];

    if (!this._activeSkill['ignoreElement']) {
      console.log(this.ttCoreService.elementDb);

      let activeElement = this._activeSkill['element'];

      if ('weapon' === activeElement) {
        if (this._appliedEndow) activeElement = this._appliedEndow;
        else if (this._ammo) activeElement = this._ammo['element'];
        else activeElement = this._rhWeapon['element'];
      }

      let elementModifier: number =
        this.ttCoreService.elementDb[this._target['element']][activeElement][
          this._target['elementLv'] - 1
        ];
      elementRatio *= Math.max(elementModifier, 0);
    }

    // Volcano on fire attack
    let volcanoLv = this._si['activeBuff']['Volcano'];
    if (volcanoLv && activeElement == 'fire')
      damage = this.applyDamageModifier(damage, aoeDamageBonus[volcanoLv]);

    // Deluge on water attack
    let delugeLv = this._si['activeBuff']['Deluge'];
    if (delugeLv && activeElement == 'water')
      damage = this.applyDamageModifier(damage, aoeDamageBonus[delugeLv]);

    // Violent Gale on wind attack
    let violentGaleLv = this._si['activeBuff']['Violent Gale'];
    if (violentGaleLv && activeElement == 'wind')
      damage = this.applyDamageModifier(damage, aoeDamageBonus[violentGaleLv]);

    // Fire damage are doubled on spider web
    // FIXME: Handle monster sc
    //if (this._si['isWebbed'] && this._activeSkill['element'] == 3)
    //  damage = this.applyDamageModifier(damage, 200);
    return this.applyDamageModifier(damage, elementRatio);
  }

  private applyAdditionalElementDamage(
    damage: number[],
    baseAtk: number
  ): number[] {
    let additionalDamage = [0, 0];

    if (this._si['activeBuff']['Magnum Break']) {
      // Apply Magnum Break#7 SC_WATK_ELEMENT damage bonus
      let fireLv1Ratio =
        this.ttCoreService.elementDb['fire'][this._target['element']][
          this._target['elementLv'] - 1
        ];
      additionalDamage = this.applyDamageModifier(
        this.calcBaseAtk(baseAtk, false, false, false),
        20
      ); // 20% of base attack
      additionalDamage = this.applyDamageModifier(
        additionalDamage,
        100 * Math.max(fireLv1Ratio, 0)
      ); // With fire property
    }

    return damage.map(function (x, idx) {
      return x + additionalDamage[idx];
    });
  }

  private apply_defensive_status_change(damage: number[]): number[] {
    // Defender
    // Wall of Fog
    // Armor Change
    // Assumptio
    // Energy Coat

    return damage;
  }

  private applyOffensiveStatusChange(damage: number[]): number[] {
    if (!this._activeSkill['ignore_offensive_status']) {
      // True Sight#270 - Damage +20%
      let trueSightLv = this._si['activeBuff']['True Sight'];
      if (trueSightLv)
        damage = this.applyDamageModifier(damage, 100 + 2 * trueSightLv);

      // Link - Priest - Holy Light#387 - Managed through skill ratio
      // Link - Assassin - Sonic Blow#388 +25% on WoE +100% in PvM
      if (388 == this._activeSkill['id'])
        damage = this._isPvp
          ? this.applyDamageModifier(damage, 125)
          : this.applyDamageModifier(damage, 200);

      // Link - Crusader - Shield Boomerang +100%
      if (384 == this._activeSkill['id']) this.applyDamageModifier(damage, 200);

      // Venom Splasher#88, Soul Breaker#263, Meteor Assault#264 ignore EDP
      let edp_lv = this._si['activeBuff']['Endless Deadly Poison'];
      if (
        this._activeSkill['id'] != 88 &&
        this._activeSkill['id'] != 263 &&
        this._activeSkill['id'] != 264 &&
        edp_lv
      )
        this.applyDamageModifier(damage, 150 + 50 * edp_lv);

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

  private applyMiscDamageBonus(damage: number[]): number[] {
    let misc_damage_bonus = [0, 0];

    // Throw Shuriken#394
    if (394 == this._activeSkill['id']) {
      let shuriken_constant_damage_bonus = 4 * this._activeSkillLv;
      misc_damage_bonus = [
        shuriken_constant_damage_bonus,
        shuriken_constant_damage_bonus,
      ];
    }

    // Asura Strike#197#321
    if (197 == this._activeSkill['id'] || 321 == this._activeSkill['id']) {
      let asura_constant_damage_bonus = 250 + 150 * this._activeSkillLv;
      misc_damage_bonus = [
        asura_constant_damage_bonus,
        asura_constant_damage_bonus,
      ];
    }

    // Magical Bullet#423
    if (423 == this._activeSkill['id'])
      misc_damage_bonus = [this._si['minMatk'], this._si['maxMatk']];

    return [damage[0] + misc_damage_bonus[0], damage[1] + misc_damage_bonus[1]];
  }

  private applyDefenseReduction(damage: number[]): number[] {
    if (!this._activeSkill['ignoreDefense']) {
      // FIXME: replace with target_info for def reduction
      // FIXME: VITDEF formula different for players
      let def2 = this._target['vit'];
      let vitDef = [0, 0, 0];
      let vitDefBonus = Math.floor(def2 / 20) * Math.floor(def2 / 20);

      if (!this._isPvp && this._si['activeStatus']['Eska'])
        // Eska increases the random part of the formula by 100
        vitDefBonus += 100;

      vitDef[0] = def2;
      vitDef[1] = def2 + Math.max(0, (vitDefBonus - 1) / 2);
      vitDef[2] = def2 + Math.max(0, vitDefBonus - 1);

      // Defense reduction managed directly in monster properties
      let effective_def = this._target['def'];

      if (244 == this._activeSkill['id'])
        // Acid Terror#244 ignores defense (but not vitdef)
        effective_def = 0;

      if (this.isAttackPiercing())
        // Investigate#193 damage are doubled
        damage = damage.map((x, idx) => {
          return Math.floor(
            (x * (effective_def + vitDef[idx])) /
              (193 == this._activeSkill['id'] ? 50 : 100)
          );
        });
      else
        damage = damage.map(function (x, idx) {
          return Math.floor((x * (100 - effective_def)) / 100 - def2);
        });
    }

    return damage;
  }

  private isAttackPiercing(): boolean {
    if (
      this._activeSkill['id'] != 162 &&
      this._activeSkill['id'] != 324 &&
      this._activeSkill['id'] != 284 &&
      this._activeSkill['id'] != 159 &&
      this._activeSkill['id'] != 384
    )
      // Sacrifice#284, Grand Cross#162, Shield Chain#324, Shield Boomerang#159#384
      return (
        193 == this._activeSkill['id'] ||
        this._si['activeBonus']['defRatioAtkClass']
      ); // bDefRatioAtkClass, Investigate#193

    return false;
  }

  private applyPostDefenseDamageBonus(
    damage: number[],
    isDualWielding: boolean
  ) {
    let damageBonus = 0;
    let weaponRefineBonus = 0;

    if (isDualWielding)
      weaponRefineBonus = this.calcWeaponRefineBonus(
        this._si['refine']['leftHand'],
        this._lhWeapon['lv']
      );
    else
      weaponRefineBonus = this.calcWeaponRefineBonus(
        this._si['refine']['rightHand'],
        this._rhWeapon['lv']
      );

    // Throwing Pratice#393 mastery damage bonus only applying to Throw Shuriken#394
    if (394 == this._activeSkill['id'])
      damageBonus += 3 * this._si['passiveSkill']['Throw Shuriken'];

    // Weapon refine bonus not applying for Investigate#193, Asura Strike#197#321, Shield Chain#324, Acid Demonstration#328 and Shield Boomerang#159#384
    let excludedSkills = [159, 193, 197, 321, 324, 328, 384];
    if (192 == this._activeSkill['id'])
      // Bonus counted #spheres#185 times for Finger Offensive#192
      damageBonus +=
        weaponRefineBonus * this._si['activeBuff']['Active Spheres'];
    else if (excludedSkills.findIndex((x) => x == this._activeSkill['id']) < 0)
      damageBonus += weaponRefineBonus;

    // Aura Blade#254 damage bonus, not applied with Spiral Pierce#259
    if (this._activeSkill['id'] != 259)
      damageBonus += this._si['activeBuff']['Aura Blade'] * 20;

    // Blade of Angels#1379 - #50 Enable Aura Blade lv 5
    /* FIXME SQI Bonus
    if (1379 == n_A_Equip[0] && SQI_Bonus_Effect.findIndex(x => x == 50) > -1)
      damageBonus += 100;*/

    damage = damage.map(function (x) {
      return x + damageBonus;
    });

    // Sonic Acceleration#381 - Sonic Blow damage#83#388 + 10%
    if (
      (83 == this._activeSkill['id'] || 388 == this._activeSkill['id']) &&
      this._si['passiveSkill']['Sonic Acceleration']
    )
      damage = this.applyDamageModifier(damage, 110);

    damage = this.applyMasteryBonus(damage);

    return damage;
  }

  private applyMagicalDefenseReduction(damage: number[]): number[] {
    if (!this._activeSkill['ignoreDefense']) {
      let mdef2 = this._target['int'] + Math.floor(this._target['vit'] / 2); // FIXME include mdef2 in mobdb ?

      // mdef reduction already applied on target mdef
      damage[0] = Math.max(
        1,
        Math.floor((damage[0] * (100 - this._target['mdef'])) / 100 - mdef2)
      );
      damage[1] = Math.max(
        1,
        Math.floor((damage[1] * (100 - this._target['mdef'])) / 100 - mdef2)
      );
    }

    return damage;
  }

  private calcMagicalAttackDamage(damage: number[]): number[] {
    // Initialize damage list with min matk and max matk used for status display
    damage[0] = this._si['minMatk'];
    damage[1] = this._si['maxMatk'];

    if (122 == this._activeSkill['id'])
      // Fire Pillar#122
      damage = this.applyDamageBonus(damage, 50);
    // Turn Undead#102 and Magnus Exorcismus#104 only apply on undead monsters
    else if (
      (104 == this._activeSkill['id'] || 102 == this._activeSkill['id']) &&
      'Undead' != this._target['race']
    )
      damage[0] = damage[1] = 0;
    else if (102 == this._activeSkill['id']) {
      // FIXME: Input for remaining HP to avoid managing two variables
      let targetRemainingHp = 1;
      let tuMaxChance = Math.max(
        20 * this._activeSkillLv +
          this._luk +
          this._int +
          this._baseLv +
          200 -
          (200 * targetRemainingHp) / this._target['hp'],
        700
      );
      let tuMinChance = Math.max(
        20 * this._activeSkillLv + this._luk + this._int + this._baseLv,
        700
      );

      damage[0] = this._baseLv + this._int + this._activeSkillLv * 10;
      damage[1] = this._target['hp'];
    } else if (325 == this._activeSkill['id'])
      // Gravitation Field#325
      damage[0] = damage[1] = 200 + 200 * this._activeSkillLv;

    // FIXME: Manage heal/sanctuary
    // skill_calc_heal(this._activeSkill['id'], this._activeSkill['lv']);

    let skillRatio: number = this.retrieveSkillRatio();
    damage = this.applyDamageModifier(damage, skillRatio);
    damage = this.applyMagicalSkillDamageRatio(this._activeSkill['id']);
    damage = this.applyMagicalDefenseReduction(
      this._activeSkill['ignoreDefense']
    );

    // Manage Grand & Dark Cross
    if (162 == this._activeSkill['id']) {
      // Grand Cross#162 FIXME Invalid result
      let physicalDamage = this.calcPhysicalAttackDamage(false, false);
      damage = this.applyElementDamageRatio(
        damage.map((x, idx) => {
          return Math.floor(
            ((x + physicalDamage[idx]) * (100 + 40 * this._activeSkillLv)) / 100
          );
        })
      );
    } else damage = this.applyElementDamageRatio(damage);

    if (this._activeSkill['allowsModifiers']) {
      // MagicAddEle
      // Damage modifier on magic element
      let elementModifier =
        100 +
        this._si['activeBonus']['magicElementRate'][
          this._activeSkill['element']
        ];

      // Damage modifier for monster element
      elementModifier +=
        this._si['activeBonus']['magicAddElement'][this._target['element']];

      // Damage modifier for race - bMagicAddRace
      // Dragonology#234 - Increases Attack Power, MATK and DEF against Dragon type monsters by 4% per SkillLV
      let dragonologyBonus =
        'Dragon' === this._target['race']
          ? this._si['passiveSkill']['Dragonology'] * 4
          : 0;
      let raceModifier =
        100 +
        this._si['activeBonus']['magicAddRace'][this._target['race']] +
        dragonologyBonus;

      // Increases magical damage against bosstype monsters - bMagicAddClass,Class_Boss
      let classModifier =
        100 +
        this._si['activeBonus']['magicAddClass'][this._target['class']] +
        this._si['activeBonus']['magicAddClass']['all'];

      // bMagicAddSize - unused modifier
      // bMagicAddRace2
      let magicAddRace2Modifier =
        100 +
        100 +
        this._si['activeBonus']['magicAddRace2'][this._target['race2']];

      // bAddMagicDamageClass - unused modifier

      let modifiers =
        (((((raceModifier / 100) * elementModifier) / 100) * classModifier) /
          100) *
        magicAddRace2Modifier;

      damage = this.applyDamageModifier(damage, modifiers);
    }

    return damage;
  }

  private calcAttackDamage(
    isCriticalAttack: boolean,
    isDualWielding: boolean
  ): number[] {
    let damage = [0, 0];

    // Manage misc skill with fixed damage
    if (22 == this._activeSkill['id'])
      // Throw Stone#22
      return damage.map(() => 50);
    else if (283 == this._activeSkill['id'])
      // Pressure#283
      return damage.map(() => 500 + 300 * this._activeSkill['lv']);
    else if (397 == this._activeSkill['id']) {
      // Throw Zeny#397
      let zeny_min_damage = 500 * this._activeSkill['lv'];
      let zeny_max_damage = zeny_min_damage * 2;
      damage = [zeny_min_damage, zeny_max_damage];

      // Damage divided by 3 on boss type monsters
      // Damage divided by 2 on players, FIXME: better handling for Taijin
      return damage.map((x) => {
        return Math.floor(
          x / (this._target['mode']['isBoss'] ? 3 : this._isPvp ? 2 : 1)
        );
      });
    }

    //skill_info = retrieve_skill_info(this._activeSkill['id'], this._activeSkill['lv']);
    console.log('before: calcPhysicalAttackDamage');
    console.log(damage);

    if (this._activeSkill['isMagicAttack'])
      damage = this.calcMagicalAttackDamage(damage);
    else
      damage = this.calcPhysicalAttackDamage(isCriticalAttack, isDualWielding);
    console.log('after: calcPhysicalAttackDamage');
    console.log(damage);
    damage = damage.map((x) => {
      return this._activeSkill['isConsideredAsSingleHit']
        ? x - (x % this._activeSkill['hits'])
        : x * this._activeSkill['hits'];
    });

    // Lex Aeterna
    if (this._si['activeStatus']['Lex Aeterna']) {
      if (this._activeSkill['isMultiHits'])
        // Manage multi-hit
        damage = this.applyDamageModifier(
          damage,
          100 + 100 / this._activeSkill['hits']
        );
      else damage = this.applyDamageModifier(damage, 200);
    }

    // FIXME: Manage damage reduction status
    // SC_ARMORCHANGE, SC_ENERGYCOAT, SC_FOGWALL, SC_DEFENDER, SC_ASSUMPTIO

    // FIXME: Manage RC2 damage modifiers

    // Asura Strike#197#321 soft cap damage management
    if (197 == this._activeSkill['id'] || 321 == this._activeSkill['id'])
      damage = damage.map((x) => this.manageAsuraSoftCap(x));

    return damage.map((x) => Math.max(0, x));
  }

  private calcPhysicalAttackDamage(
    isCriticalAttack: boolean,
    isDualWielding: boolean
  ) {
    let baseAtk = this.ttSessionInfoService.baseAtk;
    let isDexBased: boolean =
      'ammoType' in this.ttCoreService.weaponTypeDb[this._rhWeaponType];

    let damage = this.calcSkillBaseDamage(
      baseAtk,
      isCriticalAttack,
      isDualWielding,
      isDexBased
    );

    // Apply skill ratio
    let skillRatio = this.retrieveSkillRatio();
    damage = this.applyDamageModifier(damage, skillRatio);
    console.log('after: applyDamageModifier : Skill Ratio = ' + skillRatio);
    console.log(damage);

    damage = this.applyPhysicalSkillDamageModifiers(damage);
    console.log('after: applyPhysicalSkillDamageModifiers');
    console.log(damage);
    damage = this.applyMiscDamageBonus(damage);
    console.log('after: applyMiscDamageBonus');
    console.log(damage);
    damage = this.applyOffensiveStatusChange(damage);
    console.log('after: applyOffensiveStatusChange');
    console.log(damage);

    damage = this.applyDefenseReduction(damage);
    console.log('after: applyDefenseReduction');
    console.log(damage);
    damage = this.applyPostDefenseDamageBonus(damage, isDualWielding);
    console.log('after: applyPostDefenseDamageBonus');
    console.log(damage);
    damage = this.applyElementDamageRatio(damage);
    console.log('after: applyElementDamageRatio');
    console.log(damage);
    damage = this.applyAdditionalElementDamage(damage, baseAtk);
    console.log('after: applyAdditionalElementDamage');
    console.log(damage);

    // Throw Kunai#395 bonus damage
    if (395 == this._activeSkill['id']) damage = damage.map((x) => x + 90);

    // Weaponry Research#148 damage bonus
    damage = damage.map(
      (x) => x + 2 * this._si['passiveSkill']['Weaponry Research']
    );

    // Envenom#17 [TF_Poison] damage bonus
    if (17 == this._activeSkill['id'])
      damage = damage.map((x) => x + 15 * this._activeSkillLv);

    // Ground Drift#437 bonus damage
    if (437 == this._activeSkill['id'])
      damage = damage.map((x) => x + 50 * this._activeSkillLv);

    // Hilt Binding#146 damage bonus, does not apply to Cart Revolution#66
    if (
      this._activeSkill['id'] != 66 &&
      this._si['passiveSkill']['Hilt Binding']
    )
      damage = damage.map((x) => x + 4);

    // FIXME Star Crumb bonus, does not apply to Shield Boomerang#159#384
    // if (this._activeSkill['id'] != 159 && this._activeSkill['id'] != 384)
    // ATK_ADD2(wd.damage, wd.damage2, ((wd.div_ < 1) ? 1 : wd.div_) * sd->right_weapon.star, ((wd.div_ < 1) ? 1 : wd.div_) * sd->left_weapon.star);

    // Spirit Sphere damage bonus including Flip the Coin#416 for gunslingers
    let excludedSkills = [159, 197, 321, 324, 384]; // Shield Chain#324, Shield Boomerang#159#384, Asura Strike#197#321
    if (excludedSkills.findIndex((x) => x == this._activeSkill['id']) < 0) {
      // FIXME: Better management for sphere consumption, Triple Action#418, Investigate#193, more ?
      if (192 == this._activeSkill['id'])
        damage = damage.map(
          (x) => x + 3 * Math.pow(this._si['activeBuff']['Active Spheres'], 2)
        );
      // Investigate#193 is consuming one sphere, Triple Action#418 is applying 3 times the damage bonus
      else
        damage = damage.map(
          (x) =>
            x +
            3 *
              (Math.max(
                0,
                this._si['activeBuff']['Active Spheres'] -
                  (193 == this._activeSkill['id'] ? 1 : 0)
              ) +
                (418 == this._activeSkill['id'] ? 3 : 1) *
                  this._si['passiveSkill']['Triple Action'])
        );
      // FIXME: Chain Action is considering twice this bonus for base attack max damage during the trigger
    }

    // Sprint#329 unarmed bonus for Whirlwind Kick#331, Axe Kick#333, Round Kick#335 and Counter Kick#337
    if (
      [331, 333, 335, 337].findIndex((x) => x == this._activeSkill['id']) >
        -1 &&
      'Unarmed' == this._rhWeapon['weaponType']
    )
      damage = damage.map((x) => x + 10 * this._si['activeStatus']['Sprint']);

    // Refine bonus for Shield Chain#324 and Shield Boomerang#159#384
    if ([159, 324, 385].findIndex((x) => x == this._activeSkill['id']) > -1)
      damage = damage.map((x) => x + this._si['refine']['leftHand'] * 10);

    damage = this.applyPhysicalDamageModifiers(damage, isCriticalAttack);

    // Soul Breaker#263 misc damage part based on source INT
    if (263 == this._activeSkill['id']) {
      damage = damage.map((x) => x + 500 + 5 * this._activeSkillLv * this._int);
      damage[2] += 500; // Max damage must take into consideration the random part rnd()%500
    }

    return damage;
  }

  private manageAsuraSoftCap(asuraDamage: number): number {
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

  // Additional base atk dmg bonus for refine and overrefine (weapon is refined above safety refine level)
  private calcWeaponRefineBonus(
    weaponRefine: number,
    weaponLv: number
  ): number {
    let refineDamageBonus = 0;

    if (weaponLv) {
      let refineBonus = [2, 3, 5, 7];
      refineDamageBonus = weaponRefine * refineBonus[weaponLv - 1];
    }

    return refineDamageBonus;
  }

  private calcWeaponOverRefineBonus(
    weaponRefine: number,
    weaponLv: number
  ): number {
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

  private retrieveSkillRatio(): number {
    let skillRatio: string | number = this._activeSkill['ratio'];
    let misc = 0; // additinal flag to compute skill ratio

    // FIXME Hatred/Brandish
    // FIXME Set misc for dedicated skills

    if (typeof skillRatio === 'string')
      skillRatio = eval(skillRatio)(this._activeSkillLv, misc);

    return (skillRatio as number) * 100;
  }
}
