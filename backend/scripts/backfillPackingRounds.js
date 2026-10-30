//ONE-TIME: SETS UP PACKING IN ROUNDS ON THE EXISTING DATA
//  - EVERY PACKING GETS ITS ROUND NUMBER (1, 2, 3... PER SOURCE RECORD, OLDEST FIRST) AND THE PARTY OF ITS SOURCE STEP
//  - A STITCHING PACKED IN ONE GO BEFORE PACKING RECORDS EXISTED (packed: true, NO PACKING RECORD) IS MARKED packed_before_tracking
//  - EVERY STITCHING GETS ITS PACKED QUANTITIES AND PACKING STATUS SAVED (ALSO "Not Packed", SO THE LIST FILTER FINDS IT),
//    CUTTING, STONE AND ORDERS THEIR PACKED QUANTITIES. CALCULATED BY THE SAME FUNCTIONS THE APP USES
//  - THE OLD packed FLAG OF STITCHING IS REMOVED
//EVERYTHING IS READ ONCE AND CALCULATED IN MEMORY, THEN SAVED WITH A FEW BULK WRITES IN ONE SHORT TRANSACTION
//SAFE TO RUN AGAIN: ONLY VALUES THAT DIFFER ARE WRITTEN, SO A SECOND RUN FINDS NOTHING TO CHANGE
//RUN WITH THE BACKEND STOPPED, RIGHT BEFORE STARTING THE CODE THAT PACKS IN ROUNDS
//REPORT: node --env-file .env scripts/backfillPackingRounds.js
//APPLY:  node --env-file .env scripts/backfillPackingRounds.js --apply
import mongoose from "mongoose";
import { PackingModel } from "../models/Process/PackingModel.js";
import { StitchingModel } from "../models/Process/StitchingModel.js";
import { CuttingModel } from "../models/Process/CuttingModel.js";
import { StoneModel } from "../models/Process/StoneModel.js";
import { EmbroideryModel } from "../models/Process/EmbroideryModel.js";
import { PackingStatus } from "../enums/PackingStatus.js";
import {
  getOrderPackingValues,
  getOrdersPackingProgress,
  getSourcePackingValues,
  getStitchingPackingValues,
  isPackedBeforeTracking,
  packedSourceModels,
  ProcessStep,
} from "../utils/ProcessQuantity.js";

const apply = process.argv.includes("--apply");

const sourceModels = {
  [ProcessStep.EMBROIDERY]: EmbroideryModel,
  [ProcessStep.STITCHING]: StitchingModel,
  ...packedSourceModels,
};

const groupBy = (items, getKey) => {
  const groups = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return groups;
};
//"suits_category.0.packed_quantity" -> doc.suits_category[0].packed_quantity
const getPath = (doc, path) => path.split(".").reduce((value, key) => value?.[key], doc);
//ONLY THE VALUES THAT DIFFER FROM WHAT IS STORED
const getChanges = (doc, values) =>
  Object.fromEntries(Object.entries(values).filter(([path, value]) => getPath(doc, path) !== value));
const toUpdate = (doc, update) => ({ updateOne: { filter: { _id: doc._id }, update } });

await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, autoCreate: false });

//1. ROUND NUMBERS AND SOURCE PARTY NAMES
const packings = await PackingModel.collection
  .find({})
  .project({ source_step: 1, source_id: 1, round_no: 1, source_partyName: 1, embroidery_Id: 1, rows: 1, total_received: 1 })
  .sort({ createdAt: 1, _id: 1 })
  .toArray();
const packingsBySource = groupBy(packings, (packing) => `${packing.source_step}:${packing.source_id}`);
const packingsByOrder = groupBy(packings, (packing) => String(packing.embroidery_Id));

const partyNames = new Map();
for (const [step, model] of Object.entries(sourceModels)) {
  const ids = packings.filter((packing) => packing.source_step === step).map((packing) => packing.source_id);
  const sources = await model.collection.find({ _id: { $in: ids } }).project({ partyName: 1 }).toArray();
  sources.forEach((source) => partyNames.set(`${step}:${source._id}`, source.partyName || null));
}

const missingSources = [];
const packingUpdates = [];
let roundsSet = 0;
let partyNamesSet = 0;
packingsBySource.forEach((rounds, sourceKey) => {
  if (!partyNames.has(sourceKey)) missingSources.push(`${rounds.length} packing(s) of ${sourceKey}`);
  rounds.forEach((packing, index) => {
    const values = { round_no: index + 1 };
    if (!packing.source_partyName && partyNames.get(sourceKey)) {
      values.source_partyName = partyNames.get(sourceKey);
    }
    const changes = getChanges(packing, values);
    if (changes.round_no !== undefined) roundsSet += 1;
    if (changes.source_partyName !== undefined) partyNamesSet += 1;
    if (Object.keys(changes).length) packingUpdates.push(toUpdate(packing, { $set: changes }));
  });
});

//2. EVERY STITCHING: LEGACY FLAG, PACKED QUANTITIES, STATUS, OLD FLAG REMOVED
const stitchingRowFields = Object.fromEntries(
  ["suits_category", "dupatta_category"].flatMap((category) =>
    ["color", "recieved", "packed_quantity"].map((field) => [`${category}.${field}`, 1])
  )
);
const stitchings = await StitchingModel.collection
  .find({})
  .project({
    ...stitchingRowFields,
    serial_No: 1, design_no: 1, partyName: 1, r_quantity: 1,
    packed: 1, packed_before_tracking: 1, packed_quantity: 1, packing_status: 1,
  })
  .toArray();
const stitchingUpdates = [];
const overPacked = [];
let legacyStitchings = 0;
let stitchingsChanged = 0;
let packedFlagsRemoved = 0;
stitchings.forEach((stitching) => {
  const rounds = packingsBySource.get(`${ProcessStep.STITCHING}:${stitching._id}`) || [];
  const isLegacy = isPackedBeforeTracking(stitching, rounds.length);
  if (isLegacy && !stitching.packed_before_tracking) legacyStitchings += 1;
  const values = getStitchingPackingValues({ ...stitching, packed_before_tracking: isLegacy }, rounds);
  if (values.packed_quantity > Number(stitching.r_quantity || 0)) {
    overPacked.push(
      `S.N ${stitching.serial_No} D# ${stitching.design_no} (${stitching.partyName}): packed ${values.packed_quantity} of ${stitching.r_quantity} received`
    );
  }

  const changes = getChanges(stitching, { ...values, packed_before_tracking: isLegacy });
  const hasOldFlag = Object.hasOwn(stitching, "packed");
  if (hasOldFlag) packedFlagsRemoved += 1;
  if (!Object.keys(changes).length && !hasOldFlag) return;
  stitchingsChanged += 1;
  stitchingUpdates.push(
    toUpdate(stitching, {
      ...(Object.keys(changes).length && { $set: changes }),
      ...(hasOldFlag && { $unset: { packed: "" } }),
    })
  );
});

//3. CUTTING AND STONE: THE ONES PACKED FROM, OR STILL STORING A PACKED QUANTITY
const sourceUpdates = [];
const sourceCounts = [];
for (const [step, model] of Object.entries(packedSourceModels)) {
  const ids = packings.filter((packing) => packing.source_step === step).map((packing) => packing.source_id);
  const docs = await model.collection
    .find({ $or: [{ _id: { $in: ids } }, { packed_quantity: { $gt: 0 } }] })
    .project({ packed_quantity: 1 })
    .toArray();
  const updates = docs
    .map((doc) => ({
      doc,
      changes: getChanges(doc, getSourcePackingValues(packingsBySource.get(`${step}:${doc._id}`) || [])),
    }))
    .filter(({ changes }) => Object.keys(changes).length)
    .map(({ doc, changes }) => toUpdate(doc, { $set: changes }));
  sourceUpdates.push({ model, updates });
  sourceCounts.push({ label: step, checked: docs.length, changed: updates.length });
}

//4. ORDERS: THE ONES WITH PACKINGS, OR STILL STORING A COUNT
const orderIds = [...packingsByOrder.keys()].map((id) => new mongoose.Types.ObjectId(id));
const orders = await EmbroideryModel.collection
  .find({ $or: [{ _id: { $in: orderIds } }, { packing_count: { $gt: 0 } }] })
  .project({ packed_quantity: 1, packing_count: 1 })
  .toArray();
const orderUpdates = orders
  .map((order) => ({
    order,
    changes: getChanges(order, getOrderPackingValues(packingsByOrder.get(String(order._id)) || [])),
  }))
  .filter(({ changes }) => Object.keys(changes).length)
  .map(({ order, changes }) => toUpdate(order, { $set: changes }));

//5. REPORT ONLY: PACKED ORDERS WHOSE PROGRESS CAN NOT BE WORKED OUT (THE LIST SHOWS THEM GREEN, AS BEFORE)
const packedOrders = await EmbroideryModel.find({
  $or: [{ _id: { $in: orderIds } }, { "next_steps.packing": true }],
}).lean();
const oldPackedOrders = (await getOrdersPackingProgress(packedOrders)).filter(
  (progress) => progress.legacy && progress.packing_status !== PackingStatus.NOT_PACKED
).length;

console.log(`Packings: ${packings.length}`);
console.log(`  round numbers to set:      ${roundsSet}`);
console.log(`  source party names to set: ${partyNamesSet}`);
console.log(`Stitchings packed before rounds were tracked: ${legacyStitchings}`);
console.log("Stored packing counters (records checked / to change):");
console.log(`  ${"Stitching".padEnd(10)} ${stitchings.length} / ${stitchingsChanged}`);
sourceCounts.forEach(({ label, checked, changed }) =>
  console.log(`  ${label.padEnd(10)} ${checked} / ${changed}`)
);
console.log(`  ${"Orders".padEnd(10)} ${orders.length} / ${orderUpdates.length}`);
console.log(`Old "packed" flags to remove: ${packedFlagsRemoved}`);
console.log(
  `Packed orders whose progress can not be worked out (shown green, as before): ${oldPackedOrders} of ${packedOrders.length}`
);
if (missingSources.length) {
  console.log("\nPackings whose source record no longer exists (left without a party name):");
  missingSources.forEach((line) => console.log(`  - ${line}`));
}
if (overPacked.length) {
  console.log("\nStitchings with more packed than received (check these by hand):");
  overPacked.forEach((line) => console.log(`  - ${line}`));
}

const writes = [
  { model: PackingModel, updates: packingUpdates },
  { model: StitchingModel, updates: stitchingUpdates },
  ...sourceUpdates,
  { model: EmbroideryModel, updates: orderUpdates },
].filter(({ updates }) => updates.length);

if (!apply) {
  console.log("\nReport only, nothing was saved. Run again with --apply to save.");
} else if (!writes.length) {
  console.log("\nNothing to change.");
} else {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const { model, updates } of writes) {
        await model.collection.bulkWrite(updates, { session, ordered: false });
      }
    });
    console.log("\nApplied.");
  } finally {
    await session.endSession();
  }
}

await mongoose.disconnect();
