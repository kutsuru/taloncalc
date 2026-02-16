/*** imports ***/
import dotenv from "dotenv";
import { readFile, writeFile } from "fs/promises";
import * as cheerio from 'cheerio';

/*** types ***/
type ItemInfo = {
    id: number,
    identifiedDisplayName: string,
    slotCount: number
}[];

/**
 * 
Item ID: 1101
For Sale: No
Identifier: Sword
Talon Shop: Not For Sale
Name: Sword
Type: Weapon - One-Handed Sword
NPC Buy: 100
Weight: 50
NPC Sell: 50
Weapon Level: 1
Range: 1
Defense: 0
Slots: 3
Refineable: Yes
Attack: 25
Min Equip Level: 2
Equip Locations: Main Hand
Job Requirement: Normal / Transcendent / Baby
Equippable Jobs: Novice / Swordman / Merchant / Thief / Knight / Blacksmith / Assassin / Crusader / Rogue / Alchemist
Description: [NPC Buyable] A basic one-handed sword.
Vanilla: No Vanilla restrictions
Item Use Script: None
Equip Script: None
Unequip Script: None
 */
export type ItemData = {
    ID: number;
    talonShop: number;
    name: string;
    type: string;
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
    equipLocations: string;
    jobRequirement: string;
    equippableJobs: string;
    description: string;
    vanilla: string;
    itemScript: string;
}
export type ItemCombo = {
    items: number[];
    effect: string;
}
/*** definitions ***/
// const
const FILE_ITEMINFO = 'tools/T_Iteminfo_2026-02-07.json';
const FILE_ITEM_DB = 'tools/item.db.json';
const FILE_COMBO_DB = 'tools/item-combo.db.json';
const START_ID = -1;
const END_ID = -1;
const COMBO_ITEM_ID_REG = /\[(\d+)\](?!.*\[\d+\])/;
const COMBO_EFFECT_REG = /\{([^}]*)\}/;
const SLEEP_MS = 100;
// varbs
const itemCombosDB: Map<string, ItemCombo> = new Map();
const itemDB: Map<number, ItemData> = new Map();
let stop = false;

/*** functions ***/
async function fetchItemFromWeb(cookie: string, id: number) {
    const url = `https://talontales.com/panel/?module=item&action=view&id=${id}`
    const vendingRes = await fetch(url, {
        headers: {
            'Cookie': `${cookie};`
        }
    });
    return vendingRes.text();
}
async function loadItemInfo() {
    const fileData = await readFile(FILE_ITEMINFO);
    const fileStr = fileData.toString();
    const data: ItemInfo = JSON.parse(fileStr);
    return data;
}
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
};
function toN(str: string): number {
    return +str.replace(',', '');
}
function extractItemInfo(body: string) {
    let $ = cheerio.load(body);

    /* find item table */
    const data: any = {};
    $('table.vertical-table th').each((_, element) => {
        const $th = $(element);
        const key = $th.text().trim();
        const $td = $th.next('td');

        // Textbereinigung (Entfernt unnötige Leerzeichen und Zeilenumbrüche)
        const value = $td.text().replace(/\s+/g, ' ').trim();

        switch (key) {
            case 'Item ID': data.ID = toN(value); break;
            case 'Talon Shop':
                if (value === 'Not For Sale') {
                    data.talonShop = 0;
                } else {
                    data.talonShop = toN(value);   // values are 2,000 / 500 / ...
                }
                break;
            case 'Name': data.name = value; break;
            case 'NPC Buy': data.npcBuy = toN(value); break;
            case 'NPC Sell': data.npcSell = toN(value); break;
            case 'Range': data.range = toN(value); break;
            case 'Slots': data.slots = toN(value); break;
            case 'Attack': data.attack = toN(value); break;
            case 'Type': data.type = value; break;
            case 'Weight': data.weight = toN(value); break;
            case 'Weapon Level': data.weaponLevel = toN(value); break;
            case 'Defense': data.defense = toN(value); break;
            case 'Refineable':
                data.refineable = value === 'Yes';
                break;
            case 'Min Equip Level': data.requiredLv = toN(value); break;
            case 'Equip Locations': data.equipLocations = value; break;
            case 'Job Requirement': data.jobRequirement = value; break;
            case 'Equippable Jobs': data.equippableJobs = value; break;
            case 'Description': data.description = value; break;
            case 'Vanilla': data.vanilla = value; break;
            case 'Item Use Script':
                if (value.startsWith('1')) {
                    data.itemScript = value.slice(1).trim();
                }
                else {
                    data.itemScript = value;
                }
                break;
        }
    });

    /* find item combos */
    let itemCombos: ItemCombo[] = [];
    for (const comboData of $('.item-combo-entry')) {
        /* find items */
        let combo: ItemCombo = {
            items: [],
            effect: ''
        }
        for (const comboItem of $(comboData).find('ul li')) {
            let comboItemText = $(comboItem).text().replace(/\s+/g, ' ').trim();
            let match = comboItemText.match(COMBO_ITEM_ID_REG);
            if (match) {
                combo.items.push(toN(match[1]));
            }
        }
        /* find effect */
        let effectEle = $(comboData).find('div > strong');
        let effectDiv = effectEle.next();
        const effectScriptAll = effectDiv.text().replace(/\s+/g, ' ').trim();
        let match = effectScriptAll.match(COMBO_EFFECT_REG);
        if (match) {
            combo.effect = match[1].trim();
        }
        itemCombos.push(combo);
    }

    return {
        item: data as ItemData,
        combos: itemCombos
    }
}
function generateComboId(items: number[]): string {
    /* sort numbers */
    let sorted = items.sort((a, b) => a - b);
    return sorted.join(':');
}
async function loadItemDB() {
    try {
        const dbData = await readFile(FILE_ITEM_DB);
        const dbStr = dbData.toString();
        const data: ItemData[] = JSON.parse(dbStr);
        for (const item of data) {
            itemDB.set(item.ID, item);
        }
    }
    catch (e) { /* emmpty db */ }
}
async function comboDB() {
    try {
        const dbData = await readFile(FILE_COMBO_DB);
        const dbStr = dbData.toString();
        const data: ItemCombo[] = JSON.parse(dbStr);
        for (const item of data) {
            let comboId = generateComboId(item.items);
            itemCombosDB.set(comboId, item);
        }
    }
    catch (e) { /* emmpty db */ }
}


/*** main ***/
async function main() {
    /* load config */
    dotenv.config({ quiet: true });
    const cookie = process.env['TT_COOKIE'] || '';

    /* load iteminfo & old DB */
    const itemInfo = await loadItemInfo();
    await loadItemDB();
    await comboDB();

    /* start scrapping */
    const itemsTotal = itemInfo.length;
    for (let idx = 0; idx < itemsTotal; idx++) {
        const item = itemInfo[idx];
        if (START_ID > 0 && item.id < START_ID) continue;
        if (END_ID > 0 && item.id > END_ID) break;
        const progress = (idx + 1) / itemsTotal * 100;
        /* fetch data */
        console.log(`Fetching ${item.id} (${idx + 1}/${itemsTotal}) [${progress.toFixed(2)}%] ...`);
        const itemID = item.id;
        try {
            const bodyData = await fetchItemFromWeb(cookie, itemID);
            /* extract */
            const extractedData = extractItemInfo(bodyData);
            itemDB.set(itemID, extractedData.item);

            /* look for combos */
            for (const combo of extractedData.combos) {
                let comboId = generateComboId(combo.items);
                if (!itemCombosDB.has(comboId)) {
                    itemCombosDB.set(comboId, combo)
                }
            }
            /* save */

            /* delay for DDoS protection */
            await sleep(SLEEP_MS);
        }
        catch (e) {
            console.log(`#### Error at ${itemID} ####`);
            console.log(e);
            stop = true;
        }

        if (stop) {
            console.log(`Stopped at ${itemID}`);
            break;
        }
    }

    /* save data */
    await writeFile(FILE_ITEM_DB, JSON.stringify(Array.from(itemDB.values())));
    await writeFile(FILE_COMBO_DB, JSON.stringify(Array.from(itemCombosDB.values())));
}

process.on('SIGINT', () => {
    console.log('Stop execution...');
    stop = true;
});
main();