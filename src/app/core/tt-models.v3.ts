/**********/
import { JobKey, WeaponType, ItemType, StatusEffect } from "./rAthena/ra-models";
import { DefaultMap } from "./utils";

/* Global */
export type BaseStatsNames = "str" | "agi" | "vit" | "int" | "dex" | "luk";
export type BaseStatsAs<T> = { [key in BaseStatsNames]: T };
export type ItemLocations = "upperHg" | "middleHg" | "lowerHg" | "armor" | "rightHand" | "leftHand" | "garment" | "shoes" | "rhAccessory" | "lhAccessory";
export type RefineLocations = Exclude<ItemLocations, 'middleHg' | 'lowerHg' | 'rhAccessory' | 'lhAccessory'>;
export type CardLocations = Exclude<ItemLocations, 'lowerHg'>;
export type CardTypes = 'Headgear' | 'Armor' | 'Weapon' | 'Shield' | 'Garment' | 'Shoes' | 'Accessory';
export type DBMobRace = "formless" | "undead" | "brute" | "plant" | "insect" | "fish" | "demon" | "demiHuman" | "angel" | "dragon" | "player" | "all"; //FIXME: player okay?
export type DBMobRace2 = "goblin" | "golem" | "orc" | "kobold" | "manuk" | "splendide" | "biolab" | "kiel" | "juperos" | "guardian" | "emperium" | "ninja" | "faceworm" | "robot" | "snake" | "unknown";
export type DBElement = "neutral" | "water" | "earth" | "fire" | "wind" | "poison" | "holy" | "shadow" | "ghost" | "undead" | "all";
export type DBMobSize = "small" | "medium" | "large" | "all";
export type DBMobClass = "normal" | "boss" | "guardian" | "all";
export type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T
}

/*****************/
/* Item Database */
export const DBWeaponType = {
  'Unarmed': -1,
  'One-Handed Sword': WeaponType.W_1HSWORD,
  'Two-Handed Sword': WeaponType.W_2HSWORD,
  'Dagger': WeaponType.W_DAGGER,
  'Katar': WeaponType.W_KATAR,
  'One-Handed Axe': WeaponType.W_1HAXE,
  'Two-Handed Axe': WeaponType.W_2HAXE,
  'One-Handed Spear': WeaponType.W_1HSPEAR,
  'Two-Handed Spear': WeaponType.W_2HSPEAR,
  'Two-handed staves': WeaponType.W_2HSTAFF,
  'Mace': WeaponType.W_MACE,
  'Book': WeaponType.W_BOOK,
  'Staff': WeaponType.W_STAFF,
  'Bow': WeaponType.W_BOW,
  'Knuckle': WeaponType.W_KNUCKLE,
  'Musical Instrument': WeaponType.W_MUSICAL,
  'Whip': WeaponType.W_WHIP,
  'Revolver': WeaponType.W_REVOLVER,
  'Rifle': WeaponType.W_RIFLE,
  'Shotgun': WeaponType.W_SHOTGUN,
  'Gatling Gun': WeaponType.W_GATLING,
  'Grenade Launcher': WeaponType.W_GRENADE,
  'Fuuma Shuriken': WeaponType.W_HUUMA
} as const;
export type DBWeaponTypeKey = keyof typeof DBWeaponType;
export type DBWeaponTypeValue = typeof DBWeaponType[DBWeaponTypeKey];
export type DBWeaponTypeLeft = DBWeaponTypeKey | 'Shield';

export const DBItemType = {
  'Healing': ItemType.IT_HEALING,
  'Delay Consume': ItemType.IT_RESTRICTEDCONSUME,
  'Usable': ItemType.IT_USABLE,
  'Etc': ItemType.IT_ETC,
  'Weapon One-Hand': ItemType.IT_WEAPON,
  'Weapon Two-Hand': ItemType.IT_WEAPON,
  'Ammo': ItemType.IT_AMMO,
  'Armor': ItemType.IT_ARMOR,
  'Card': ItemType.IT_CARD,
  'Item Container': ItemType.IT_USABLE,
  'Pet Egg': ItemType.IT_PETEGG,
  'Pet Armor': ItemType.IT_PETARMOR,
  'Shadow Equipment': ItemType.IT_SHADOWGEAR
}
export type DBItemTypeKey = keyof typeof DBItemType;

export type ItemSubType =
  | 'None'
  | DBWeaponTypeKey
  | 'Arrow' | 'Throwing Dagger' | 'Bullet' | 'Grenade' | 'Shuriken' | 'Kunai' | 'Throwable Item (Sling Item)' | 'Cannonballs'
  | CardTypes
  | 'Costume';
export type EquipLocation = 'None' | 'HeadgearUpper' | 'HeadgearMiddle' | 'HeadgearLower' | 'Armor' | 'Shield' | 'Garment' | 'Shoes' | 'Accessory' | 'Weapon' | 'Unknown';
export type DBSQIBonus = {
  description: string;
  bonus: string
}
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
  type: DBItemTypeKey,
  subType: ItemSubType,
  location: EquipLocation,
  disabled?: boolean,
  enchant?: DBEnchantTypes[],
  sqiBonus?: Record<string, DBSQIBonus>
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
  compatibleWeapons: DBWeaponTypeKey[],
  hpTable: number[],
  spTable: number[],
  baseAspd: {
    [key: string]: number
  },
  jobBonus: {
    [key in BaseStatsNames]: number[]
  },
  class: JobKey,
  baseClass: JobKey,
  baseJob: JobKey
}

/***************/
/*** Session ***/
export type EquipItemFilter =
  | { type: 'equip', location: EquipLocation }
  | { type: 'weapon', weaponType: DBWeaponTypeKey }
  | { type: 'none' }
export type EquipSlotMeta = {
  label: string;
  canRefine: boolean;
  defaultFilter: EquipItemFilter
}
export const EQUIP_META: Record<ItemLocations, EquipSlotMeta> = {
  upperHg: { label: 'Upper Headgear', canRefine: true, defaultFilter: { type: 'equip', location: 'HeadgearUpper' } },
  middleHg: { label: 'Middle Headgear', canRefine: false, defaultFilter: { type: 'equip', location: 'HeadgearMiddle' } },
  lowerHg: { label: 'Lower Headgear', canRefine: false, defaultFilter: { type: 'equip', location: 'HeadgearLower' } },
  armor: { label: 'Armor', canRefine: true, defaultFilter: { type: 'equip', location: 'Armor' } },
  rightHand: { label: 'Main-Hand', canRefine: true, defaultFilter: { type: 'none' } },
  leftHand: { label: 'Off-Hand', canRefine: true, defaultFilter: { type: 'equip', location: 'Shield' } },
  garment: { label: 'Garment', canRefine: true, defaultFilter: { type: 'equip', location: 'Garment' } },
  shoes: { label: 'Shoes', canRefine: true, defaultFilter: { type: 'equip', location: 'Shoes' } },
  rhAccessory: { label: 'Accessory (R)', canRefine: false, defaultFilter: { type: 'equip', location: 'Accessory' } },
  lhAccessory: { label: 'Accessory (L)', canRefine: false, defaultFilter: { type: 'equip', location: 'Accessory' } }
}
export type EquipSlotState = {
  item: number;
  refine: number;
  cards: number[];
  enchants: number[]  // FIXME
}
export type EquipState = Record<ItemLocations, EquipSlotState>;
export const SESSION_BONUS_FLAGS = new Set([
  // normale flags
  'noCastCancel', 'noCastCancel2', 'noSizeFix',
  'unstripableWeapon', 'unstripableArmor', 'unstripableHelm', 'unstripableShield', 'unstripable',
  'unbreakableWeapon', 'unbreakableArmor', 'unbreakableHelm',
  'unbreakableShield', 'unbreakableGarment', 'unbreakableShoes',
  'noKnockback', 'noGemStone', 'intravision', 'perfectHide', 'noWalkDelay',
  'noTripleDelay',
  // custom flags 
  'noRegenHP', 'noRegenSP', // bonus bNoRegen,x;       		Stops HP or SP regeneration (x: 1=HP, 2=SP)
] as const);
export type SessionBonusFlag = typeof SESSION_BONUS_FLAGS extends Set<infer T> ? T : never;
export type SessionBonus = {
  /* numiercs sums or highest only */
  stats: {
    // base stats
    str: number; agi: number; vit: number; int: number; dex: number; luk: number;

    // Hp / Sp
    maxHP: number; maxSP: number;
    maxHPRate: number; maxSPRate: number;
    hpRegenRate: number; spRegenRate: number;
    hpRecovRate: number; spRecovRate: number;
    hpGainValue: number; spGainValue: number;
    hpLossRate: number; spLossRate: number;

    // physical offensive
    atk: number; atk2: number; atkRate: number; baseAtk: number;
    hit: number; hitRate: number;
    critical: number; critAtkRate: number; criticalLong: number;
    aspd: number; aspdRate: number;
    longAtkRate: number; shortAtkRate: number;
    atkEle: DBElement;  // FIXME: in case of neutral maybe ignore?
    atkRange: number; splashRange: number;
    doubleRate: number; doubleAddRate: number; tripleAddRate: number;
    perfectHitRate: number; perfectHit: number;

    // magic offensive
    matk: number; matk2: number; matkRate: number;
    minMatk: number;
    variableCastrate: number; fixedCastrate: number;
    castrate: number; delayRate: number;
    healPower: number; healPower2: number;

    // def and resistance
    def: number; def2: number; defRate: number; def2Rate: number;
    mdef: number; mdef2: number; mdefRate: number;
    defEle: DBElement;   // FIXME: use in battle calc
    flee: number; flee2: number; fleeRate: number;
    nearAtkDef: number; longAtkDef: number; res: number; mres: number;
    magicAtkDef: number; miscAtkDef: number; skillLongAtkDef: number;
    reduceMagicReturn: number; reduceMeleeReturn: number;
    noWeaponDamage: number; noMagicDamage: number;

    // Utility & Spezial
    speedRate: number;
    hpDrainRate: number; spDrainRate: number;
    hpDrainValue: number; spDrainValue: number;
    magicSPGainValue: number; magicHPGainValue: number;
    shortWeaponDamageReturn: number; longWeaponDamageReturn: number;
    magicDamageReturn: number; scIncAtkRate: number;
    breakWeaponRate: number; breakArmorRate: number;
    freeCastMoveRate: number; addItemHealRate: number;
    useSPrate: number; scAtkPotion: number; scMatkPotion: number;
    scIncCrit: number; scCastRate: number;
    doubleAttackRate: number;
  };

  /* Mappings for bonus2 und bonus3 */
  addRace: DefaultMap<DBMobRace, number>;
  addRace2: DefaultMap<DBMobRace2, number>;
  addEle: DefaultMap<DBElement, number>;
  addSize: DefaultMap<DBMobSize, number>;
  addClass: DefaultMap<DBMobClass, number>;
  criticalAddRace: DefaultMap<DBMobRace, number>;
  criticalAddEle: DefaultMap<DBElement, number>;
  addDamageClass: DefaultMap<string, number>;

  magicAddRace: DefaultMap<DBMobRace, number>;
  magicAddRace2: DefaultMap<DBMobRace2, number>,
  magicAddEle: DefaultMap<DBElement, number>;
  magicAddSize: DefaultMap<DBMobSize, number>;
  magicAddClass: DefaultMap<DBMobClass, number>;
  magicAtkEle: DefaultMap<DBElement, number>;

  addMagicDamageClass: DefaultMap<string, number>;  // mobID
  addDefMonster: DefaultMap<string, number>;  // mobID

  subRace: DefaultMap<DBMobRace, number>;
  subRace2: DefaultMap<DBMobRace2, number>;
  subEle: DefaultMap<DBElement, number>;
  subSize: DefaultMap<DBMobSize, number>;
  subClass: DefaultMap<DBMobClass, number>;
  // subSkill: DefaultMap<string, number>;

  ignoreDefRace: DefaultMap<DBMobRace, boolean>;
  ignoreDefRaceRate: DefaultMap<DBMobRace, number>;
  ignoreDefClass: DefaultMap<DBMobClass, boolean>;
  ignoreMdefRace: Record<string | number, number>;
  ignoreMdefRaceRate: DefaultMap<DBMobRace, number>;
  ignoreMdefClass: Record<string | number, number>;
  ignoreMdefClassRate: DefaultMap<DBMobClass, number>;
  ignoreMdefRace2Rate: DefaultMap<DBMobRace2, number>;
  ignoreMdefEleRate: DefaultMap<DBElement, number>;

  skillAtk: DefaultMap<string, number>;
  skillUseSP: DefaultMap<string, number>; // skill enum
  skillCooldown: Record<string | number, number>;
  skillFixedCast: Record<string | number, number>;
  skillVariableCast: Record<string | number, number>;
  skillCritAtkRate: DefaultMap<string, number>;
  skillDelayrate: DefaultMap<string, number>; // skill enum
  castrate: DefaultMap<string, number>; // skill enum

  resEff: DefaultMap<StatusEffect, number>;
  skillHeal: DefaultMap<string, number>; // skill enum
  skillHeal2: DefaultMap<string, number>; // skill enum
  expAddRace: DefaultMap<DBMobRace, number>;
  expAddClass: DefaultMap<DBMobClass, number>;
  kickAddRate: DefaultMap<string, number>;  // skill enum
  addItemSPHealRate: DefaultMap<string, number>; //item ID
  skillDefRatioAtkClass: DefaultMap<string, DBMobClass>; // skill enum FIXME: special talon bonus
  skillWeaponElement: DefaultMap<string, DBElement>;  // skill enum FIXME: special talon bonus
  
  /* flags */
  flags: DefaultMap<SessionBonusFlag, boolean>
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
  race: DBMobRace,
  race2: DBMobRace2,
  element: DBElement,
  elementLv: number,
  size: DBMobSize,
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
export type SkillElement = DBElement | "weapon";
export type SkillSubType = 'check' | 'list';
export type DBSkill = {
  name: string,
  id: number,
  enum: string,
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
  [key in DBElement]: {
    [key in DBElement]: number[]
  }
}

/***********************/
/*** WAEPON-TYPE DB  ***/
export type DBWeaponTypeEntry = {
  id: number,
  sizeModifier: {
    [key in DBMobSize]: number
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
  element: DBElement,
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
/****************/
/*** ENCHANTS ***/
export type DBEnchantTypes = "kris" | "hidden" | "malangdo" | "malangdo_staff" | "malangdo_nerf" | "biolab_weapon" | "biolab_armor" | "eden_hat" | "eden_armor_1st" | "eden_armor_2nd" | "eden_weapon_1st" | "eden_weapon_2nd" | "eden_weapon_3rd" | "el_discastel_1st" | "el_discastel_2nd" | "el_discastel_3rd" | "el_discastel_light_2rd_3rd" | "mora_1st" | "mora_2nd" | "mora_3rd";
export type EnchantDBV3 = {
  [key in DBEnchantTypes]: {
    [key: string]: number
  }
}
export type DBEnchant = {
  name: string,
  itemId: number
}

/***********/
/*** SQI ***/
export const CLASS_SPECIFIC_SQI = {
  "Novice": 1190,
  "Knight": 1430,
  "Priest": 1549,
  "Wizard": 1650,
  "Blacksmith": 1530,
  "Hunter": 1745,
  "Assassin": 1290,
  "Crusader": 2150,
  "Monk": 1840,
  "Sage": 1590,
  "Rogue": 1746,
  "Alchemist": 1320,
  "Bard": 1913,
  "Dancer": 1990,
  "Supernovice": 1190,
  "Gunslinger": 5600,
  "Ninja": 13320,
  "Novice High": 1190,
  "Lord Knight": 1430,
  "High Priest": 1549,
  "High Wizard": 1650,
  "Whitesmith": 1530,
  "Sniper": 1745,
  "Assassin Cross": 1290,
  "Paladin": 2150,
  "Champion": 1840,
  "Professor": 1590,
  "Stalker": 1746,
  "Creator": 1320,
  "Clown": 1913,
  "Gypsy": 1990,
  "Taekwon": 2480,
  "Star Gladiator": 2480,
  "Soul Linker": 1651
} as const;
export type ClassWithSQI = keyof typeof CLASS_SPECIFIC_SQI;