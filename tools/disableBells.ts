const { readFile, writeFile } = require("fs/promises");
const path = require("path");

interface Item {
  ID: number;
  name: string;
  location: string;
  disabled?: boolean;
  [key: string]: any;
}

async function main() {
  try {
    // Read the item database
    const itemDbPath = path.join(__dirname, '../src/assets/db/item.db.V3.json');
    const itemDbV3: Item[] = JSON.parse(await readFile(itemDbPath, 'utf-8'));

    console.log(`\n📂 Loaded item database with ${itemDbV3.length} items\n`);

    // Find matching items
    const matchingItems: Item[] = [];
    const updatedItems: Item[] = itemDbV3.map(item => {
      // Check all three conditions
      const nameEndsWithBell = item.name?.endsWith('Bell') ?? false;
      const locationIsHeadgearLower = item.location === 'HeadgearLower';
      const idNotEqual5051 = item.ID !== 5051;

      if (nameEndsWithBell && locationIsHeadgearLower && idNotEqual5051) {
        matchingItems.push(item);
        return { ...item, disabled: true };
      }
      return item;
    });

    // Log detailed results
    console.log(`🔍 Found ${matchingItems.length} matching items:\n`);
    matchingItems.forEach((item, index) => {
      console.log(
        `  ${index + 1}. ID: ${item.ID} | Name: "${item.name}" | Location: ${item.location}`
      );
    });

    if (matchingItems.length === 0) {
      console.log('  ℹ️  No items matched the criteria.\n');
    } else {
      console.log(`\n✅ Added disabled=true to ${matchingItems.length} item(s)\n`);
    }

    // Write the updated database
    await writeFile(itemDbPath, JSON.stringify(updatedItems, null, 2));
    console.log(`💾 Successfully wrote updated database to ${itemDbPath}\n`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
