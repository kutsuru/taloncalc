import { MobSize } from "./models";

/*** map Mob Size (string) to number */
export const MOB_SIZE_MODIFIER: {[key in MobSize]: number} = {
    small: 0,
    medium: 1,
    large: 2
}