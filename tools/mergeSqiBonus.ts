import { readFile, writeFile } from "fs/promises";

async function main() {
    const weaponDb = JSON.parse(await readFile('./src/assets/db/weapon.db.json', 'utf-8'));
    const headgearDb = JSON.parse(await readFile('./src/assets/db/headgear.db.json', 'utf-8'));
    const itemDbV3: any[] = JSON.parse(await readFile('./src/assets/db/item.db.V3.json', 'utf-8'));

    const dbs = [weaponDb, headgearDb];

    for (const db of dbs) {
        for (const category of Object.values(db) as any[]) {
            for (const [key, item] of Object.entries(category) as [string, any][]) {
                if (item.sqiBonus) {
                    const id = item.gid[0];
                    const transformedSqiBonus: any = {};
                    for (const [k, v] of Object.entries(item.sqiBonus)) {
                        transformedSqiBonus[`${id}_${k}`] = v;
                    }
                    const targetItem = itemDbV3.find(i => i.ID === id);
                    if (targetItem) {
                        targetItem.sqiBonus = transformedSqiBonus;
                    } else {
                        console.warn(`Item with ID ${id} not found in item.db.V3.json`);
                    }
                }
            }
        }
    }

    await writeFile('./src/assets/db/item.db.V3.json', JSON.stringify(itemDbV3, null, 2));
    console.log('Done');
}

main().catch(console.error);