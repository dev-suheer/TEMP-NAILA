//ONE-TIME: RENAMES THE CASH PAYMENT METHOD FROM "cashSale" TO "Cash" EVERYWHERE IN THE DATABASE.
//EVERY DOCUMENT OF EVERY COLLECTION IS SCANNED, SO NO PLACE THE OLD NAME IS SAVED CAN BE MISSED:
//  - A VALUE THAT IS EXACTLY cashSale (payment_Method, THE PAYMENT METHOD NAME, BUYER LEDGER ROWS) BECOMES Cash
//  - A FIELD NAMED cashSale (DAILY SALE CASH TOTAL, VIRTUAL ACCOUNTS) IS RENAMED TO Cash, ITS AMOUNT IS KEPT
//  - TEXT THAT HAS IT AS A WORD (E.G. "cashSale/note", "Check Cashed P.M/cashSale") GETS THAT WORD REPLACED
//RUN WITH THE BACKEND STOPPED, RIGHT BEFORE STARTING THE CODE THAT USES "Cash"
//REPORT: node --env-file .env scripts/renameCashSaleToCash.js
//APPLY:  node --env-file .env scripts/renameCashSaleToCash.js --apply
import mongoose from "mongoose";
import { PaymentMethodModel } from "../models/PaymentMethods/PaymentMethodModel.js";
import { PaymentMethod } from "../enums/PaymentMethod.js";

const apply = process.argv.includes("--apply");
const OLD_NAME = "cashSale";
const NEW_NAME = PaymentMethod.CASH;
//THE OLD NAME AS A WORD OF A TEXT (NOT A PART OF A LONGER WORD LIKE "cashSales")
const OLD_WORD = new RegExp(`(?<![A-Za-z])${OLD_NAME}(?![A-Za-z])`, "g");
//OTHER SPELLINGS ("cashsale", "Cash Sale") ARE ONLY SHOWN, NOT CHANGED
const OTHER_SPELLING = /cash\s*sale/i;

const isPlainObject = (value) => value?.constructor === Object;
//A KEY WITH A DOT OR STARTING WITH $ CAN NOT BE WRITTEN AS A PATH
const isSafeKey = (key) => typeof key === "number" || (!key.includes(".") && !key.startsWith("$"));
//"credit_debit_history.4.particular" IS SHOWN AS "credit_debit_history[].particular"
const toPattern = (path) =>
  path.reduce(
    (pattern, key) => (typeof key === "number" ? `${pattern}[]` : pattern ? `${pattern}.${key}` : key),
    ""
  );

//EVERY USE OF THE OLD NAME IN ONE DOCUMENT
const findInDocument = (doc) => {
  const changes = [];
  const problems = [];
  const spellings = [];
  const addChange = (change) => {
    if (change.path[0] === "_id" || ![...change.path, ...(change.to || [])].every(isSafeKey)) {
      problems.push({ path: change.path, text: "is inside a field that can not be updated by path" });
    } else {
      changes.push(change);
    }
  };
  const visit = (value, path) => {
    if (typeof value === "string") {
      if (value === OLD_NAME) {
        addChange({ type: "value", path, from: value, value: NEW_NAME });
      } else if (value.includes(OLD_NAME)) {
        const replaced = value.replace(OLD_WORD, NEW_NAME);
        if (replaced.includes(OLD_NAME)) {
          problems.push({ path, text: `has "${OLD_NAME}" inside another word: "${value}"` });
        } else {
          addChange({ type: "text", path, from: value, value: replaced });
        }
      } else if (OTHER_SPELLING.test(value)) {
        spellings.push({ path, text: value });
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...path, index]));
      return;
    }
    if (!isPlainObject(value)) return;
    for (const [key, child] of Object.entries(value)) {
      const childPath = [...path, key];
      if (key === OLD_NAME) {
        if (Object.hasOwn(value, NEW_NAME)) {
          problems.push({ path: childPath, text: `is next to a "${NEW_NAME}" field already, renaming would overwrite it` });
        } else if (isPlainObject(child) || Array.isArray(child) || String(child).includes(OLD_NAME)) {
          problems.push({ path: childPath, text: "is a field that holds more than an amount" });
        } else {
          addChange({ type: "key", path: childPath, to: [...path, NEW_NAME], value: child });
        }
        continue;
      }
      if (key.includes(OLD_NAME)) {
        problems.push({ path: childPath, text: `is a field named "${key}"` });
      } else if (OTHER_SPELLING.test(key)) {
        spellings.push({ path: childPath, text: `field "${key}"` });
      }
      visit(child, childPath);
    }
  };
  visit(doc, []);
  return { changes, problems, spellings };
};

//ONE UPDATE PER DOCUMENT. EVERY OLD VALUE IS PART OF THE FILTER, SO A DOCUMENT THAT CHANGED SINCE
//THE SCAN IS NOT MATCHED AND THE WHOLE RUN IS CANCELLED
const toUpdate = (id, changes) => {
  const filter = { _id: id };
  const $set = {};
  const $unset = {};
  for (const change of changes) {
    const path = change.path.join(".");
    if (change.type === "key") {
      const to = change.to.join(".");
      filter[path] = { $exists: true };
      filter[to] = { $exists: false };
      $set[to] = change.value;
      $unset[path] = "";
    } else {
      filter[path] = change.from;
      $set[path] = change.value;
    }
  }
  return { updateOne: { filter, update: Object.keys($unset).length ? { $set, $unset } : { $set } } };
};

const listCollections = async () =>
  (await mongoose.connection.db.listCollections({ type: "collection" }, { nameOnly: true }).toArray())
    .map(({ name }) => name)
    .filter((name) => !name.startsWith("system."))
    .sort();

//READS EVERY DOCUMENT OF EVERY COLLECTION
const scanDatabase = async () => {
  const plans = [];
  const changed = new Map();
  const problems = [];
  const spellings = new Map();
  let scanned = 0;
  for (const name of await listCollections()) {
    const ops = [];
    const fields = new Set();
    for await (const doc of mongoose.connection.db.collection(name).find({}, { batchSize: 1000 })) {
      scanned++;
      const found = findInDocument(doc);
      found.problems.forEach(({ path, text }) =>
        problems.push(`${name} (_id ${doc._id}) / ${toPattern(path)} ${text}`)
      );
      found.spellings.forEach(({ path, text }) => {
        const key = `${name} / ${toPattern(path)}`;
        const seen = spellings.get(key) || { count: 0, example: text };
        spellings.set(key, { ...seen, count: seen.count + 1 });
      });
      if (!found.changes.length) continue;
      ops.push(toUpdate(doc._id, found.changes));
      found.changes.forEach((change) => {
        fields.add(change.path[0]);
        const target =
          change.type === "key"
            ? `-> ${toPattern(change.to)} (field renamed)`
            : change.type === "text"
            ? "(word inside a text)"
            : "";
        const key = `${name} / ${toPattern(change.path)} ${target}`.trim();
        const seen = changed.get(key) || {
          count: 0,
          example: change.type === "text" ? `"${change.from}" -> "${change.value}"` : "",
        };
        changed.set(key, { ...seen, count: seen.count + 1 });
      });
    }
    if (ops.length) plans.push({ name, ops, fields: [...fields] });
  }
  return { plans, changed, problems, spellings, scanned };
};

await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, autoCreate: false });

const { plans, changed, problems, spellings, scanned } = await scanDatabase();
//THE PAYMENT METHOD NAME IS CHECKED WITHOUT CASE, LIKE WHEN A PAYMENT METHOD IS CREATED.
//ONCE THE OLD ONE IS RENAMED, "Cash" EXISTING IS EXPECTED (THE SCRIPT WAS ALREADY APPLIED)
const [oldMethod, takenMethods] = await Promise.all([
  PaymentMethodModel.collection.findOne({ name: OLD_NAME }),
  PaymentMethodModel.collection.find({ name: { $regex: `^${NEW_NAME}$`, $options: "i" } }).toArray(),
]);
if (oldMethod) {
  takenMethods.forEach((method) => problems.push(`A payment method named "${method.name}" already exists`));
}

const documentCount = plans.reduce((total, plan) => total + plan.ops.length, 0);
console.log(`Renaming "${OLD_NAME}" to "${NEW_NAME}": scanned ${scanned} documents\n`);
if (changed.size) {
  console.log("Will change (collection / field: count):");
  changed.forEach(({ count, example }, key) => console.log(`  ${key}: ${count}${example ? `   e.g. ${example}` : ""}`));
}
console.log(`\nDocuments to update: ${documentCount} in ${plans.length} collections`);
if (spellings.size) {
  console.log("\nOther spellings of cash sale (left as they are):");
  spellings.forEach(({ count, example }, key) => console.log(`  - ${key}: ${count}   e.g. ${example}`));
}
if (problems.length) {
  console.log("\nProblems (fix these first):");
  problems.forEach((problem) => console.log(`  - ${problem}`));
}

if (!apply) {
  console.log("\nReport only. Run again with --apply to save.");
} else if (problems.length) {
  console.log("\nNot applied: fix the problems above first.");
  process.exitCode = 1;
} else if (!documentCount) {
  console.log("\nNothing to change.");
} else {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const { name, ops, fields } of plans) {
        const collection = mongoose.connection.db.collection(name);
        //WORKS ON THE STORED DOCUMENTS (DRIVER) SO OLD RECORDS KEEP THEIR updatedAt
        const result = await collection.bulkWrite(ops, { session });
        if (result.matchedCount !== ops.length || result.modifiedCount !== ops.length) {
          throw new Error(
            `${name}: ${ops.length - result.matchedCount} documents changed since the scan. Nothing was saved, run again`
          );
        }
        //THE UPDATED DOCUMENTS MAY NOT USE THE OLD NAME ANY MORE
        const updated = await collection
          .find(
            { _id: { $in: ops.map((op) => op.updateOne.filter._id) } },
            { session, projection: Object.fromEntries(fields.map((field) => [field, 1])) }
          )
          .toArray();
        const left = updated.filter((doc) => findInDocument(doc).changes.length);
        if (updated.length !== ops.length || left.length) {
          throw new Error(`${name}: "${OLD_NAME}" is still used after the update. Nothing was saved`);
        }
      }
    });
  } finally {
    await session.endSession();
  }
  const after = await scanDatabase();
  const left = after.plans.reduce((total, plan) => total + plan.ops.length, 0);
  console.log(
    left
      ? `\nApplied, but ${left} documents still use "${OLD_NAME}". Run the report again.`
      : `\nApplied. Checked again: "${OLD_NAME}" is not used anywhere.`
  );
  if (left) process.exitCode = 1;
}

await mongoose.disconnect();
