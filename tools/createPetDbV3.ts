import { readFile, writeFile } from "fs/promises";
import dotenv from "dotenv";
import * as cheerio from 'cheerio';

async function fetchItemFromWeb(cookie: string, id: number) {
    const url = `https://talontales.com/panel/?module=item&action=view&id=${id}`
    const vendingRes = await fetch(url, {
        headers: {
            'Cookie': `${cookie};`
        }
    });
    return vendingRes.text();
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
            case 'Pet Bonus Script':
                if (value.startsWith('1')) {
                    data.petScript = value.slice(1).trim();
                }
                else {
                    data.petScript = value;
                }
                break;
        }
    });

    return data;
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

function toN(str: string): number {
    return +str.replace(',', '');
}

async function main() {
    /* load config */
    dotenv.config({ quiet: true });
    const cookie = process.env['TT_COOKIE'] || '';

    /* load itemDB */
    const itemDbV3: any[] = JSON.parse(await readFile('./src/assets/db/item.db.V3.json', 'utf-8'));
    const petDb: any[] = [];

    for (const item of itemDbV3) {
        if (item.type === "Pet Egg") {
            const name = item.name.replace(/ Egg$/, '');
            const descMatch = item.description.match(/Loyal Bonus When summoned,(.*)/);
            const desc = descMatch ? descMatch[1].trim() : '';

            /* get pet bonus from panel */
            console.log('# Fetch data for ', name, "...");
            const panelData = await fetchItemFromWeb(cookie, item.ID);
            const itemInfo = extractItemInfo(panelData);

            /* create entry */
            petDb.push({
                ID: item.ID,
                name: name,
                desc: desc,
                bonus: itemInfo.petScript
            });

            /* delay for DDoS protection */
            await sleep(100);
        }
    }

    await writeFile('./src/assets/db/pet.db.V3.json', JSON.stringify(petDb, null, 2));
    console.log(`Created pet.db.V3.json with ${petDb.length} entries`);
}

main().catch(console.error);