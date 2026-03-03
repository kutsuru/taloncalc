/**********/

import { DefaultMap } from "./utils";

/* Global */
export type BaseStatsNames = "str" | "agi" | "vit" | "int" | "dex" | "luk";
export type BaseStatsAs<T> = { [key in BaseStatsNames]: T };
export type ItemLocations = "upperHg" | "middleHg" | "lowerHg" | "armor" | "rightHand" | "leftHand" | "garment" | "shoes" | "rhAccessory" | "lhAccessory";
export type RefineLocations = Exclude<ItemLocations, 'middleHg' | 'lowerHg' | 'rhAccessory' | 'lhAccessory'>;
export type CardLocations = Exclude<ItemLocations, 'lowerHg'>;
export type MobRace = "formless" | "undead" | "brute" | "plant" | "insect" | "fish" | "demon" | "demiHuman" | "angel" | "dragon" | "player" | "all"; //FIXME: player okay?
export type MobRace2 = "goblin" | "golem" | "orc" | "kobold" | "manuk" | "splendide" | "biolab" | "kiel" | "juperos";
export type Element = "neutral" | "water" | "earth" | "fire" | "wind" | "poison" | "holy" | "shadow" | "ghost" | "undead" | "all";
export type MobSize = "small" | "medium" | "large" | "all";
export type MobClass = "normal" | "boss" | "guardian" | "all";
export type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T
}

/*****************/
/* Item Database */
export type WeaponType = 'Unarmed' | 'One-Handed Sword' | 'Two-Handed Sword' | 'Dagger' | 'Katar' | 'One-Handed Axe' | 'Two-Handed Axe' | 'One-Handed Spear' | 'Two-Handed Spear' | 'Two-handed staves' | 'Mace' | 'Book' | 'Staff' | 'Bow' | 'Knuckle' | 'Musical Instrument' | 'Whip' | 'Revolver' | 'Rifle' | 'Shotgun' | 'Gatling Gun' | 'Grenade Launcher' | 'Fuuma Shuriken';
export type WeaponTypeLeft = WeaponType | 'Shield';
export type ItemType =
  'Healing' |
  'Delay Consume' |
  'Usable' |
  'Etc' |
  'Weapon One-Hand' |
  'Weapon Two-Hand' |
  'Ammo' |
  'Armor' |
  'Card' |
  'Item Container' |
  'Pet Egg' |
  'Pet Armor' |
  'Shadow Equipment';

export type ItemSubType = 'None' |
  WeaponType |
  'Arrow' | 'Throwing Dagger' | 'Bullet' | 'Grenade' | 'Shuriken' | 'Kunai' | 'Throwable Item (Sling Item)' | 'Cannonballs' |
  'Headgear' | 'Armor' | 'Weapon' | 'Shield' | 'Garment' | 'Shoes' | 'Accessory' |
  'Costume';
export type EquipLocation = 'None' | 'HeadgearUpper' | 'HeadgearMiddle' | 'HeadgearLower' | 'Armor' | 'Shield' | 'Garment' | 'Shoes' | 'Accessory' | 'Weapon' | 'Unknown';
export type DBItem = {
  ID: number;
  talonShop: number;
  name: string;
  weight: number;
  npcBuy: number;
  npcSell: number;
  weaponLevel: number;
  range: number;
  defense: number;
  slots: number;
  refineable: boolean;
  attack: number;
  requiredLv: number;
  description: string;
  itemScript: string;
  jobMask: string;
  isVanillaPvp: boolean,
  isVanillaPvm: boolean,
  type: ItemType,
  subType: ItemSubType,
  location: EquipLocation
}
export type DBItemCombo = {
  items: number[];
  effect: string;
}

/***************/
/*** JOB DB  ***/
export type DBJob = {
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

/***************/
/*** Session ***/
export type SessionEquipBase<T> = {
  [key in ItemLocations]: T
}
export type SessionEquip = SessionEquipBase<number> & {
  rightHandType: 'Unarmed' | WeaponType,
  leftHandType: 'Unarmed' | WeaponTypeLeft
}
export type SessionBonus = {
  /* numiercs sums or highest only */
  stats: {
    // base stats
    str: number; agi: number; vit: number; int: number; dex: number; luk: number;

    // Hp / Sp
    maxHP: number; maxSP: number;
    maxHPRate: number; maxSPRate: number;
    hpRegenRate: number; spRegenRate: number;
    hpRecoveryRate: number; spRecoveryRate: number;

    // physical offensive
    atk: number; atk2: number; atkRate: number; baseAtk: number;
    hit: number; hitRate: number;
    critical: number; critRate: number;
    aspd: number; aspdRate: number;
    longAtkRate: number; critAtkRate: number;
    atkEle: number; atkRange: number; splashRange: number;
    doubleRate: number; doubleAddRate: number;
    perfectHitRate: number; perfectHit: number;

    // magic offensive
    matk: number; matk2: number; matkRate: number;
    variableCastrate: number; fixedCastrate: number;
    castrate: number; delayRate: number;
    healPower: number; healPower2: number;

    // def and resistance
    def: number; def2: number; defRate: number; def2Rate: number;
    mdef: number; mdef2: number; mdefRate: number;
    defEle: number; flee: number; flee2: number; fleeRate: number;
    longAtkDef: number; res: number; mres: number;

    // Utility & Spezial
    speed: number;
    hDrainRate: number; sDrainRate: number;
    hDrainValue: number; sDrainValue: number;
    shortWeaponDamageReturn: number; longWeaponDamageReturn: number;
    magicDamageReturn: number;
    scIncAtkRate: number;
  };

  /* FIXME: Mappings for bonus2 und bonus3 (Ziel-ID -> Wert) */
  addRace: DefaultMap<MobRace, number>;
  addRace2: DefaultMap<MobRace2, number>;
  addEle: DefaultMap<Element, number>;
  addSize: DefaultMap<MobSize, number>;
  addClass: DefaultMap<MobClass, number>;

  magicAddRace: DefaultMap<MobRace, number>;
  magicAddRace2: DefaultMap<MobRace2, number>,
  magicAddEle: DefaultMap<Element, number>;
  magicAddSize: DefaultMap<MobSize, number>;
  magicAddClass: DefaultMap<MobClass, number>;
  magicAtkEle: DefaultMap<Element, number>;

  subRace: DefaultMap<MobRace, number>;
  subRace2: DefaultMap<MobRace2, number>;
  subEle: DefaultMap<Element, number>;
  subSize: DefaultMap<MobSize, number>;
  subClass: DefaultMap<MobClass, number>;

  ignoreDefRace: Record<string | number, number>;
  ignoreDefClass: Record<string | number, number>;
  ignoreMdefRace: Record<string | number, number>;
  ignoreMdefClass: Record<string | number, number>;

  skillAtk: Record<string | number, number>;
  skillUseSP: Record<string | number, number>;
  skillCooldown: Record<string | number, number>;
  skillFixedCast: Record<string | number, number>;
  skillVariableCast: Record<string | number, number>;

  /* flags */
  // TOOD: predefine / fill?
  flags: Record<string, boolean>;
};

/*******************/
/*** Battle calc ***/
export type BattleCalcEntry = {
  ID: number;
  target: number; // monster ID
}

/**************/
/*** Mob DB ***/
export type DBMob = {
  id: number,
  name: string,
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

/*****************/
/*** SKILL DB  ***/
export type SkillElement = Element | "weapon";
export type SkillSubType = 'check' | 'list';
export type DBSkill = {
  name: string,
  id: number,
  maxLevel: number,
  spCost: number[],
  element: SkillElement,  // FIXME: in DB File the elements are numbers instead of strings
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
  type?: SkillSubType,
  itemScript?: string,
}
export type SkillBuff = Pick<DBSkill, 'id' | 'name' | 'maxLevel' | 'itemScript'> & {
  value: number | boolean
  type: SkillSubType
}

/******************/
/*** ELEMENT DB ***/
export type ElementDBV3 = {
  [key in Element]: {
    [key in Element]: number[]
  }
}

/***********************/
/*** WAEPON-TYPE DB  ***/
export type DBWeaponType = {
  id: number,
  sizeModifier: {
    [key in MobSize]: number
  },
  isTwoHanded: boolean,
  ammoType?: AmmoType
}

/*****************/
/*** AMMO DB  ***/
export type AmmoType = "arrow" | "bullet" | "grenade" | "shuriken" | "kunai";
export type DBAmmo = {
  type: AmmoType,
  attack: number,
  element: Element,
  bonus?: string
}

/****************/
/*** FOOD DB  ***/
export type FoodCategory = 'Stats' | 'New World' | 'BG' | 'Summer Cocktails' | 'Misc' | 'Resistance' | 'Eclage' | 'Eden' | 'Aspd Potion';
export type FoodStatsNames = "STR" | "AGI" | "VIT" | "INT" | "DEX" | "LUK";
export type DBFood = {
  ID: number,
  name: string,
  duration: number,
  dispelOnDeath: boolean,
  bonus: string,
  category: FoodCategory,
  subCategory?: FoodStatsNames,
  description?: string,
  itemName?: string,
}
export type JSONFood = {
  gid: number,
  duration: number,
  dispelOnDeath: boolean,
  bonus: string,
  name?: string,
  description?: string
}