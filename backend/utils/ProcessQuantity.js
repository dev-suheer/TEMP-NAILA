import { CalenderModel } from "../models/Process/CalenderModel.js";
import { CuttingModel } from "../models/Process/CuttingModel.js";
import { EmbroideryModel } from "../models/Process/EmbroideryModel.js";
import { PackingModel } from "../models/Process/PackingModel.js";
import { StitchingModel } from "../models/Process/StitchingModel.js";
import { StoneModel } from "../models/Process/StoneModel.js";
import { PackingStatus } from "../enums/PackingStatus.js";

export const ProcessStep = {
  EMBROIDERY: "Embroidery",
  CALENDER: "Calender",
  CUTTING: "Cutting",
  STONE: "Stone",
  STITCHING: "Stitching",
  PACKING: "Packing",
};

export const toProcessNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const sumStoneQuantity = (items) =>
  (items || []).reduce((total, item) => total + toProcessNumber(item?.quantity), 0);

export const sumPackingQuantity = (items = []) =>
  items.reduce((total, item) => total + toProcessNumber(item?.return_quantity), 0);

const toColorKey = (color) => String(color || "").trim().toLowerCase();

const isLegacyEmbroiderySource = (sourceStep) => sourceStep === ProcessStep.EMBROIDERY;

const sourceQuery = ({ sourceStep, sourceId, targetStep }) => {
  const query = [{ source_step: sourceStep, source_id: sourceId }];

  if (sourceStep === ProcessStep.CUTTING && targetStep === ProcessStep.STONE) {
    query.push({ cuttingId: String(sourceId) });
  }

  if (isLegacyEmbroiderySource(sourceStep)) {
    query.push({
      embroidery_Id: sourceId,
      $or: [{ source_id: null }, { source_id: { $exists: false } }],
    });
  }

  return { $or: query };
};

//IN-MEMORY TWIN OF sourceQuery, FOR RECORDS ALREADY LOADED. KEEP BOTH IN SYNC
const isFromSource = (doc, { sourceStep, sourceId, targetStep }) => {
  const id = String(sourceId);
  if (doc.source_step === sourceStep && String(doc.source_id) === id) return true;
  if (sourceStep === ProcessStep.CUTTING && targetStep === ProcessStep.STONE && doc.cuttingId === id) {
    return true;
  }
  return (
    isLegacyEmbroiderySource(sourceStep) &&
    String(doc.embroidery_Id) === id &&
    doc.source_id == null
  );
};

const getSourceRecord = async ({ sourceStep, sourceId, session }) => {
  if (!sourceStep || !sourceId) {
    throw new Error("Previous step reference is required");
  }

  if (sourceStep === ProcessStep.EMBROIDERY) {
    const source = await EmbroideryModel.findById(sourceId).session(session);
    if (!source) throw new Error("Previous embroidery record not found");
    return source;
  }

  if (sourceStep === ProcessStep.CALENDER) {
    const source = await CalenderModel.findById(sourceId).session(session);
    if (!source) throw new Error("Previous calender record not found");
    return source;
  }

  if (sourceStep === ProcessStep.CUTTING) {
    const source = await CuttingModel.findById(sourceId).session(session);
    if (!source) throw new Error("Previous cutting record not found");
    return source;
  }

  if (sourceStep === ProcessStep.STONE) {
    const source = await StoneModel.findById(sourceId).session(session);
    if (!source) throw new Error("Previous stone record not found");
    return source;
  }

  if (sourceStep === ProcessStep.STITCHING) {
    const source = await StitchingModel.findById(sourceId).session(session);
    if (!source) throw new Error("Previous stitching record not found");
    return source;
  }

  throw new Error("Invalid previous process step");
};

const getSourceQuantity = (sourceStep, source) => {
  if (sourceStep === ProcessStep.EMBROIDERY) {
    return {
      capacity: toProcessNumber(source.T_Recieved_Suit),
      colorRows: (source.shirt || []).map((item) => ({
        color: item?.color,
        quantity: item?.received,
      })),
    };
  }

  if (sourceStep === ProcessStep.CALENDER) {
    return { capacity: toProcessNumber(source.r_quantity), colorRows: [] };
  }

  if (sourceStep === ProcessStep.CUTTING) {
    return {
      capacity: toProcessNumber(source.r_quantity),
      colorRows: (source.category_quantity || []).map((item) => ({
        color: item?.color,
        quantity: item?.received,
      })),
    };
  }

  if (sourceStep === ProcessStep.STONE) {
    const colorRows = (source.category_quantity || []).map((item) => ({
      color: item?.color,
      quantity: item?.recieved_Data?.r_total,
    }));
    return {
      capacity:
        toProcessNumber(source.r_quantity) ||
        colorRows.reduce((total, item) => total + toProcessNumber(item.quantity), 0),
      colorRows,
    };
  }

  if (sourceStep === ProcessStep.STITCHING) {
    return {
      capacity: toProcessNumber(source.r_quantity),
      colorRows: (source.suits_category || []).map((item) => ({
        color: item?.color,
        quantity: item?.recieved,
      })),
    };
  }

  return { capacity: 0, colorRows: [] };
};

const allocationTargets = [
  {
    step: ProcessStep.CUTTING,
    model: CuttingModel,
    getTotal: (doc) => toProcessNumber(doc.T_Quantity),
    getRows: (doc) => doc.category_quantity,
    rowQuantity: "quantity",
  },
  {
    step: ProcessStep.STONE,
    model: StoneModel,
    getTotal: (doc) => sumStoneQuantity(doc.category_quantity),
    getRows: (doc) => doc.category_quantity,
    rowQuantity: "quantity",
  },
  {
    step: ProcessStep.STITCHING,
    model: StitchingModel,
    getTotal: (doc) => toProcessNumber(doc.Quantity),
    getRows: (doc) => doc.suits_category,
    rowQuantity: "quantity_in_no",
  },
  {
    step: ProcessStep.PACKING,
    model: PackingModel,
    getTotal: (doc) => toProcessNumber(doc.total_received),
    getRows: (doc) => doc.rows,
    rowQuantity: "received",
  },
];

//WHAT WENT OUT OF ONE SOURCE, FROM ITS NEXT-STEP RECORDS (ONE LIST PER allocationTargets ENTRY)
//BY STEP: HOW MUCH WENT TO EACH NEXT STEP. PACKINGS: THE PACKING ROUNDS, OLDEST FIRST
const getAllocation = (docsByTarget) => {
  const allocated = { total: 0, byColor: new Map(), byStep: {}, packings: [] };
  allocationTargets.forEach((target, index) => {
    docsByTarget[index].forEach((doc) => {
      const quantity = target.getTotal(doc);
      allocated.total += quantity;
      allocated.byStep[target.step] = (allocated.byStep[target.step] || 0) + quantity;
      if (target.step === ProcessStep.PACKING) allocated.packings.push(doc);
      (target.getRows(doc) || []).forEach((row) => {
        const key = toColorKey(row?.color);
        allocated.byColor.set(
          key,
          (allocated.byColor.get(key) || 0) + toProcessNumber(row?.[target.rowQuantity])
        );
      });
    });
  });

  allocated.packings.sort(
    (a, b) => (a.round_no || 0) - (b.round_no || 0) || a.createdAt - b.createdAt
  );
  return allocated;
};

export const getAllocatedFromSource = async ({ sourceStep, sourceId, session }) => {
  if (!sourceStep || !sourceId) return getAllocation(allocationTargets.map(() => []));

  const docsByTarget = await Promise.all(
    allocationTargets.map((target) =>
      target.model
        .find(sourceQuery({ sourceStep, sourceId, targetStep: target.step }))
        .session(session)
    )
  );
  return getAllocation(docsByTarget);
};

const getColorAvailability = ({ capacity, colorRows, allocatedByColor }) => {
  const colors = new Map();
  colorRows.forEach(({ color, quantity }) => {
    const key = toColorKey(color);
    if (!key) return;
    const entry = colors.get(key) || { color, capacity: 0 };
    entry.capacity += toProcessNumber(quantity);
    colors.set(key, entry);
  });

  const colorTotal = [...colors.values()].reduce(
    (total, entry) => total + entry.capacity,
    0
  );
  if (!colors.size || colorTotal !== capacity) return [];

  return [...colors].map(([key, entry]) => {
    const allocated = allocatedByColor.get(key) || 0;
    return {
      color: entry.color,
      capacity: entry.capacity,
      allocated,
      available: entry.capacity - allocated,
    };
  });
};

//THE OLD ONE-SHOT packed FLAG, STILL ON RECORDS UNTIL scripts/backfillPackingRounds.js REMOVES IT.
//THE OLD CODE ONLY SET IT AFTER PACKING THE WHOLE STITCHING, SO IT ALWAYS MEANS FULLY PACKED
const hasOldPackedFlag = (stitching) =>
  (typeof stitching?.get === "function" ? stitching.get("packed") : stitching?.packed) === true;

//PACKED IN ONE GO BEFORE ROUNDS WERE TRACKED, SO NO PACKING RECORD SHOWS IT
export const isPackedBeforeTracking = (stitching, roundCount) =>
  !!stitching?.packed_before_tracking || (roundCount === 0 && hasOldPackedFlag(stitching));

//ANY PACKING DONE FROM THIS STITCHING, IN ROUNDS OR IN ONE GO BEFORE ROUNDS
export const isStitchingPacked = (stitching) =>
  stitching.packed_quantity > 0 || !!stitching.packed_before_tracking || hasOldPackedFlag(stitching);

//source CAN BE PASSED WHEN THE CALLER HAS ALREADY LOADED IT
export const getProcessAvailability = async ({ sourceStep, sourceId, session, source: loaded }) => {
  const source = loaded || (await getSourceRecord({ sourceStep, sourceId, session }));
  const allocated = await getAllocatedFromSource({ sourceStep, sourceId, session });
  return toAvailability({ sourceStep, source, allocated });
};

//AVAILABILITY OF ONE SOURCE RECORD FROM WHAT WENT OUT OF IT. PURE, SO A WHOLE ORDER CAN BE WORKED OUT IN MEMORY
const toAvailability = ({ sourceStep, source, allocated }) => {
  const { capacity, colorRows } = getSourceQuantity(sourceStep, source);
  const packedBeforeTracking = isPackedBeforeTracking(source, allocated.packings.length);

  //NOTHING IS LEFT, THOUGH NO PACKING RECORD SAYS SO: EVERY COLOR COUNTS AS PACKED
  if (packedBeforeTracking) {
    allocated.total = capacity;
    allocated.byStep[ProcessStep.PACKING] = capacity;
    allocated.byColor = new Map();
    colorRows.forEach(({ color, quantity }) => {
      const key = toColorKey(color);
      allocated.byColor.set(key, (allocated.byColor.get(key) || 0) + toProcessNumber(quantity));
    });
  }

  return {
    capacity,
    allocated: allocated.total,
    available: capacity - allocated.total,
    byColor: getColorAvailability({
      capacity,
      colorRows,
      allocatedByColor: allocated.byColor,
    }),
    byStep: allocated.byStep,
    packings: allocated.packings,
  };
};

const assertColorAvailability = (byColor, requestedRows = []) => {
  if (!byColor.length) return;

  const requested = new Map();
  requestedRows.forEach(({ color, quantity }) => {
    const key = toColorKey(color);
    const entry = requested.get(key) || { color, quantity: 0 };
    entry.quantity += toProcessNumber(quantity);
    requested.set(key, entry);
  });

  for (const [key, entry] of requested) {
    const colorAvailability = byColor.find((item) => toColorKey(item.color) === key);
    if (!colorAvailability) {
      throw new Error(`${entry.color} was not received in previous step`);
    }
    if (entry.quantity > colorAvailability.available) {
      throw new Error(
        `Invalid quantity for ${colorAvailability.color}. Available quantity is ${colorAvailability.available}`
      );
    }
  }
};

export const assertSourceCanCreateNextStep = async ({
  sourceStep,
  sourceId,
  requestedQuantity,
  requestedRows,
  session,
}) => {
  const source = await getSourceRecord({ sourceStep, sourceId, session });
  if (source.project_status !== "Completed") {
    throw new Error("Previous step must be completed before creating next step");
  }

  const availability = await getProcessAvailability({
    sourceStep,
    sourceId,
    session,
    source,
  });

  if (availability.capacity <= 0) {
    throw new Error("No received quantity found in previous step");
  }

  const requested = toProcessNumber(requestedQuantity);
  if (requested <= 0) throw new Error("Invalid quantity for next step");

  if (requested > availability.available) {
    throw new Error(
      `Invalid quantity. Available quantity from previous step is ${availability.available}`
    );
  }

  assertColorAvailability(availability.byColor, requestedRows);

  return { ...availability, source };
};

export const assertSourceHasNoNextSteps = async ({ sourceStep, sourceId, session }) => {
  const allocated = await getAllocatedFromSource({ sourceStep, sourceId, session });
  if (allocated.total > 0) {
    throw new Error(
      `Next steps were created from this ${sourceStep.toLowerCase()}. Delete them first`
    );
  }
};

export const buildProcessAvailability = async ({
  sourceStep,
  sourceId,
  session,
}) => {
  return await getProcessAvailability({
    sourceStep,
    sourceId,
    session,
  });
};

const sumPacked = (packings) =>
  packings.reduce((total, packing) => total + toProcessNumber(packing.total_received), 0);

const getPackingStatus = (packed, received) => {
  if (packed <= 0) return PackingStatus.NOT_PACKED;
  return packed >= received ? PackingStatus.PACKED : PackingStatus.PARTIALLY_PACKED;
};

//SPREADS THE PACKED QUANTITY OF EACH COLOR OVER THE STITCHING ROWS OF THAT COLOR
//E.G. { "suits_category.0.packed_quantity": 30, "suits_category.1.packed_quantity": 20 }
const getStitchingRowsPacked = (stitching, packedByColor) => {
  const left = new Map(packedByColor);
  const values = {};
  ["suits_category", "dupatta_category"].forEach((category) => {
    const rows = stitching[category] || [];
    rows.forEach((row, index) => {
      const key = toColorKey(row.color);
      const isLastOfColor = !rows
        .slice(index + 1)
        .some((next) => toColorKey(next.color) === key);
      const packed = isLastOfColor
        ? left.get(key) || 0
        : Math.min(left.get(key) || 0, toProcessNumber(row.recieved));
      values[`${category}.${index}.packed_quantity`] = packed;
      left.set(key, (left.get(key) || 0) - packed);
    });
  });
  return values;
};

//THE STORED PACKING COUNTERS, AS $set VALUES. PURE, SO THE BACKFILL SCRIPT CALCULATES THEM THE SAME WAY
export const getStitchingPackingValues = (stitching, packings) => {
  const packedByColor = new Map();
  const addPacked = (color, quantity) => {
    const key = toColorKey(color);
    packedByColor.set(key, (packedByColor.get(key) || 0) + toProcessNumber(quantity));
  };
  if (stitching.packed_before_tracking) {
    [...(stitching.suits_category || []), ...(stitching.dupatta_category || [])].forEach((row) =>
      addPacked(row.color, row.recieved)
    );
  } else {
    packings.forEach((packing) => packing.rows.forEach((row) => addPacked(row.color, row.received)));
  }
  const received = toProcessNumber(stitching.r_quantity);
  const packed = stitching.packed_before_tracking ? received : sumPacked(packings);
  return {
    ...getStitchingRowsPacked(stitching, packedByColor),
    packed_quantity: packed,
    packing_status: stitching.packed_before_tracking
      ? PackingStatus.PACKED
      : getPackingStatus(packed, received),
  };
};
export const getSourcePackingValues = (packings) => ({ packed_quantity: sumPacked(packings) });
export const getOrderPackingValues = (packings) => ({
  packed_quantity: sumPacked(packings),
  packing_count: packings.length,
});

//STEPS THAT STORE HOW MUCH WAS PACKED DIRECTLY FROM THEM (STITCHING ALSO STORES PER COLOR AND STATUS)
export const packedSourceModels = {
  [ProcessStep.CUTTING]: CuttingModel,
  [ProcessStep.STONE]: StoneModel,
};

//RECALCULATES THE STORED PACKING COUNTERS FROM THE PACKING RECORDS, SO LISTS CAN READ THEM
//CALLED IN THE SAME TRANSACTION AS EVERY PACKING CREATE/DELETE
//ONLY THESE FIELDS ARE WRITTEN, SO AN OLD RECORD THAT FAILS A NEWER VALIDATOR CANNOT BLOCK IT
export const syncPackingCounters = async ({ sourceStep, sourceId, embroidery_Id, session }) => {
  const findPackings = (query, fields) =>
    PackingModel.find(query).select(fields).lean().session(session);

  if (sourceStep === ProcessStep.STITCHING) {
    const stitching = await StitchingModel.findById(sourceId).lean().session(session);
    if (stitching) {
      const packings = await findPackings(
        { source_step: sourceStep, source_id: sourceId },
        "rows total_received"
      );
      await StitchingModel.updateOne(
        { _id: sourceId },
        { $set: getStitchingPackingValues(stitching, packings) }
      ).session(session);
    }
  } else if (packedSourceModels[sourceStep]) {
    const packings = await findPackings(
      { source_step: sourceStep, source_id: sourceId },
      "total_received"
    );
    await packedSourceModels[sourceStep]
      .updateOne({ _id: sourceId }, { $set: getSourcePackingValues(packings) })
      .session(session);
  }

  if (embroidery_Id) {
    const orderPackings = await findPackings({ embroidery_Id }, "total_received");
    await EmbroideryModel.updateOne(
      { _id: embroidery_Id },
      { $set: getOrderPackingValues(orderPackings) }
    ).session(session);
  }
};

const orderStepModels = [
  { step: ProcessStep.CUTTING, model: CuttingModel },
  { step: ProcessStep.STONE, model: StoneModel },
  { step: ProcessStep.STITCHING, model: StitchingModel },
];

//CREATED BEFORE STEPS STORED WHERE THEIR SUITS CAME FROM, SO WHAT WENT OUT OF THE EARLIER STEP IS UNKNOWN
const hasNoSourceLink = (doc) => doc.source_id == null && !doc.cuttingId;

const groupByOrder = (docs) => {
  const groups = new Map();
  docs.forEach((doc) => {
    const key = String(doc.embroidery_Id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(doc);
  });
  return groups;
};

//PACKING PROGRESS OF WHOLE ORDERS, WORKED OUT IN MEMORY FROM 4 QUERIES (NOT PER ORDER), FOR LISTS AND THE ORDER MODAL
//PACKED: EVERY STEP RECORD IS COMPLETED AND HAS NOTHING LEFT TO SEND ON. PARTIALLY PACKED: PACKING STARTED, NOT FINISHED
//AN ORDER PACKED BEFORE PACKING RECORDS EXISTED, OR WITH A STEP WITHOUT A SOURCE LINK, CAN NOT BE WORKED OUT:
//IT KEEPS THE OLD MEANING (PACKED WHEN IT HAS ANY PACKING) AND IS MARKED legacy
//withRecords ADDS EACH STEP'S NUMBERS AND THE FULL PACKING ROUNDS, FOR THE MODAL
export const getOrdersPackingProgress = async (orders, { session = null, withRecords = false } = {}) => {
  if (!orders.length) return [];
  const inOrders = { embroidery_Id: { $in: orders.map((order) => order._id) } };
  const packingQuery = PackingModel.find(inOrders).session(session);
  const [stepDocs, packings] = await Promise.all([
    Promise.all(
      orderStepModels.map(({ model }) => model.find(inOrders).lean().session(session))
    ),
    withRecords
      ? packingQuery
      : packingQuery.select("embroidery_Id source_step source_id total_received rows round_no createdAt").lean(),
  ]);
  const stepsByOrder = stepDocs.map(groupByOrder);
  const packingsByOrder = groupByOrder(packings);

  return orders.map((order) => {
    const key = String(order._id);
    const orderPackings = packingsByOrder.get(key) || [];
    const children = {
      [ProcessStep.PACKING]: orderPackings,
      ...Object.fromEntries(
        orderStepModels.map(({ step }, index) => [step, stepsByOrder[index].get(key) || []])
      ),
    };
    const records = [
      { step: ProcessStep.EMBROIDERY, doc: order },
      ...orderStepModels.flatMap(({ step }) => children[step].map((doc) => ({ step, doc }))),
    ];
    const legacy =
      (!!order.next_steps?.packing && !order.packing_tracked) ||
      records.some(({ step, doc }) => step !== ProcessStep.EMBROIDERY && hasNoSourceLink(doc));

    const steps = legacy
      ? []
      : records.map(({ step, doc }) => {
          const docsByTarget = allocationTargets.map((target) =>
            children[target.step].filter((child) =>
              isFromSource(child, { sourceStep: step, sourceId: doc._id, targetStep: target.step })
            )
          );
          return {
            step,
            doc,
            availability: toAvailability({ sourceStep: step, source: doc, allocated: getAllocation(docsByTarget) }),
          };
        });

    const hasPacking = orderPackings.length > 0 || (legacy && !!order.next_steps?.packing);
    const isDone = steps.every(
      ({ doc, availability }) => doc.project_status === "Completed" && availability.available <= 0
    );
    const progress = {
      packing_status: !hasPacking
        ? PackingStatus.NOT_PACKED
        : legacy || isDone
          ? PackingStatus.PACKED
          : PackingStatus.PARTIALLY_PACKED,
      legacy,
      ...getOrderPackingValues(orderPackings),
    };
    if (!withRecords) return progress;

    return {
      ...progress,
      steps: steps.map(({ step, doc, availability }) => ({
        step,
        id: String(doc._id),
        partyName: doc.partyName,
        project_status: doc.project_status,
        received: availability.capacity,
        packed: availability.byStep[ProcessStep.PACKING] || 0,
        available: availability.available,
      })),
      packings: [...orderPackings].sort((a, b) => a.createdAt - b.createdAt),
    };
  });
};

const nextStepModels = {
  calender: CalenderModel,
  cutting: CuttingModel,
  stitching: StitchingModel,
  stones: StoneModel,
  packing: PackingModel,
};

export const getActiveNextSteps = async ({ embroidery, session }) => {
  const activeSteps = [];
  for (const [step, model] of Object.entries(nextStepModels)) {
    const hasRecords = await model
      .exists({ embroidery_Id: embroidery._id })
      .session(session);
    if (embroidery.next_steps?.[step] || hasRecords) activeSteps.push(step);
  }
  return activeSteps;
};
