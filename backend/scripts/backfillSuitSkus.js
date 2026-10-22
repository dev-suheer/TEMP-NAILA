//ONE-TIME: GIVES SUIT, B-PAIR AND BRANCH STOCK LINES CREATED BEFORE SKUS THEIR SKU,
//SAVES UNSTITCHED ON LINES CREATED BEFORE STITCH TYPES AND MERGES SUIT LINES THAT ARE THE SAME STOCK
//(SAME DESIGN, CATEGORY, COLOR AND TYPE, ONLY SPACES OR CASE DIFFER, E.G. "Skin" AND "Skin ")
//REPORT: node --env-file .env scripts/backfillSuitSkus.js
//APPLY:  node --env-file .env scripts/backfillSuitSkus.js --apply
import mongoose from "mongoose";
import { SuitsModel } from "../models/Stock/Suits.Model.js";
import { B_PairModel } from "../models/Process/B_PairModel.js";
import { branchStockModel } from "../models/BranchStock/BranchSuitsStockModel.js";
import { branchStockHistoryModel } from "../models/BranchStock/BranchStockHistoryModel.js";
import { PackingModel } from "../models/Process/PackingModel.js";
import { SuitCategoryCodeModel } from "../models/Stock/SuitCategoryCode.Model.js";
import { buildCategoryCode, buildSuitSku, toBPairSku } from "../utils/SuitSku.js";
import { StitchType } from "../enums/StitchType.js";

const apply = process.argv.includes("--apply");
const lineFields = "d_no category color stitch_type sku quantity createdAt";
//CHECKED IN THE DATABASE: LOADED LINES ALREADY SHOW THE SCHEMA DEFAULT
const missingType = { stitch_type: null };
//B-PAIR RECORDS FROM BEFORE THE B-PAIR REVAMP HAVE NO DESIGN/CATEGORY/COLOR AND ARE NOT STOCK LINES
const bPairStockLine = { category: { $exists: true, $ne: null } };

const describe = (line) =>
  `D# ${line.d_no} ${line.category} / ${line.color} / ${line.stitch_type} (qty ${
    line.quantity ?? line.total_quantity
  })`;
const toNameKey = (value) => String(value ?? "").trim().toLowerCase();
const isTrimmed = (line) =>
  line.color === line.color?.trim() && line.category === line.category?.trim();

await mongoose.connect(process.env.MONGODB_URI);
//INDEXES (UNIQUE SKU / CATEGORY CODE) ARE READY BEFORE ANYTHING IS READ OR WRITTEN
await Promise.all(
  [SuitsModel, B_PairModel, branchStockModel, branchStockHistoryModel, PackingModel, SuitCategoryCodeModel].map(
    (model) => model.init()
  )
);

const [savedCodes, allSuits, bPairs, branchLines, bPairsWithoutType, branchWithoutType, oldBPairRecords] =
  await Promise.all([
    SuitCategoryCodeModel.find(),
    SuitsModel.find().select(lineFields).sort({ createdAt: 1 }),
    B_PairModel.find(bPairStockLine).select(lineFields).sort({ createdAt: 1 }),
    branchStockModel
      .find({ sku: null })
      .select("main_stock_Id d_no category color stitch_type total_quantity"),
    B_PairModel.countDocuments({ ...missingType, ...bPairStockLine }),
    branchStockModel.countDocuments(missingType),
    B_PairModel.countDocuments({ category: null }),
  ]);

//SUIT LINES THAT ARE THE SAME STOCK: THE ONE WITHOUT EXTRA SPACES (OR THE OLDEST) IS KEPT
const sameStock = new Map();
allSuits.forEach((line) => {
  if (!line.category || !line.d_no) return;
  const key = [line.d_no, toNameKey(line.category), toNameKey(line.color), line.stitch_type].join("|");
  sameStock.set(key, [...(sameStock.get(key) || []), line]);
});
const merges = [...sameStock.values()]
  .filter((lines) => lines.length > 1)
  .map((lines) => {
    const keep = lines.find(isTrimmed) || lines[0];
    return { keep, drops: lines.filter((line) => line !== keep) };
  });
const keptIdByDropId = new Map();
merges.forEach(({ keep, drops }) =>
  drops.forEach((drop) => keptIdByDropId.set(String(drop._id), keep._id))
);
const suits = allSuits.filter((line) => !keptIdByDropId.has(String(line._id)));
const suitsWithoutType = await SuitsModel.countDocuments({
  ...missingType,
  _id: { $nin: [...keptIdByDropId.keys()] },
});

//CATEGORY CODES: SAVED ONES STAY, NEW CATEGORIES IN THE ORDER THEIR STOCK WAS CREATED
const categoryCodes = new Map(savedCodes.map((item) => [item.category_key, item.code]));
const takenCodes = new Set(categoryCodes.values());
const newCategoryCodes = [];
for (const line of [...suits, ...bPairs]) {
  if (!line.category) continue;
  const category_key = line.category.trim().toLowerCase();
  if (categoryCodes.has(category_key)) continue;
  const code = buildCategoryCode(line.category, takenCodes);
  categoryCodes.set(category_key, code);
  takenCodes.add(code);
  newCategoryCodes.push({ category_key, category: line.category.trim(), code });
}

const toMainSku = (line) => {
  if (!line.category || !line.d_no) throw new Error("Line has no category or design no");
  return buildSuitSku({
    categoryCode: categoryCodes.get(line.category.trim().toLowerCase()),
    d_no: line.d_no,
    color: line.color,
    stitch_type: line.stitch_type,
  });
};

//FILLS MISSING SKUS AND FINDS LINES THAT WOULD SHARE ONE
const planSkus = (lines, toSku) => {
  const updates = [];
  const problems = [];
  const owners = new Map();
  for (const line of lines) {
    let sku = line.sku;
    if (!sku) {
      try {
        sku = toSku(line);
      } catch (error) {
        problems.push(`${describe(line)}: ${error.message}`);
        continue;
      }
      updates.push({ updateOne: { filter: { _id: line._id }, update: { $set: { sku } } } });
    }
    owners.set(sku, [...(owners.get(sku) || []), line]);
  }
  owners.forEach((sharing, sku) => {
    if (sharing.length > 1) {
      problems.push(`${sku} would be shared by: ${sharing.map(describe).join(" | ")}`);
    }
  });
  return { updates, problems, owners };
};

const suitPlan = planSkus(suits, toMainSku);
const bPairPlan = planSkus(bPairs, (line) => toBPairSku(toMainSku(line)));

//BRANCH LINES TAKE THE SKU OF THEIR MAIN STOCK LINE (A MERGED LINE'S BRANCH STOCK MOVES TO THE KEPT LINE)
const mainSkuById = new Map();
suitPlan.owners.forEach((sharing, sku) =>
  sharing.forEach((line) => mainSkuById.set(String(line._id), sku))
);
const branchUpdates = [];
const branchWarnings = [];
branchLines.forEach((line) => {
  const mainId = String(keptIdByDropId.get(String(line.main_stock_Id)) ?? line.main_stock_Id);
  const sku = mainSkuById.get(mainId);
  if (sku) {
    branchUpdates.push({ updateOne: { filter: { _id: line._id }, update: { $set: { sku } } } });
  } else {
    branchWarnings.push(`${describe(line)}: main stock line not found, left without SKU`);
  }
});

const problems = [...suitPlan.problems, ...bPairPlan.problems];

console.log("\nCategory codes:");
savedCodes.forEach(({ code, category }) => console.log(`  ${code}  ${category}`));
newCategoryCodes.forEach(({ code, category }) => console.log(`  ${code}  ${category}  (new)`));
//EVERYTHING THAT POINTS AT A MERGED (REMOVED) LINE, IN THE ORDER IT IS REPOINTED
const inBundles = (field, ids) => ({
  bundles: { $elemMatch: { $elemMatch: { [field]: { $in: ids } } } },
});
const countLinks = async (ids, session) => {
  const options = session ? { session } : {};
  const [branchRows, transferRecords, packings] = await Promise.all([
    branchStockModel.collection.countDocuments({ main_stock_Id: { $in: ids } }, options),
    branchStockHistoryModel.collection.countDocuments(
      { $or: [inBundles("Item_Id", ids), inBundles("allocation.main_Item_Id", ids)] },
      options
    ),
    PackingModel.collection.countDocuments({ "rows.suit_id": { $in: ids } }, options),
  ]);
  return { branchRows, transferRecords, packings };
};
//PRICES OF THE LINE THAT WAS TOPPED UP LAST
const latestPrices = (lines) =>
  lines.reduce((last, line) => ((line.updatedAt ?? 0) > (last.updatedAt ?? 0) ? line : last));

if (merges.length) {
  console.log(`\nSuit lines to merge (same stock, only spaces or case differ): ${merges.length}`);
  for (const { keep, drops } of merges) {
    const ids = [keep._id, ...drops.map((drop) => drop._id)];
    const lines = await SuitsModel.collection.find({ _id: { $in: ids } }).toArray();
    const prices = latestPrices(lines);
    const links = await countLinks(drops.map((drop) => drop._id));
    console.log(
      `  - D# ${keep.d_no} ${keep.category} / "${keep.color}" (qty ${keep.quantity}) <- ${drops
        .map((drop) => `"${drop.color}" (qty ${drop.quantity})`)
        .join(", ")}`
    );
    console.log(
      `      becomes qty ${lines.reduce((total, line) => total + (line.quantity || 0), 0)}, cost ${prices.cost_price}, sale ${prices.sale_price}; repoints ${links.branchRows} branch rows, ${links.transferRecords} transfer records, ${links.packings} packings`
    );
  }
}
console.log(`\nSuits lines to fill:   ${suitPlan.updates.length} of ${suits.length}`);
console.log(`B-Pair lines to fill:  ${bPairPlan.updates.length} of ${bPairs.length}`);
console.log(`Branch lines to fill:  ${branchUpdates.length} of ${branchLines.length}`);
console.log(
  `\nLines without a type (saved as Unstitched): Suits ${suitsWithoutType}, B-Pair ${bPairsWithoutType}, Branch ${branchWithoutType}`
);
if (oldBPairRecords) {
  console.log(`Old-format B-Pair records left as they are: ${oldBPairRecords}`);
}
if (problems.length) {
  console.log("\nProblems (rename or merge these lines first):");
  problems.forEach((problem) => console.log(`  - ${problem}`));
}
if (branchWarnings.length) {
  console.log("\nWarnings:");
  branchWarnings.forEach((warning) => console.log(`  - ${warning}`));
}

//MOVES DUPLICATE LINES INTO THE KEPT LINE AND POINTS EVERYTHING THAT USED THEM TO THE KEPT LINE.
//WORKS ON THE STORED DOCUMENTS (DRIVER) SO OLD RECORDS ARE MOVED EXACTLY AS THEY ARE
const mergeLines = async ({ keep, drops }, session) => {
  const dropIds = drops.map((drop) => drop._id);
  const fromDrops = { $in: dropIds };
  const lines = await SuitsModel.collection
    .find({ _id: { $in: [keep._id, ...dropIds] } }, { session })
    .toArray();
  const keptLine = lines.find((line) => String(line._id) === String(keep._id));
  const dropLines = lines.filter((line) => line !== keptLine);
  if (!keptLine || dropLines.length !== dropIds.length) {
    throw new Error(`Stock changed while merging D# ${keep.d_no}. Run the script again`);
  }
  const prices = latestPrices(lines);
  await SuitsModel.collection.updateOne(
    { _id: keep._id },
    {
      $inc: { quantity: dropLines.reduce((total, line) => total + (line.quantity || 0), 0) },
      $set: { cost_price: prices.cost_price, sale_price: prices.sale_price, updatedAt: new Date() },
      $push: { all_records: { $each: dropLines.flatMap((line) => line.all_records || []) } },
    },
    { session }
  );

  await branchStockModel.collection.updateMany(
    { main_stock_Id: fromDrops },
    { $set: { main_stock_Id: keep._id } },
    { session }
  );
  //BUNDLES ARE ARRAYS OF ARRAYS: MATCHED WITH A NESTED $elemMatch
  await branchStockHistoryModel.collection.updateMany(
    inBundles("Item_Id", dropIds),
    { $set: { "bundles.$[].$[item].Item_Id": keep._id } },
    { arrayFilters: [{ "item.Item_Id": fromDrops }], session }
  );
  await branchStockHistoryModel.collection.updateMany(
    inBundles("allocation.main_Item_Id", dropIds),
    { $set: { "bundles.$[].$[item].allocation.main_Item_Id": keep._id } },
    { arrayFilters: [{ "item.allocation.main_Item_Id": fromDrops }], session }
  );
  await PackingModel.collection.updateMany(
    { "rows.suit_id": fromDrops },
    { $set: { "rows.$[row].suit_id": keep._id } },
    { arrayFilters: [{ "row.suit_id": fromDrops }], session }
  );
  await SuitsModel.collection.deleteMany({ _id: fromDrops }, { session });

  //NOTHING MAY STILL POINT AT A REMOVED LINE, OTHERWISE THE WHOLE RUN IS CANCELLED
  const left = await countLinks(dropIds, session);
  if (left.branchRows || left.transferRecords || left.packings) {
    throw new Error(
      `Records still point to a merged line of D# ${keep.d_no} (${JSON.stringify(left)}). Nothing was saved`
    );
  }
};

if (!apply) {
  console.log("\nReport only. Run again with --apply to save.");
} else if (problems.length) {
  console.log("\nNot applied: fix the problems above first.");
  process.exitCode = 1;
} else {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const merge of merges) await mergeLines(merge, session);
      if (newCategoryCodes.length) {
        await SuitCategoryCodeModel.insertMany(newCategoryCodes, { session });
      }
      if (suitPlan.updates.length) await SuitsModel.bulkWrite(suitPlan.updates, { session });
      if (bPairPlan.updates.length) await B_PairModel.bulkWrite(bPairPlan.updates, { session });
      if (branchUpdates.length) await branchStockModel.bulkWrite(branchUpdates, { session });
      const setUnstitched = { $set: { stitch_type: StitchType.UNSTITCHED } };
      await SuitsModel.updateMany(missingType, setUnstitched).session(session);
      await B_PairModel.updateMany({ ...missingType, ...bPairStockLine }, setUnstitched).session(session);
      await branchStockModel.updateMany(missingType, setUnstitched).session(session);
    });
    console.log("\nApplied.");
  } finally {
    await session.endSession();
  }
}

await mongoose.disconnect();
