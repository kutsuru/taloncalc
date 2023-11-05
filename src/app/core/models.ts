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
export type BaseStats = "str" | "agi" | "vit" | "int" | "dex" | "luk";

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
    [key in BaseStats]: number[]
  }
}
export type JobDB_V2 = {
  [key: string]: JobDbEntry
}

/********************/
/*** Session Info ***/
export type SessionInfoV2 = {
  /* levels */
  baseLevel: number,
  jobLevel: number,
  baseLevelMax: number;
  jobLevelMax: number;
  /* stats */
  baseStats: {
    [key in BaseStats]: number
  };
  totalStats: {
    [key in BaseStats]: number
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
  /* active bonuses */
  activeBonus: {
    stats: {
      [key in BaseStats]: number
    }
  };
}