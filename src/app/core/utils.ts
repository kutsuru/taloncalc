import { MobSize, Element } from "./models";

/*** map Mob Size (string) to number */
export const MOB_SIZE_MODIFIER: { [key in MobSize]: number } = {
    small: 0,
    medium: 1,
    large: 2
}

/*** map waepon element to Element (string) */
export const WEAPON_ELE: Element[] = ["neutral", "water", "earth", "fire", "wind", "poison", "holy", "shadow", "ghost", "undead"];