import { Injectable, OnInit } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { DictDb, SessionInfo } from './models';
import { TTCoreService } from './tt-core.service';

@Injectable({
  providedIn: 'root',
})
export class TTSessionInfoService {
  // Main stats information
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

  private _jobInfo: any | null;
  private _activeBonus: any;

  private _sessionInfo: SessionInfo;

  protected _buffSkills: DictDb;
  protected _activeSkills: DictDb;
  protected _passiveSkills: DictDb;

  constructor(private ttCore: TTCoreService) {
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

    this._jobInfo = null;
    this._activeBonus = null;

    this._buffSkills = {};
    this._activeSkills = {};
    this._passiveSkills = {};

    this._sessionInfo = {
      baseLv: 1,
      jobLv: 1,
      class: 'Novice',
      aspdPotion: 'None',
      atk: 0,
      weaponAtk: 0,
      ammoType: '',
      vanillaMode: 'Unrestricted',
      baseStats: {
        str: 1,
        agi: 1,
        vit: 1,
        int: 1,
        dex: 1,
        luk: 1,
      },
      refine: {
        upperHg: 0,
        middleHg: 0,
        lowerHg: 0,
        armor: 0,
        rightHand: 0,
        leftHand: 0,
        garment: 0,
        shoes: 0,
        rhAccessory: 0,
        lhAccessory: 0,
      },
      equip: {
        upperHg: '',
        middleHg: '',
        lowerHg: '',
        armor: '',
        rightHand: 'Unarmed',
        rightHandType: 'Unarmed',
        leftHand: 'Unarmed',
        leftHandType: 'Unarmed',
        garment: '',
        shoes: '',
        rhAccessory: '',
        lhAccessory: '',
      },
      card: {
        upperHg: '',
        middleHg: '',
        armor: '',
        rightHand: ['', '', '', ''],
        leftHand: ['', '', '', ''],
        garment: '',
        shoes: '',
        rhAccessory: '',
        lhAccessory: '',
      },
      enchant: {
        middleHg: [],
        armor: [],
        rightHand: [],
        leftHand: [],
        garment: [],
        shoes: [],
        rhAccessory: [],
        lhAccessory: [],
      },
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
      activeFood: {
        Stats: {
          STR: 'STR+0',
          AGI: 'AGI+0',
          VIT: 'VIT+0',
          INT: 'INT+0',
          DEX: 'DEX+0',
          LUK: 'LUK+0',
        },
        'New World': {
          'Rune Strawberry Cake': false,
          'Schwartzwald Pine Jubilee': false,
          'Arunafeltz Desert Sandwich': false,
          "Manuk's Sturdiness": false,
          "Manuk's Faith": false,
          "Manuk's Will": false,
          "Pinguicula's Fruit Jam": false,
          "Cornus' Tear": false,
          "Luciola's Honey Jam": false,
        },
        BG: {
          'Military Ration B': false,
          'Military Ration C': false,
          'Tasty Pink Ration': false,
          'Tasty White Ration': false,
        },
        'Summer Cocktails': {
          "Venatu's Beep": false,
          "Old Dracula's Mix": false,
          'Spammers Heaven': false,
          "Myst Case's Surprise": false,
          'Seductive Bathory': false,
          "Sting's Slap": false,
          'Blossoming Geographer': false,
          'Drip of Yggdrasil': false,
          'Moscow Headless Mule': false,
          "Bobo's Boba": false,
          "Wolfchev's Nightcap": false,
          "Chepet's Match": false,
          "Dullahan's Ale": false,
          "Sippin' Galapago": false,
          "Sleeper's Dream": false,
          "Mobster's Paradise": false,
        },
        Misc: {
          Abrasive: false,
          'Buche de Noël': false,
          'Guarana Candy': false,
          'Greater Agimat of Ancient Spirit': false,
          'Box of Resentment': false,
          'Box of Drowsiness': false,
          'Sesame Pastry': false,
          'Honey Pastry': false,
          'Rainbow Cake': false,
        },
        Resistance: {
          'Coldproof Potion': false,
          'Earthproof Potion': false,
          'Fireproof Potion': false,
          'Thunderproof Potion': false,
        },
        Eclage: {
          'Snow Flip': false,
          'Peony Mommy': false,
          'Slapping Herb': false,
          'Yggdrasil Dust': false,
        },
        Eden: {
          'Rough Energy Crystal': false,
          'Purified Energy Crystal': false,
          'High Energy Crystal': false,
        },
      },
      passiveSkill: {
        Dragonology: 0,
        'Cavalier Mastery': 0,
        'Fighting Chant': 0,
        'Sword Mastery': 0,
        'Two-handed Sword Mastery': 0,
        'Spear Mastery': 0,
        'Axe Mastery': 0,
        'Katar Mastery': 0,
        'Advanced Katar Mastery': 0,
        'Advanced Book': 0,
        'Musical Lesson': 0,
        'Dance Lesson': 0,
        'Iron Hand': 0,
        'Throw Shuriken': 0,
        'Sonic Acceleration': 0,
        'Sprint Unarmed': 0,
        'Demon Bane': 0,
        'Beast Bane': 0,
        'Steel Crow': 0,
        'Weaponry Research': 0,
        'Hilt Binding': 0,
        'Triple Action': 0,
        'Hunter Link': 0,
        'Crusader Link': 0,
        'Assassin Link': 0,
      },
      activeBuff: {
        isMaximizePowerActive: false,
        'Active Spheres': 0,
        'Aura Blade': 0,
        'Magnum Break': 0,
        'Endless Deadly Poison': 0,
        'True Sight': 0,
        Deluge: 0,
        Volcano: 0,
        'Violent Gale': 0,
      },
      activeStatus: {
        Sprint: 0,
      },
    };

    this._activeBonus = this._sessionInfo['activeBonus'];
  }

  public get sessionInfo() {
    return this._sessionInfo;
  }

  public updateStats(): void {
    this._str =
      this._sessionInfo['baseStats']['str'] +
      this._sessionInfo['activeBonus']['str'] +
      this._sessionInfo['activeBonus']['scStrFood'];
    this._agi =
      this._sessionInfo['baseStats']['agi'] +
      this._sessionInfo['activeBonus']['agi'] +
      this._sessionInfo['activeBonus']['scAgiFood'] +
      this._sessionInfo['activeBonus']['scIncreaseAgi'];
    this._vit =
      this._sessionInfo['baseStats']['vit'] +
      this._sessionInfo['activeBonus']['vit'] +
      this._sessionInfo['activeBonus']['scVitFood'];
    this._int =
      this._sessionInfo['baseStats']['int'] +
      this._sessionInfo['activeBonus']['int'] +
      this._sessionInfo['activeBonus']['scIntFood'];
    this._dex =
      this._sessionInfo['baseStats']['dex'] +
      this._sessionInfo['activeBonus']['dex'] +
      this._sessionInfo['activeBonus']['scDexFood'];
    this._luk =
      this._sessionInfo['baseStats']['luk'] +
      this._sessionInfo['activeBonus']['luk'] +
      this._sessionInfo['activeBonus']['scLukFood'];
  }

  public onClassChange() {
    this._jobInfo = this.ttCore.jobDb[this._sessionInfo['class']];

    this.updateClassSkillInfo();
  }

  public updateClassSkillInfo(): void {
    console.log('Update Skill Infos', this._jobInfo);

    this._buffSkills = {};
    this._activeSkills = {};
    this._passiveSkills = {};

    if (this._jobInfo) {
      let jobMask = this._jobInfo['mask'];
      for (let skill in this.ttCore.skillDb) {
        let skillInfo = this.ttCore.skillDb[skill];
        if (skillInfo['isBuff']) this._buffSkills[skill] = skillInfo;
        else if (
          skillInfo['isActive'] &&
          (skillInfo['job'] & jobMask) == jobMask
        )
          this._activeSkills[skill] = skillInfo;
        else if (
          skillInfo['isPassive'] &&
          (skillInfo['job'] & jobMask) == jobMask
        )
          this._passiveSkills[skill] = skillInfo;
      }

      // FIXME: Manage autospell in active skills
    }

    // console.log(this._buffSkills);
    // console.log(this._activeSkills);
    // console.log(this._passiveSkills);
  }

  public updateSessionInfo(): void {
    this.resetBonus();
    this.computeClassJobBonus();
    this.updateBonus();
    this.updateFoodBonus();
    this.updateStats();

    if (this._jobInfo) {
      this._maxHp = this.computeHpSp(this._vit, 'Hp');
      this._maxSp = this.computeHpSp(this._int, 'Sp');
      this.computeAttackSpeed();
    }

    // All weapons with ammunitions are considered as DEX type
    let isDexBased: boolean = this._sessionInfo['ammoType'] != '';

    this.computeHit();
    this.computeFlee();
    this.computePerfectDodge();
    this.computeAtk(isDexBased);
    this.computeMatk();
    this.computeCriticalRate();
  }

  public computeClassJobBonus() {
    if (this._jobInfo) {
      let jobLv: number = this._sessionInfo['jobLv'];
      let jobBonus: any = this._jobInfo['jobBonus'];
      for (let stat in jobBonus)
        this._activeBonus[stat] = jobBonus[stat].reduce(
          (bonus: number, lv: number) => (lv <= jobLv ? bonus + 1 : bonus),
          0
        );
    }
  }

  public resetBonus() {
    let bonusObjects: any[] = [
      this.sessionInfo['activeBonus'],
      this.sessionInfo['activeStatus'],
    ];

    for (let obj of bonusObjects) {
      for (let key in obj) {
        if (typeof obj[key] == 'number') {
          obj[key] = 0;
        } else {
          bonusObjects.push(obj[key]);
        }
      }
    }
  }

  public updateBonus() {
    // Retrieve bonus from equipment
    if (
      this._sessionInfo['equip']['rightHandType'] &&
      this._sessionInfo['equip']['rightHand']
    ) {
      let rhBonus: string =
        this.ttCore.weaponDb[this._sessionInfo['equip']['rightHandType']][
        this._sessionInfo['equip']['rightHand']
        ]['bonus'];
      if (rhBonus) eval(rhBonus)(this._sessionInfo['activeBonus']);
    }

    if (
      this._sessionInfo['equip']['leftHandType'] &&
      this._sessionInfo['equip']['leftHand'] &&
      'Unarmed' != this._sessionInfo['equip']['leftHand']
    ) {
      let lhBonus: string = '';

      if (this._isDualWielding)
        lhBonus =
          this.ttCore.weaponDb[this._sessionInfo['equip']['leftHandType']][
          this._sessionInfo['equip']['leftHand']
          ]['bonus'];
      else
        lhBonus =
          this.ttCore.shieldDb[this._sessionInfo['equip']['leftHand']]['bonus'];

      if (lhBonus) eval(lhBonus)(this._sessionInfo['activeBonus']);
    }

    if (this._sessionInfo['equip']['upperHg']) {
      this.evalBonus(
        this.ttCore.headgearDb['Upper'][this._sessionInfo['equip']['upperHg']],
        this._sessionInfo['activeBonus']
      );
    }

    if (this._sessionInfo['equip']['middleHg']) {
      this.evalBonus(
        this.ttCore.headgearDb['Middle'][
        this._sessionInfo['equip']['middleHg']
        ],
        this._sessionInfo['activeBonus']
      );
    }

    if (this._sessionInfo['equip']['lowerHg']) {
      this.evalBonus(
        this.ttCore.headgearDb['Lower'][this._sessionInfo['equip']['lowerHg']],
        this._sessionInfo['activeBonus']
      );
    }

    if (this._sessionInfo['equip']['armor']) {
      this.evalBonus(
        this.ttCore.armorDb[this._sessionInfo['equip']['armor']],
        this._sessionInfo['activeBonus']
      );
    }

    if (this._sessionInfo['equip']['garment']) {
      this.evalBonus(
        this.ttCore.garmentDb[this._sessionInfo['equip']['garment']],
        this._sessionInfo['activeBonus']
      );
    }

    if (this._sessionInfo['equip']['shoes']) {
      this.evalBonus(
        this.ttCore.shoesDb[this._sessionInfo['equip']['shoes']],
        this._sessionInfo['activeBonus']
      );
    }

    if (this._sessionInfo['equip']['rhAccessory']) {
      this.evalBonus(
        this.ttCore.accessoryDb[this._sessionInfo['equip']['rhAccessory']],
        this._sessionInfo['activeBonus']
      );
    }

    if (this._sessionInfo['equip']['lhAccessory']) {
      this.evalBonus(
        this.ttCore.accessoryDb[this._sessionInfo['equip']['lhAccessory']],
        this._sessionInfo['activeBonus']
      );
    }

    // Apply skill bonus which are ignoring cards/enchants bonus

    // Retrieve bonus from cards
    for (let location in this._sessionInfo['card']) {
      if (
        typeof this._sessionInfo['card'][location] === 'string' &&
        this._sessionInfo['card'][location]
      )
        this.evalBonus(
          this.ttCore.cardDb[this._sessionInfo['card'][location]],
          this._sessionInfo['activeBonus']
        );
      else {
        for (let card of this._sessionInfo['card'][location]) {
          if (card)
            this.evalBonus(
              this.ttCore.cardDb[card],
              this._sessionInfo['activeBonus']
            );
        }
      }
    }

    // Retrieve bonus from enchants
  }

  private computeHpSp(stat: number, key: string): number {
    let maxHpSp: number = 0;
    let valueTable: number[] = this._jobInfo[key.toLowerCase() + 'Table'];

    maxHpSp = Math.floor(
      valueTable[this._sessionInfo['baseLv'] - 1] *
      (1 + stat / 100) *
      (this._jobInfo['isTrans'] ? 1.25 : 1)
    );
    maxHpSp += this._sessionInfo['activeBonus']['max' + key];
    maxHpSp = Math.floor(
      maxHpSp *
      (1 + this._sessionInfo['activeBonus']['max' + key + 'Rate'] / 100)
    );

    return maxHpSp;
  }

  private computeHit() {
    this._hit =
      this._sessionInfo['baseLv'] +
      this._dex +
      this._sessionInfo['activeBonus']['flee'] +
      this._sessionInfo['activeBonus']['scHitFood'];
  }

  private computeCriticalRate() {
    this._crit = Math.floor(
      1 +
      this._luk / 3 +
      this._sessionInfo['activeBonus']['crit'] +
      this._sessionInfo['activeBonus']['scIncCrit']
    );
  }

  private computeAttackSpeed() {
    let asdpRate = 1000 - this._sessionInfo['activeBonus']['aspdRate'] * 10;

    // Consider aspd potion and increase aspd rate status change
    asdpRate -=
      this._sessionInfo['activeBonus']['scAspdPotion'] -
      this._sessionInfo['activeBonus']['scIncAspdRate'];

    let attackMotion =
      this._jobInfo['baseAspd'][this._sessionInfo['equip']['rightHandType']];

    if (this._isDualWielding)
      attackMotion = Math.floor(
        (attackMotion +
          this._jobInfo['baseAspd'][
          this._sessionInfo['equip']['leftHandType']
          ]) *
        0.7
      );

    attackMotion =
      attackMotion -
      Math.floor((attackMotion * (4 * this._agi + this._dex)) / 1000);
    attackMotion = attackMotion - this._sessionInfo['activeBonus']['aspd'] * 10;

    attackMotion = Math.floor((attackMotion * asdpRate) / 1000);
    this._aspd = Math.min(Math.floor((2000 - attackMotion) / 10), 190);
  }

  private computeFlee() {
    this._flee =
      this._sessionInfo['baseLv'] +
      this._agi +
      this._sessionInfo['activeBonus']['flee'] +
      this._sessionInfo['activeBonus']['scFleeFood'];
  }

  private computePerfectDodge() {
    this._perfectDodge = Math.floor(
      1 +
      this._luk * 0.1 +
      this._sessionInfo['activeBonus']['perfectDodge'] +
      this._sessionInfo['activeBonus']['scPdFood']
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
      this._sessionInfo['activeBonus']['atk'] +
      this._sessionInfo['activeBonus']['scAtkPotion'] +
      this._sessionInfo['activeBonus']['scIncAtkRate'];

    let rhWeaponAtk: number = 0;
    let rhWeaponType: string = this._sessionInfo['equip']['rightHandType'];
    if (rhWeaponType && this._sessionInfo['equip']['rightHand'])
      rhWeaponAtk =
        this.ttCore.weaponDb[rhWeaponType][
        this._sessionInfo['equip']['rightHand']
        ]['attack'];

    // Update left hand information
    let lhWeaponAtk: number = 0;
    let lhWeaponType = this._sessionInfo['equip']['leftHandType'];
    if (this._isDualWielding && this._sessionInfo['equip']['leftHand'])
      lhWeaponAtk =
        this.ttCore.weaponDb[lhWeaponType][
        this._sessionInfo['equip']['leftHand']
        ]['attack'];

    // but SC_INCATKRATE is also applied on weapon attack
    this._sessionInfo['weaponAtk'] =
      rhWeaponAtk +
      lhWeaponAtk +
      this._sessionInfo['activeBonus']['scIncAtkRate'];
    this._atk = this._baseAtk + this._sessionInfo['weaponAtk'];

    // FIXME: Manage

    // FIXME: Manage Concentration

    // FIXME: Manage bAtkRate
  }

  private computeMatk() {
    let dint = this._int * this._int;
    this._minMatk = Math.floor(
      this._int +
      dint / 49 +
      this._sessionInfo['activeBonus']['matk'] +
      this._sessionInfo['activeBonus']['scMatkPotion']
    );
    this._maxMatk = Math.floor(
      this._int +
      dint / 25 +
      this._sessionInfo['activeBonus']['matk'] +
      this._sessionInfo['activeBonus']['scMatkPotion']
    );

    this._minMatk = Math.floor(
      this._minMatk * (1 + this._sessionInfo['activeBonus']['matkRate'] / 100)
    );
    this._maxMatk = Math.floor(
      this._maxMatk * (1 + this._sessionInfo['activeBonus']['matkRate'] / 100)
    );
  }

  private updateFoodBonus() {
    for (let category in this.sessionInfo['activeFood']) {
      for (let key in this.sessionInfo['activeFood'][category]) {
        let foodName: string = key;
        let foodInfo: any = this.ttCore.foodDb[category][foodName];

        // Manage stat foods which have an additional nested hierarchy
        if (typeof this.sessionInfo['activeFood'][category][key] === 'string') {
          foodName = this.sessionInfo['activeFood'][category][key];
          foodInfo = this.ttCore.foodDb[category][key][foodName];
        }

        this.evalBonus(foodInfo, this._sessionInfo['activeBonus']);
      }
    }
  }

  // FIXME: Maybe restrict args to sessionInfo['activeBonus'] only
  private evalBonus(info: any, ...args: any[]) {
    let bonus: string = info['bonus'];
    if (bonus) eval(bonus).apply(null, args);
  }

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
  public get jobInfo(): any {
    return this._jobInfo;
  }
  public get isDualWielding(): boolean {
    return this._isDualWielding;
  }
  public set isDualWielding(flag: boolean) {
    this._isDualWielding = flag;
  }

  public get buffSkills() {
    return this._buffSkills;
  }
  public get activeSkills() {
    return this._activeSkills;
  }
  public get passiveSkills() {
    return this._passiveSkills;
  }
}
