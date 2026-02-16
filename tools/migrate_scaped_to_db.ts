/*** imports ***/
import { readFile } from "node:fs/promises";
import { ItemData } from "./itemDBScraper";

/*** types ***/
type ItemDataFixed = Omit<
    ItemData,
    'jobRequirement' |
    'equippableJobs' |
    'vanilla'
> & {
    jobMask: string;
    isVanillaPvp: boolean,
    isVanillaPvm: boolean
}
type ItemLocations = "upperHg" | "middleHg" | "lowerHg" | "armor" | "rightHand" | "leftHand" | "garment" | "shoes" | "rhAccessory" | "lhAccessory";

/*** definitions ***/
const JOB_MASK = {
    'All Jobs': 0xffffffc,
    'Novice': 0x4,
    'Swordman': 0x200,
    'Mage': 0x1000,
    'Archer': 0x8000,
    'Merchant': 0x400000,
    'Thief': 0x2000000,
    'Knight': 0x400,
    'Wizard': 0x2000,
    'Blacksmith': 0x800000,
    'Hunter': 0x10000,
    'Assassin': 0x4000000,
    'Crusader': 0x800,
    'Monk': 0x200000,
    'Sage': 0x4000,
    'Rogue': 0x8000000,
    'Alchemist': 0x1000000,
    'Taekwon': 0x10,
    'Star Gladiator': 0x40,
    'Soul Linker': 0x20,
    'Gunslinger': 0x100,
    'Ninja': 0x80,
    'None': 0x0,
    'Bard': 0x20000,
    'Dancer': 0x40000,
    'Acolyte': 0x80000,
    'Priest': 0x100000,
    'All Jobs Except Novice': 0xffffff0
}
const JOB_TYPE_MASK = {
    'Normal': 0x1,
    'Transcendent': 0x2,
    'None': 0x0
}
const VAN_TYPES = {
    PVM_ONLY: "Can't be used in Vanilla PvP but can be used in Vanilla PvM or Events",
    NONE: "Can't be used in any Vanilla setting"
}
// const ITEM_LOCATION_MAP: { [key: string]: ItemLocations } = {
//     'None',
//     'Main Hand',
//     'Main Hand + Off Hand',
//     'Ammo',
//     'Off Hand',
//     'Middle Headgear',
//     'Upper Headgear',
//     'Lower Headgear',
//     'Upper Headgear + Middle Headgear',
//     'Lower Headgear + Upper Headgear + Middle Headgear',
//     'Lower Headgear + Middle Headgear',
//     'Armor',
//     'Footgear',
//     'Garment',
//     'Accessory Right + Accessory Left',
//     'Lower Headgear + Upper Headgear',
//     'Costume Top Headgear',
//     'Costume Low Headgear',
//     'Costume Mid Headgear',
//     'Costume Top Headgear + Costume Mid Headgear + Costume Low Headgear',
//     'Costume Mid Headgear + Costume Low Headgear',
//     'Costume Top Headgear + Costume Mid Headgear',
//     'Costume Garment',
//     'Shadow Armor',
//     'Shadow Accessory Right (Earring)'
// }

/*** functions ***/
async function loadItemDB() {
    const fileContent = await readFile('tools/item.db.json');
    const fileStr = fileContent.toString();
    const data: ItemData[] = JSON.parse(fileStr);
    return data;
}
/*** main ***/
async function main() {
    const itemDB = await loadItemDB();

    /* map jobs und types to one mask */
    const equipLoc = new Set<string>();
    const itemType = new Set<string>();
    for (const item of itemDB) {
        /*** job mask ***/
        // let jobTypes = item.jobRequirement.split('/');
        // let mask = 0;
        // for (const jobType of jobTypes) {
        //     let jobTypedFixed = jobType.trim();
        //     if (jobTypedFixed === 'None') {
        //         mask = 0;
        //         break;
        //     }
        //     if (jobTypedFixed in JOB_TYPE_MASK) {
        //         mask = mask | JOB_TYPE_MASK[jobTypedFixed as keyof typeof JOB_TYPE_MASK];
        //     }
        // }
        // if (mask > 0) {
        //     let jobs = item.equippableJobs.split('/');
        //     for (const job of jobs) {
        //         let jobFixed = job.trim();
        //         if (job === 'None') {
        //             mask = 0;
        //             break;
        //         }
        //         if (jobFixed in JOB_MASK) {
        //             mask = mask | JOB_MASK[jobFixed as keyof typeof JOB_MASK];
        //         }
        //     }
        // }

        /*** vanilla ***/
        // let vanPvp = true;
        // let vanPvm = true;
        // if (item.vanilla === VAN_TYPES.PVM_ONLY) {
        //     vanPvm = true;
        //     vanPvp = false;
        //     console.log(`${item.name} - PVP ${vanPvp} - PVM ${vanPvm}`);
        // }
        // else if (item.vanilla === VAN_TYPES.NONE) {
        //     vanPvp = false;
        //     vanPvm = false;
        //     console.log(`${item.name} - PVP ${vanPvp} - PVM ${vanPvm}`);
        // }

        /*** equip locations ***/
        equipLoc.add(item.equipLocations);
        itemType.add(item.type);

        /*** create new item ***/
        // const { jobRequirement, equippableJobs, vanilla, ...rest } = item;
        // let newItem: ItemDataFixed = {
        //     ...rest,
        //     jobMask: mask.toString(16),
        //     isVanillaPvm: vanPvm,
        //     isVanillaPvp: vanPvp
        // }
        // console.log(newItem);
    }
    console.log(equipLoc);
    console.log(itemType);
}
main();