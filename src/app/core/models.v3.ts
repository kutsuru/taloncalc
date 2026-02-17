/**********/
/* Global */
export type BaseStatsNames = "str" | "agi" | "vit" | "int" | "dex" | "luk";
export type BaseStatsAs<T> = { [key in BaseStatsNames]: T };

/*****************/
/* Item Database */
export type WeaponType = 'One-Handed Sword' | 'Two-Handed Sword' | 'Dagger' | 'Katar' | 'One-Handed Axe' | 'Two-Handed Axe' | 'One-Handed Spear' | 'Two-Handed Spear' | 'Two-handed staves' | 'Mace' | 'Book' | 'Staff' | 'Bow' | 'Knuckle' | 'Musical Instrument' | 'Whip' | 'Revolver' | 'Rifle' | 'Shotgun' | 'Gatling Gun' | 'Grenade Launcher' | 'Fuuma Shuriken';
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