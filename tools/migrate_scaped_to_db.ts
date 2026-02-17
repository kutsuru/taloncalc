/*** imports ***/
import { readFile, writeFile } from "node:fs/promises";
import { ItemData } from "./itemDBScraper";

/*** types ***/
type ItemDataFixed = Omit<
    ItemData,
    'jobRequirement' |
    'equippableJobs' |
    'vanilla' |
    'type' |
    'equipLocations'
> & {
    jobMask: string;
    isVanillaPvp: boolean,
    isVanillaPvm: boolean,
    type: ItemType,
    subType: ItemSubType,
    location: EquipLocation
}

/*
'Healing',
  'Delay Consume',
  'Usable',
  'Etc',
  'Weapon - One-Handed Sword',
  'Weapon - Two-Handed Sword',
  'Weapon - Dagger',
  'Weapon - Katar',
  'Weapon - One-Handed Axe',
  'Weapon - Two-Handed Axe',
  'Weapon - One-Handed Spear',
  'Weapon - Two-Handed Spear',
  'Weapon - Two-handed staves',
  'Weapon - Mace',
  'Weapon - Book',
  'Weapon - Staff',
  'Weapon - Bow',
  'Ammo - Arrow',
  'Ammo - Throwing Dagger',
  'Weapon - Knuckle',
  'Weapon - Musical Instrument',
  'Weapon - Whip',
  'Armor',
  'Card',
  'Item Container',
  'Weapon',
  'Pet Egg',
  'Pet Armor',
  'Weapon - Revolver',
  'Weapon - Rifle',
  'Weapon - Shotgun',
  'Weapon - Gatling Gun',
  'Weapon - Grenade Launcher',
  'Ammo - Bullet',
  'Ammo - Grenade',
  'Ammo - Shuriken',
  'Ammo - Kunai',
  'Ammo - Throwable Item (Sling Item)',
  'Weapon - Fuuma Shuriken',
  'Ammo - Cannonballs',
  'Shadow Equipment'
  */
type ItemType =
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

type ItemSubType = 'None' |
    'One-Handed Sword' | 'Two-Handed Sword' | 'Dagger' | 'Katar' | 'One-Handed Axe' | 'Two-Handed Axe' | 'One-Handed Spear' | 'Two-Handed Spear' | 'Two-handed staves' | 'Mace' | 'Book' | 'Staff' | 'Bow' | 'Knuckle' | 'Musical Instrument' | 'Whip' | 'Revolver' | 'Rifle' | 'Shotgun' | 'Gatling Gun' | 'Grenade Launcher' | 'Fuuma Shuriken' |
    'Arrow' | 'Throwing Dagger' | 'Bullet' | 'Grenade' | 'Shuriken' | 'Kunai' | 'Throwable Item (Sling Item)' | 'Cannonballs' |
    'Headgear' | 'Armor' | 'Weapon' | 'Shield' | 'Garment' | 'Shoes' | 'Accessory' |
    'Costume';
type EquipLocation = 'None' | 'HeadgearUpper' | 'HeadgearMiddle' | 'HeadgearLower' | 'Armor' | 'Shield' | 'Garment' | 'Shoes' | 'Accessory' | 'Weapon' | 'Unknown';

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

/*** functions ***/
async function loadItemDB() {
    const fileContent = await readFile('tools/item.db.json');
    const fileStr = fileContent.toString();
    const data: ItemData[] = JSON.parse(fileStr);
    return data;
}
function determineTypes(item: ItemData): {
    type: ItemType,
    subType: ItemSubType,
    location: EquipLocation
} {
    let itemType: ItemType = 'Etc';
    let itemSubType: ItemSubType = 'None';
    let location: EquipLocation = 'None';

    switch (item.type) {
        case 'Healing':
            itemType = 'Healing';
            itemSubType = 'None';
            location = 'None';
            break;
        case 'Delay Consume':
            itemType = 'Delay Consume';
            itemSubType = 'None';
            location = 'None';
            break;
        case 'Usable':
            itemType = 'Usable';
            itemSubType = 'None';
            location = 'None';
            break;
        case 'Etc':
            itemType = 'Etc';
            itemSubType = 'None';
            location = 'None';
            break;
        case 'Weapon - One-Handed Sword':
            itemType = 'Weapon One-Hand';
            itemSubType = 'One-Handed Sword';
            location = 'Weapon';
            break;
        case 'Weapon - Two-Handed Sword':
            itemType = 'Weapon Two-Hand';
            itemSubType = 'Two-Handed Sword';
            location = 'Weapon';
            break;
        case 'Weapon - Dagger':
            itemType = 'Weapon One-Hand';
            itemSubType = 'Dagger';
            location = 'Weapon';
            break;
        case 'Weapon - Katar':
            itemType = 'Weapon Two-Hand';
            itemSubType = 'Katar';
            location = 'Weapon';
            break;
        case 'Weapon - One-Handed Axe':
            itemType = 'Weapon One-Hand';
            itemSubType = 'One-Handed Axe';
            location = 'Weapon';
            break;
        case 'Weapon - Two-Handed Axe':
            itemType = 'Weapon Two-Hand';
            itemSubType = 'Two-Handed Axe';
            location = 'Weapon';
            break;
        case 'Weapon - One-Handed Spear':
            itemType = 'Weapon One-Hand';
            itemSubType = 'One-Handed Spear';
            location = 'Weapon';
            break;
        case 'Weapon - Two-Handed Spear':
            itemType = 'Weapon Two-Hand';
            itemSubType = 'Two-Handed Spear';
            location = 'Weapon';
            break;
        case 'Weapon - Two-handed staves':
            itemType = 'Weapon Two-Hand';
            itemSubType = 'Two-handed staves';
            location = 'Weapon';
            break;
        case 'Weapon - Mace':
            itemType = 'Weapon One-Hand';
            itemSubType = 'Mace';
            location = 'Weapon';
            break;
        case 'Weapon - Book':
            itemType = 'Weapon One-Hand';
            itemSubType = 'Book';
            location = 'Weapon';
            break;
        case 'Weapon - Staff':
            itemType = 'Weapon One-Hand';
            itemSubType = 'Staff';
            location = 'Weapon';
            break;
        case 'Weapon - Bow':
            itemType = 'Weapon Two-Hand';
            itemSubType = 'Bow';
            location = 'Weapon';
            break;
        case 'Ammo - Arrow':
            itemType = 'Ammo';
            itemSubType = 'Arrow';
            location = 'None';
            break;
        case 'Ammo - Throwing Dagger':
            itemType = 'Ammo';
            itemSubType = 'Throwing Dagger';
            location = 'None';
            break;
        case 'Weapon - Knuckle':
            itemType = 'Weapon One-Hand';
            itemSubType = 'Knuckle';
            location = 'Weapon';
            break;
        case 'Weapon - Musical Instrument':
            itemType = 'Weapon One-Hand';
            itemSubType = 'Musical Instrument';
            location = 'Weapon';
            break;
        case 'Weapon - Whip':
            itemType = 'Weapon One-Hand';
            itemSubType = 'Whip';
            location = 'Weapon';
            break;
        case 'Armor':
            itemType = 'Armor';
            switch (item.equipLocations) {
                case 'Off Hand':
                    itemSubType = 'Shield';
                    location = 'Shield';
                    break;
                case 'Middle Headgear':
                    itemSubType = 'Headgear';
                    location = 'HeadgearMiddle';
                    break;
                case 'Upper Headgear':
                    itemSubType = 'Headgear';
                    location = 'HeadgearUpper';
                    break;
                case 'Lower Headgear':
                    itemSubType = 'Headgear';
                    location = 'HeadgearLower';
                    break;
                case 'Upper Headgear + Middle Headgear':
                    itemSubType = 'Headgear';
                    location = 'HeadgearUpper';
                    break;
                case 'Lower Headgear + Upper Headgear + Middle Headgear':
                    itemSubType = 'Headgear';
                    location = 'HeadgearUpper';
                    break;
                case 'Lower Headgear + Middle Headgear':
                    itemSubType = 'Headgear';
                    location = 'HeadgearMiddle';
                    break;
                case 'Armor':
                    itemSubType = 'Armor';
                    location = 'Armor';
                    break;
                case 'Footgear':
                    itemSubType = 'Shoes';
                    location = 'Shoes';
                    break;
                case 'Garment':
                    itemSubType = 'Garment';
                    location = 'Garment';
                    break;
                case 'Accessory Right + Accessory Left':
                    itemSubType = 'Accessory';
                    location = 'Accessory';
                    break;
                case 'Lower Headgear + Upper Headgear':
                    itemSubType = 'Headgear';
                    location = 'HeadgearUpper';
                    break;
                case 'Costume Top Headgear':
                    itemSubType = 'Costume';
                    location = 'HeadgearUpper';
                    break;
                case 'Costume Low Headgear':
                    itemSubType = 'Costume';
                    location = 'HeadgearLower';
                    break;
                case 'Costume Mid Headgear':
                    itemSubType = 'Costume';
                    location = 'HeadgearMiddle';
                    break;
                case 'Costume Top Headgear + Costume Mid Headgear + Costume Low Headgear':
                    itemSubType = 'Costume';
                    location = 'HeadgearUpper';
                    break;
                case 'Costume Mid Headgear + Costume Low Headgear':
                    itemSubType = 'Costume';
                    location = 'HeadgearMiddle';
                    break;
                case 'Costume Top Headgear + Costume Mid Headgear':
                    itemSubType = 'Costume';
                    location = 'HeadgearUpper';
                    break;
                case 'Costume Garment':
                    itemSubType = 'Costume';
                    location = 'Garment';
                    break;
                case 'Shadow Armor':
                    itemSubType = 'Costume';
                    location = 'Unknown';
                    break;
                case 'Shadow Accessory Right (Earring)':
                    itemSubType = 'Costume';
                    location = 'Accessory';
                    break
                default:
                    console.log('UNKNOWN ARMOR');
                    console.log(item);
                    process.exit(1);
                    break;
            }
            break;
        case 'Card':
            itemType = 'Card';
            /* sub type is location */
            switch (item.equipLocations) {
                case 'Main Hand':
                    itemSubType = 'Weapon';
                    location = 'Weapon'
                    break;
                case 'Main Hand + Off Hand':
                    itemSubType = 'Weapon';
                    location = 'Weapon';
                    break;
                case 'Off Hand':
                    itemSubType = 'Shield';
                    location = 'Shield';
                    break;
                case 'Middle Headgear':
                case 'Upper Headgear':
                case 'Lower Headgear':
                case 'Upper Headgear + Middle Headgear':
                case 'Lower Headgear + Upper Headgear + Middle Headgear':
                case 'Lower Headgear + Middle Headgear':
                case 'Lower Headgear + Upper Headgear':
                    itemSubType = 'Headgear';
                    location = 'HeadgearUpper'; // TODO
                    break;
                case 'Armor':
                    itemSubType = 'Armor';
                    location = 'Armor';
                    break;
                case 'Footgear':
                    itemSubType = 'Shoes';
                    location = 'Shoes';
                    break;
                case 'Garment':
                    itemSubType = 'Garment';
                    location = 'Garment';
                    break;
                case 'Accessory Right + Accessory Left':
                    itemSubType = 'Accessory';
                    location = 'Accessory';
                    break;
                case 'None':
                    // mostly this are echants
                    itemSubType = 'None';
                    location = 'None';
                    break;
                default:
                    console.log('UNKNOWN CARD');
                    console.log(item);
                    process.exit(1);
                    break;
            }
            break;
        case 'Item Container':
            itemType = 'Item Container';
            itemSubType = 'None';
            location = 'None';
            break;
        case 'Weapon':
            // TODO
            break;
        case 'Pet Egg':
            itemType = 'Pet Egg';
            itemSubType = 'None';
            location = 'None';
            break;
        case 'Pet Armor':
            itemType = 'Pet Armor';
            // TODO: location??
            itemSubType = 'None';
            location = 'None';
            break;
        case 'Weapon - Revolver':
            itemType = 'Weapon Two-Hand';
            itemSubType = 'Revolver';
            location = 'Weapon';
            break;
        case 'Weapon - Rifle':
            itemType = 'Weapon Two-Hand';
            itemSubType = 'Rifle';
            location = 'Weapon';
            break;
        case 'Weapon - Shotgun':
            itemType = 'Weapon Two-Hand';
            itemSubType = 'Shotgun';
            location = 'Weapon';
            break;
        case 'Weapon - Gatling Gun':
            itemType = 'Weapon Two-Hand';
            itemSubType = 'Gatling Gun';
            location = 'Weapon';
            break;
        case 'Weapon - Grenade Launcher':
            itemType = 'Weapon Two-Hand';
            itemSubType = 'Grenade Launcher';
            location = 'Weapon';
            break;
        case 'Ammo - Bullet':
            itemType = 'Ammo';
            itemSubType = 'Bullet';
            location = 'None';
            break;
        case 'Ammo - Grenade':
            itemType = 'Ammo';
            itemSubType = 'Grenade';
            location = 'None';
            break;
        case 'Ammo - Shuriken':
            itemType = 'Ammo';
            itemSubType = 'Shuriken';
            location = 'None';
            break;
        case 'Ammo - Kunai':
            itemType = 'Ammo';
            itemSubType = 'Kunai';
            location = 'None';
            break;
        case 'Ammo - Throwable Item (Sling Item)':
            itemType = 'Ammo';
            itemSubType = 'Throwable Item (Sling Item)';
            location = 'None';
            break;
        case 'Weapon - Fuuma Shuriken':
            itemType = 'Weapon Two-Hand';
            itemSubType = 'Fuuma Shuriken';
            location = 'Weapon';
            break;
        case 'Ammo - Cannonballs':
            itemType = 'Ammo';
            itemSubType = 'Cannonballs';
            location = 'None';
            break;
        case 'Shadow Equipment':
            itemType = 'Shadow Equipment';
            itemSubType = 'Costume';
            location = 'None';  // TODO?
            break;
        default:
            console.log('UNKNOWN TYPE');
            console.log(item);
            process.exit(1);
            break;
    }

    return {
        type: itemType,
        subType: itemSubType,
        location: location
    }
}
/*** main ***/
async function main() {
    const itemDB = await loadItemDB();
    const itemDbFixed: ItemDataFixed[] = [];
    /* map jobs und types to one mask */
    for (const item of itemDB) {
        /*** job mask ***/
        let jobTypes = item.jobRequirement.split('/');
        let mask = 0;
        for (const jobType of jobTypes) {
            let jobTypedFixed = jobType.trim();
            if (jobTypedFixed === 'None') {
                mask = 0;
                break;
            }
            if (jobTypedFixed in JOB_TYPE_MASK) {
                mask = mask | JOB_TYPE_MASK[jobTypedFixed as keyof typeof JOB_TYPE_MASK];
            }
        }
        if (mask > 0) {
            let jobs = item.equippableJobs.split('/');
            for (const job of jobs) {
                let jobFixed = job.trim();
                if (job === 'None') {
                    mask = 0;
                    break;
                }
                if (jobFixed in JOB_MASK) {
                    mask = mask | JOB_MASK[jobFixed as keyof typeof JOB_MASK];
                }
            }
        }

        /*** vanilla ***/
        let vanPvp = true;
        let vanPvm = true;
        if (item.vanilla === VAN_TYPES.PVM_ONLY) {
            vanPvm = true;
            vanPvp = false;
        }
        else if (item.vanilla === VAN_TYPES.NONE) {
            vanPvp = false;
            vanPvm = false;
        }

        /*** equip locations ***/
        const types = determineTypes(item);

        /*** create new item ***/
        // deconstruct old values
        const {
            jobRequirement,
            equippableJobs,
            vanilla,
            type,
            equipLocations,
            ...rest
        } = item;
        let newItem: ItemDataFixed = {
            ...rest,
            jobMask: `0x${mask.toString(16)}`,
            isVanillaPvm: vanPvm,
            isVanillaPvp: vanPvp,
            type: types.type,
            subType: types.subType,
            location: types.location
        }
        itemDbFixed.push(newItem);
    }

    /* save new DB */
    console.log(`Saving new DB (${itemDbFixed.length} items)...`);
    await writeFile('tools/item.db.fixed.json', JSON.stringify(itemDbFixed));
    console.log('Done!');
}
main();