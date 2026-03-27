/*** imports ***/
import { ItemType, ItemTypeKey, Job, JobKey, WeaponType, WeaponTypeKey } from "./ra-models";

/***********/
/*** JOB ***/
export function getJobValue(key: string): number | undefined {
    if (key in Job) return Job[key as JobKey];
    return undefined;
}

export const JobByValue = Object.fromEntries(
    Object.entries(Job).map(([k, v]) => [v, k])
) as Record<number, JobKey>;

/*************/
/*** EQUIP ***/
export function getWeaponTypeValue(key: string): number {
    if (key in WeaponType) return WeaponType[key as WeaponTypeKey];
    return -1;
}
export function getItemTypeValue(key: string): number {
    if (key in ItemType) return ItemType[key as ItemTypeKey];
    return -1;
}