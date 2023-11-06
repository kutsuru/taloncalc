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

/***************/
/*** JOB DB  ***/
export interface JobDbEntry {
  isTrans: boolean,
  maxJobLv: number,
  mask: string,
  compatibleWeapons: string[],
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
export type SessionInfoV2 = {
  /* levels */
  baseLevel: number,
  jobLevel: number,
  baseLevelMax: number;
  jobLevelMax: number;
  /* stats */
  baseStats: {
    [key in BaseStatsNames]: number
  };
  maxHp: number;
  maxSp: number;
  hit: number;
  flee: number;
  perfectDodge: number;
  crit: number;
  aspd: number;
  atk: number;
  minMatk: number;
  maxMatk: number;
  /* active stuff */
  activeBonus: ActiveBonus;
  activeStatus: {
    Sprint: number
  }
}