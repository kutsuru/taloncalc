/**********/
/* Global */
export type BaseStatsNames = "str" | "agi" | "vit" | "int" | "dex" | "luk";
export type BaseStatsAs<T> = { [key in BaseStatsNames]: T };
export type ItemLocations = "upperHg" | "middleHg" | "lowerHg" | "armor" | "rightHand" | "leftHand" | "garment" | "shoes" | "rhAccessory" | "lhAccessory";
export type RefineLocations = Exclude<ItemLocations, 'middleHg' | 'lowerHg' | 'rhAccessory' | 'lhAccessory'>;
export type CardLocations = Exclude<ItemLocations,'lowerHg'>;
export type MobRace = "formless" | "undead" | "brute" | "plant" | "insect" | "fish" | "demon" | "demiHuman" | "angel" | "dragon";
export type MobRace2 = "goblin" | "golem" | "orc" | "kobold" | "manuk" | "splendide" | "biolab" | "kiel" | "juperos";
export type Element = "neutral" | "water" | "earth" | "fire" | "wind" | "poison" | "holy" | "shadow" | "ghost" | "undead";
export type MobSize = "small" | "medium" | "large";

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
  compatibleWeapons: WeaponType[],  // TODO: job.db.json types mapping
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
    castrate: number; delayrate: number;
    healPower: number; healPower2: number;

    // def and resistance
    def: number; def2: number; defRate: number;
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

  /* TODO: Mappings for bonus2 und bonus3 (Ziel-ID -> Wert) */
  addRace: Record<string | number, number>;
  addEle: Record<string | number, number>;
  addSize: Record<string | number, number>;
  addClass: Record<string | number, number>;
  addRace2: Record<string | number, number>;

  magicAddRace: Record<string | number, number>;
  magicAddEle: Record<string | number, number>;
  magicAddSize: Record<string | number, number>;
  magicAddClass: Record<string | number, number>;

  subRace: Record<string | number, number>;
  subEle: Record<string | number, number>;
  subSize: Record<string | number, number>;
  subClass: Record<string | number, number>;
  subRace2: Record<string | number, number>;

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
export type DBSkill = {
  name: string,
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

/******************/
/*** ELEMENT DB ***/
export type ElementDBV3 = {
  [key in Element]: {
    [key in Element]: number[]
  }
}