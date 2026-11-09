//SAVES WHERE EVERY ORDER, CUTTING, STONE AND STITCHING SHOWS IN ITS PROCESS LIST (list_rank, enums/ListRank.js)
//  - CALCULATED BY THE SAME FUNCTION THE APP RUNS AFTER EVERY SAVE (getListRankUpdates), A BATCH OF ORDERS AT A TIME
//  - A STEP RECORD NOT LINKED TO AN EXISTING ORDER BY ITS ID (ORDER DELETED, NO LINK, OR LINK STORED AS TEXT)
//    IS RANKED BY ITS OWN STATUS (COMPLETED = DONE) AND LISTED WITH THE REASON
//  - CALENDAR IS SORTED BY ITS STATUS, SO IT NEEDS NOTHING
//SAFE TO RUN AGAIN: ONLY VALUES THAT DIFFER ARE WRITTEN, SO A SECOND RUN FINDS NOTHING TO CHANGE
//IT ONLY WRITES list_rank, SO THE BACKEND CAN KEEP RUNNING. RUN IT RIGHT AFTER DEPLOYING THE CODE THAT SORTS BY IT
//(UNTIL THEN, RECORDS WITHOUT A RANK SHOW AT THE END OF THE LISTS)
//REPORT: node --env-file .env scripts/backfillListRanks.js
//APPLY:  node --env-file .env scripts/backfillListRanks.js --apply
import mongoose from "mongoose";
import { EmbroideryModel } from "../models/Process/EmbroideryModel.js";
import { CuttingModel } from "../models/Process/CuttingModel.js";
import { StoneModel } from "../models/Process/StoneModel.js";
import { StitchingModel } from "../models/Process/StitchingModel.js";
import { ListRank } from "../enums/ListRank.js";
import {
  getListRankUpdates,
  ProcessStep,
  writeListRankUpdates,
} from "../utils/ProcessQuantity.js";

const apply = process.argv.includes("--apply");
const BATCH_SIZE = 500;

await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, autoCreate: false });

const changed = new Map();
const save = async (updates) => {
  updates.forEach(({ step, operations }) =>
    changed.set(step, (changed.get(step) || 0) + operations.length)
  );
  if (apply) await writeListRankUpdates(updates);
};

//1. EVERY ORDER WITH ITS CUTTING, STONE AND STITCHING RECORDS
const orderIds = new Set();
let batch = [];
for await (const order of EmbroideryModel.find({}).sort({ _id: 1 }).lean().cursor()) {
  orderIds.add(String(order._id));
  batch.push(order);
  if (batch.length === BATCH_SIZE) {
    await save(await getListRankUpdates(batch));
    batch = [];
  }
}
await save(await getListRankUpdates(batch));

//2. STEP RECORDS THAT STEP 1 DID NOT REACH. AN ORDER FINDS ITS RECORDS BY ITS ID, SO A RECORD WHOSE LINK IS NOT
//AN ID (E.G. STORED AS TEXT) IS MISSED EVEN WHEN ITS ORDER EXISTS. THERE IS NOTHING TO WORK OUT FROM, SO ITS OWN STATUS DECIDES
const stepModels = [
  { step: ProcessStep.CUTTING, model: CuttingModel },
  { step: ProcessStep.STONE, model: StoneModel },
  { step: ProcessStep.STITCHING, model: StitchingModel },
];
//WHY STEP 1 DID NOT REACH THE RECORD, OR null WHEN IT DID
const getUnreachedReason = (embroideryId) => {
  if (embroideryId == null) return "no order link";
  if (!(embroideryId instanceof mongoose.mongo.ObjectId)) return "order link is not an id";
  return orderIds.has(String(embroideryId)) ? null : "order no longer exists";
};
const orphans = [];
const orphanUpdates = [];
for (const { step, model } of stepModels) {
  const operations = [];
  const docs = await model.collection
    .find({})
    .project({ embroidery_Id: 1, project_status: 1, list_rank: 1, serial_No: 1, design_no: 1, partyName: 1 })
    .toArray();
  docs
    .map((doc) => ({ doc, reason: getUnreachedReason(doc.embroidery_Id) }))
    .filter(({ reason }) => reason)
    .forEach(({ doc, reason }) => {
      orphans.push(`${step} S.N ${doc.serial_No} D# ${doc.design_no} (${doc.partyName}): ${reason}`);
      const rank = doc.project_status === "Completed" ? ListRank.DONE : ListRank.PENDING;
      if (doc.list_rank !== rank) {
        operations.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { list_rank: rank } } } });
      }
    });
  orphanUpdates.push({ step, model, operations });
}
await save(orphanUpdates);

console.log(`Orders checked: ${orderIds.size}`);
console.log("List positions to change:");
[ProcessStep.EMBROIDERY, ...stepModels.map(({ step }) => step)].forEach((step) =>
  console.log(`  ${step.padEnd(10)} ${changed.get(step) || 0}`)
);
if (orphans.length) {
  console.log("\nStep records not linked to an existing order (ranked by their own status):");
  orphans.forEach((line) => console.log(`  - ${line}`));
}

const total = [...changed.values()].reduce((sum, count) => sum + count, 0);
if (!apply) {
  console.log("\nReport only, nothing was saved. Run again with --apply to save.");
} else if (!total) {
  console.log("\nNothing to change.");
} else {
  console.log("\nApplied.");
}

await mongoose.disconnect();
