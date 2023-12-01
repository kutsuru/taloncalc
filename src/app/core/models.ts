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
  weaponType: string,
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
export type Skill = {
  id: number,
  maxLevel: number,
  spCost: number[],
  element: string,
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
  ignoreOffensiveStatus : boolean,
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
    all: number,
    normal: number,
    boss: number,
    guardian: number,
  },
  ignoreMdefClass: {
    all: number,
    normal: number,
    boss: number,
    guardian: number,
  },
  ignoreDefRace: {
    formless: number,
    undead: number,
    brute: number,
    plant: number,
    insect: number,
    fish: number,
    demon: number,
    demiHuman: number,
    angel: number,
    dragon: number,
  },
  ignoreMdefRace: {
    formless: number,
    undead: number,
    brute: number,
    plant: number,
    insect: number,
    fish: number,
    demon: number,
    demiHuman: number,
    angel: number,
    dragon: number,
  },
  ignoreDefElement: {
    neutral: number,
    water: number,
    earth: number,
    fire: number,
    wind: number,
    poison: number,
    holy: number,
    shadow: number,
    ghost: number,
    undead: number,
  },
  ignoreMdefElement: {
    neutral: number,
    water: number,
    earth: number,
    fire: number,
    wind: number,
    poison: number,
    holy: number,
    shadow: number,
    ghost: number,
    undead: number,
  },
  addClass: {
    all: number,
    normal: number,
    boss: number,
    guardian: number,
  },
  magicAddClass: {
    all: number,
    normal: number,
    boss: number,
    guardian: number,
  },
  expAddClass: {
    all: number,
    normal: number,
    boss: number,
    guardian: number,
  },
  subClass: {
    all: number,
    normal: number,
    boss: number,
    guardian: number,
  },
  addSize: {
    small: number,
    medium: number,
    large: number,
  },
  subSize: {
    small: number,
    medium: number,
    large: number,
  },
  addRace: {
    formless: number,
    undead: number,
    brute: number,
    plant: number,
    insect: number,
    fish: number,
    demon: number,
    demiHuman: number,
    angel: number,
    dragon: number,
  },
  magicAddRace: {
    formless: number,
    undead: number,
    brute: number,
    plant: number,
    insect: number,
    fish: number,
    demon: number,
    demiHuman: number,
    angel: number,
    dragon: number,
  },
  addRace2: {
    goblin: number,
    golem: number,
    orc: number,
    kobold: number,
    manuk: number,
    splendide: number,
    biolab: number,
    kiel: number,
    juperos: number,
  },
  magicAddRace2: {
    goblin: number,
    golem: number,
    orc: number,
    kobold: number,
    manuk: number,
    splendide: number,
    biolab: number,
    kiel: number,
    juperos: number,
  },
  subRace2: {
    goblin: number,
    golem: number,
    orc: number,
    kobold: number,
    manuk: number,
    splendide: number,
    biolab: number,
    kiel: number,
    juperos: number,
  },
  criticalAddRace: {
    formless: number,
    undead: number,
    brute: number,
    plant: number,
    insect: number,
    fish: number,
    demon: number,
    demiHuman: number,
    angel: number,
    dragon: number,
  },
  criticalAtkRateRace: {
    formless: number,
    undead: number,
    brute: number,
    plant: number,
    insect: number,
    fish: number,
    demon: number,
    demiHuman: number,
    angel: number,
    dragon: number,
  },
  expAddRace: {
    formless: number,
    undead: number,
    brute: number,
    plant: number,
    insect: number,
    fish: number,
    demon: number,
    demiHuman: number,
    angel: number,
    dragon: number,
  },
  subRace: {
    formless: number,
    undead: number,
    brute: number,
    plant: number,
    insect: number,
    fish: number,
    demon: number,
    demiHuman: number,
    angel: number,
    dragon: number,
  },
  addElement: {
    neutral: number,
    water: number,
    earth: number,
    fire: number,
    wind: number,
    poison: number,
    holy: number,
    shadow: number,
    ghost: number,
    undead: number,
  },
  magicAddElement: {
    neutral: number,
    water: number,
    earth: number,
    fire: number,
    wind: number,
    poison: number,
    holy: number,
    shadow: number,
    ghost: number,
    undead: number,
  },
  magicElementRate: {
    neutral: number,
    water: number,
    earth: number,
    fire: number,
    wind: number,
    poison: number,
    holy: number,
    shadow: number,
    ghost: number,
    undead: number,
  },
  expAddElement: {
    neutral: number,
    water: number,
    earth: number,
    fire: number,
    wind: number,
    poison: number,
    holy: number,
    shadow: number,
    ghost: number,
    undead: number,
  },
  subElement: {
    neutral: number,
    water: number,
    earth: number,
    fire: number,
    wind: number,
    poison: number,
    holy: number,
    shadow: number,
    ghost: number,
    undead: number,
  },
  subDefElement: {
    neutral: number,
    water: number,
    earth: number,
    fire: number,
    wind: number,
    poison: number,
    holy: number,
    shadow: number,
    ghost: number,
    undead: number,
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
  VANILLA_MODE
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
  ammoType: string;
  vanillaMode: VanillaMode;
  /* active stuff */
  activeBonus: ActiveBonus;
  activeStatus: {
    Sprint: number
  };
  activeFood: ActiveFood;
  /* gear stuff */
  equip: SessionEquip;
  refine: SessionEquipBase<number>;
  card: SessionCard;
  enchant: SessionEntchant;
}