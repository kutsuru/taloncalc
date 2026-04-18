const fs = require("fs");
const path = require("path");

const FILE = "src\\assets\\db\\item.db.V3.json";

const [rawCheck, rawAdd] = process.argv.slice(2);

if (!rawCheck || !rawAdd) {
  console.error("Usage: node patchJobMask.js <matchBit> <addBit>");
  console.error("Example: node patchJobMask.js 0x4 0x8");
  process.exit(1);
}

const CHECK_BIT = Number(rawCheck);
const ADD_BIT = Number(rawAdd);

if (isNaN(CHECK_BIT) || isNaN(ADD_BIT)) {
  console.error(`Invalid arguments: "${rawCheck}", "${rawAdd}" — use hex (0x4) or decimal`);
  process.exit(1);
}

const raw = fs.readFileSync(path.resolve(FILE), "utf-8");
const data = JSON.parse(raw);

let patchedCount = 0;

const result = data.map((entry) => {
  const value = Number(entry.jobMask);

  if (isNaN(value)) {
    console.warn(`Skipping entry with invalid jobMask: "${entry.jobMask}"`);
    return entry;
  }

  if ((value & CHECK_BIT) === CHECK_BIT && (value & ADD_BIT) === 0) {
    patchedCount++;
    return {
      ...entry,
      jobMask: "0x" + (value | ADD_BIT).toString(16).toUpperCase(),
    };
  }

  return entry;
});

fs.writeFileSync(path.resolve(FILE), JSON.stringify(result, null, 2), "utf-8");

console.log(`Done. ${patchedCount} of ${data.length} entries patched → ${FILE}`);