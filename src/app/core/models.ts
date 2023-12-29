export interface JobDB {
  [key: string]: any;
}

export interface ItemDB {
  [key: string]: any;
}

export interface SessionInfo {
  [key: string]: any;
}

export interface DictDb {
  [key: string]: any;
}

export interface NestedDictDb {
  [key: string]: { [key: string]: any };
}

/****************/
/*** General  ***/
export type BaseStatsNames = "str" | "agi" | "vit" | "int" | "dex" | "luk";
export type BaseStats = {
  [key in BaseStatsNames]: number
}
export type ItemLocations = "upperHg" | "middleHg" | "lowerHg" | "armor" | "rightHand" | "leftHand" | "garment" | "shoes" | "rhAccessory" | "lhAccessory";
export type Item = {
  id: number,
  gid: number[],
  slots: number | string,
  weight: number,
  job: string,
  requiredLv: number,
  location: ItemLocations,
  description: string,
  isSqi: boolean,
  bonus: string,
  hasCombo: boolean,
  combosId: number[],
  isVanillaPvp: boolean,
  isVanillaPvm: boolean
}
export type ObjWithKeyString<T> = {
  [key: string]: T
}
export type VanillaMode = 'Unrestricted' | 'PvM Vanilla' | 'PvP Vanilla';
export const VANILLA_MODES: VanillaMode[] = ['PvM Vanilla', 'PvP Vanilla', "Unrestricted"];
export type MobRace = "formless" | "undead" | "brute" | "plant" | "insect" | "fish" | "demon" | "demiHuman" | "angel" | "dragon";
export type MobRace2 = "goblin" | "golem" | "orc" | "kobold" | "manuk" | "splendide" | "biolab" | "kiel" | "juperos";
export type Element = "neutral" | "water" | "earth" | "fire" | "wind" | "poison" | "holy" | "shadow" | "ghost" | "undead";
export type MobSize = "small" | "medium" | "large";
export type MobClass = "all" | "normal" | "boss" | "guardian";

/***************/
/*** JOB DB  ***/
export interface JobDbEntry {
  isTrans: boolean,
  maxJobLv: number,
  mask: string,
  compatibleWeapons: WeaponType[],
  hpTable: number[],
  spTable: number[],
  baseAspd: {
    [key: string]: number
  },
  jobBonus: {
    [key in BaseStatsNames]: number[]
  }
}
export type JobDB_V2 = {
  [key: string]: JobDbEntry
}
/******************/
/*** WEAPON DB  ***/
export type WeaponType =
  "Dagger" |
  "Sword" |
  "Two-handed Sword" |
  "Spear" |
  "Two-handed Spear" |
  "One-handed Axe" |
  "Two-handed Axe" |
  "Mace" |
  "Staff" |
  "Bow" |
  "Katar" |
  "Book" |
  "Knuckles" |
  "Instrument" |
  "Whip" |
  "Shuriken" |
  "Revolver" |
  "Rifle" |
  "Shotgun" |
  "Gatling Gun" |
  "Grenade Launcher" |
  "Unarmed";
export type WeaponTypeLeft = WeaponType | 'Shield';
export type Weapon = Item & {
  weaponType: WeaponType,
  weaponLv: number,
  attack: number
}
export type WeaponDB_V2 = {
  [key in WeaponType]: {
    [key: string]: Weapon
  }
}
/*****************/
/*** ARMOR DB  ***/
export type Armor = Item & {
  defense: number
}
export type ArmorDB_V2 = {
  [key: string]: Armor
}
/********************/
/*** Headgear DB  ***/
type HeadgearPosition = "Upper" | "Middle" | "Lower";
export type Headgear = Armor & {
  headgearPosition: HeadgearPosition
}
export type HeadgearDB_V2 = {
  [key in HeadgearPosition]: {
    [key: string]: Headgear
  }
}
/****************/
/*** CARD DB  ***/
export type CardLocations = "weapon" | "headgear" | "garment" | "shoes" | "accessory" | "armor" | "shield";
export type Card = {
  id: number,
  gid: number,
  location: CardLocations,
  description: string,
  hasCombo: boolean,
  combosId: number[],
  isVanillaPvp: boolean,
  isVanillaPvm: boolean,
  bonus: string
}
export type CardDB_V2 = {
  [key: string]: Card
}
/****************/
/*** FOOD DB  ***/
export type Food = {
  gid: number,
  duration: number,
  dispelOnDeath: boolean,
  name: string,
  bonus: string
}
export type FoodStatsNames = "STR" | "AGI" | "VIT" | "INT" | "DEX" | "LUK";
export type FoodStatsObj<T> = {
  [key in FoodStatsNames]: T
}
export type FoodDB_V2 = {
  Stats: FoodStatsObj<ObjWithKeyString<Food>>,
  "New World": ObjWithKeyString<Food>
  BG: ObjWithKeyString<Food>,
  "Summer Cocktails": ObjWithKeyString<Food>,
  Misc: ObjWithKeyString<Food>,
  Resistance: ObjWithKeyString<Food>,
  Eclage: ObjWithKeyString<Food>,
  Eden: ObjWithKeyString<Food>,
  "Apsd Potion": ObjWithKeyString<Food>
}
/*****************/
/*** SKILL DB  ***/
export type SkillElement = Element | "weapon";
export type Skill = {
  id: number,
  maxLevel: number,
  spCost: number[],
  element: SkillElement,  // TODO: in DB File the elements are numbers instead of strings
  hits: number,
  ratio: string,
  motion_delay: number,
  forced_motion: number,
  castTime: string,
  allows_modifiers: boolean,
  isCritical: boolean,
  damageTick: number,
  ignoreDefense: boolean,
  ignoreElement: boolean,
  isRangeAttack: boolean,
  isMagicAttack: boolean,
  isMeleeAttack: boolean,
  isMultiHits: boolean,
  duration: number,
  isConsideredAsSingleHit: boolean,
  enableMasteries: boolean,
  ignoreOffensiveStatus: boolean,
  hasPerfectHit: boolean,
  usesAmmos: boolean,
  isActive: boolean,
  isPassive: boolean,
  isBuff: boolean,
  job: string,
  type?: string,
}
export type SkillDB_V2 = {
  [key: string]: Skill
}
/***************/
/*** MOB DB  ***/
export type Mob = {
  id: number,
  mid: number,
  race: MobRace,
  race2: MobRace2,
  element: Element,
  elementLv: number,
  size: MobSize,
  lv: number,
  hp: number,
  def: number,
  mdef: number,
  minAtk: number,
  maxAtk: number,
  agi: number,
  vit: number,
  int: number,
  dex: number,
  luk: number,
  baseExp: number,
  jobExp: number,
  isRange: boolean,
  mode: {
    isBoss: boolean,
    isMvP: boolean,
    ignoreMeleeDamage: boolean,
    ignoreRangeDamage: boolean,
    ignoreMagicDamage: boolean,
    ignoreMiscDamage: boolean,
    hasStatusImmunity: boolean,
    hasSkillImmunity: boolean
  },
  region: string[]
}
export type MobDB_V2 = {
  [key: string]: Mob
}
/***********************/
/*** WAEPON-TYPE DB  ***/
export type WeaponTypeEntry = {
  id: number,
  sizeModifier: {
    [key in MobSize]: number
  },
  isTwoHanded: boolean,
  ammoType?: AmmoType
}
export type WeaponTypeDB_V2 = {
  [key in WeaponType]: WeaponTypeEntry
}
/*****************/
/*** AMMO DB  ***/
export type AmmoType = "arrow" | "bullet" | "grenade" | "shuriken" | "kunai";
export type Ammo = {
  attack: number,
  element: Element,
  bonus?: string
}
export type AmmoDB_V2 = {
  [key in AmmoType]: {
    [key: string]: Ammo
  }
}
/******************/
/*** ELEMENT DB ***/
export type ElementDB_V2 = {
  [key in Element]: {
    [key in Element]: number[]
  }
}

/********************/
/*** Session Info ***/
export type ActiveBonus = BaseStats & {
  allStats: number,
  hit: number,
  perfectHitRate: number,
  flee: number,
  crit: number,
  criticalAtkRate: number,
  perfectDodge: number,
  aspd: number,
  aspdRate: number,
  maxHp: number,
  maxSp: number,
  maxHpRate: number,
  maxSpRate: number,
  matk: number,
  matkRate: number,
  atk: number,
  atkRate: number,
  shortAtkRate: number,
  longAtkRate: number,
  longAtkDef: number,
  def: number,
  defRate: number,
  nearAtkDef: number,
  magicAtkDef: number,
  miscAtkDef: number,
  defRatioAtkClass: number,
  mdef: number,
  armorElement: number,
  weaponElement: number,
  ignoreDefClass: {
    [key in MobClass]: number
  },
  ignoreMdefClass: {
    [key in MobClass]: number
  },
  ignoreDefRace: {
    [key in MobRace]: number
  },
  ignoreMdefRace: {
    [key in MobRace]: number
  }
  ignoreDefElement: {
    [key in Element]: number
  },
  ignoreMdefElement: {
    [key in Element]: number
  },
  addClass: {
    [key in MobClass]: number
  },
  magicAddClass: {
    [key in MobClass]: number
  },
  expAddClass: {
    [key in MobClass]: number
  },
  subClass: {
    [key in MobClass]: number
  },
  addSize: {
    [key in MobSize]: number;
  },
  subSize: {
    [key in MobSize]: number;
  },
  addRace: {
    [key in MobRace]: number
  },
  magicAddRace: {
    [key in MobRace]: number
  },
  addRace2: {
    [key in MobRace2]: number
  },
  magicAddRace2: {
    [key in MobRace2]: number
  },
  subRace2: {
    [key in MobRace2]: number
  },
  criticalAddRace: {
    [key in MobRace]: number
  },
  criticalAtkRateRace: {
    [key in MobRace]: number
  },
  expAddRace: {
    [key in MobRace]: number
  },
  subRace: {
    [key in MobRace]: number
  },
  addElement: {
    [key in Element]: number
  },
  magicAddElement: {
    [key in Element]: number
  },
  magicElementRate: {
    [key in Element]: number
  },
  expAddElement: {
    [key in Element]: number
  },
  subElement: {
    [key in Element]: number
  },
  subDefElement: {
    [key in Element]: number
  },
  addEffect: {
    poison: number,
    stun: number,
    freeze: number,
    curse: number,
    blind: number,
    sleep: number,
    silence: number,
    confusion: number,
    bleeding: number,
    stone: number,
  },
  magicAddEffect: {
    poison: number,
    stun: number,
    freeze: number,
    curse: number,
    blind: number,
    sleep: number,
    silence: number,
    confusion: number,
    bleeding: number,
    stone: number,
  },
  addEffectWhenHit: {
    poison: number,
    stun: number,
    freeze: number,
    curse: number,
    blind: number,
    sleep: number,
    silence: number,
    confusion: number,
    bleeding: number,
    stone: number,
  },
  resEffect: {
    poison: number,
    stun: number,
    freeze: number,
    curse: number,
    blind: number,
    sleep: number,
    silence: number,
    confusion: number,
    bleeding: number,
    stone: number,
  },
  breakArmorRate: number,
  breakWeaponRate: number,
  reflectShortWeaponDamage: number,
  spCostReductionRate: number,
  hpDrainRate: {
    chance: number,
    value: number,
  },
  spDrainRate: {
    chance: number,
    value: number,
  },
  hpRecoveryRate: number,
  spRecoveryRate: number,
  castRate: number,
  castDelay: number,
  healPower: {
    all: number,
    heal: number,
    sanctuary: number,
    potionPitcher: number,
    slimPotionPitcher: number,
  },
  healPower2: {
    all: number,
    heal: number,
    sanctuary: number,
    potionPitcher: number,
    slimPotionPitcher: number,
  },
  addGlobalItemHealRate: number,
  addGlobalSpItemHealRate: number,
  addItemHealRate: {},
  addItemGlobalHealRate: {},
  allowsRefine: boolean,
  isUnbreakable: boolean,
  addMonster: {},
  addDefMonster: {},
  skillAtk: {},
  autospell: {},
  enableSkill: {},
  skillCastRate: {},
  skillCastDelay: {},
  scPdFood: number,
  scStrFood: number,
  scAgiFood: number,
  scVitFood: number,
  scIntFood: number,
  scDexFood: number,
  scLukFood: number,
  scHitFood: number,
  scIncCrit: number,
  scDefRate: number,
  scMdefRate: number,
  scCastRate: number,
  scFleeFood: number,
  scExpBoost: number,
  scJexpBoost: number,
  scAtkPotion: number,
  scMatkPotion: number,
  scAspdPotion: number,
  scIncAtkRate: number,
  scIncMatkRate: number,
  scIncAspdRate: number,
  scIncreaseAgi: number,
}
export type SessionEquipBase<T> = {
  [key in ItemLocations]: T
}
export type SessionEquip = SessionEquipBase<string> & {
  rightHandType: WeaponType,
  leftHandType: WeaponTypeLeft
}
export type SessionCard = Omit<SessionEquipBase<string>, "rightHand" | "leftHand" | "lowerHg"> & {
  rightHand: string[],
  leftHand: string[]
}
type SessionEntchant = Omit<SessionEquipBase<string[]>, "upperHg" | "lowerHg">

export type ActiveFood = {
  Stats: FoodStatsObj<string>,
  "New World": ObjWithKeyString<boolean>
  BG: ObjWithKeyString<boolean>,
  "Summer Cocktails": ObjWithKeyString<boolean>,
  Misc: ObjWithKeyString<boolean>,
  Resistance: ObjWithKeyString<boolean>,
  Eclage: ObjWithKeyString<boolean>,
  Eden: ObjWithKeyString<boolean>,
}

export enum SessionChangeEvent {
  INIT = 0,
  CLASS,
  LEVEL,
  BASE_STATS,
  REFINE,
  EQUIP,
  VANILLA_MODE,
  CARD
}

export type SessionInfoV2 = {
  changeEvent: SessionChangeEvent;
  /* levels */
  baseLevel: number;
  jobLevel: number;
  baseLevelMax: number;
  jobLevelMax: number;

  /* stats */
  baseStats: {
    [key in BaseStatsNames]: number
  };
  /* general */
  weaponAtk: number;
  ammoType?: AmmoType;
  vanillaMode: VanillaMode;
  /* active stuff */
  activeBonus: ActiveBonus;
  activeStatus: {
    Sprint: number,
    Eska: number,
    "Lex Aeterna": number
  };
  activeFood: ActiveFood;
  passiveSkill: {
    [key: string]: number
  },
  activeBuff: {
    isMaximizePowerActive: boolean,
    'Active Spheres': number;
    'Aura Blade': number;
    'Magnum Break': number;
    'Endless Deadly Poison': number;
    'True Sight': number;
    Deluge: number;
    Volcano: number;
    'Violent Gale': number;
  },
  /* gear stuff */
  equip: SessionEquip;
  refine: SessionEquipBase<number>;
  card: SessionCard;
  enchant: SessionEntchant;
}

/*******************/
/*** Battle Calc ***/
export type BattleCalcInfo = {
  id: number,
  target: string
}