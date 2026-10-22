import { CalenderModel } from "../models/Process/CalenderModel.js";
import { CuttingModel } from "../models/Process/CuttingModel.js";
import { EmbroideryModel } from "../models/Process/EmbroideryModel.js";
import { PackingModel } from "../models/Process/PackingModel.js";
import { StitchingModel } from "../models/Process/StitchingModel.js";
import { StoneModel } from "../models/Process/StoneModel.js";

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

export const sumStoneQuantity = (items = []) =>
  items.reduce((total, item) => total + toProcessNumber(item?.quantity), 0);

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
      colorRows: source.shirt.map((item) => ({
        color: item.color,
        quantity: item.received,
      })),
    };
  }

  if (sourceStep === ProcessStep.CALENDER) {
    return { capacity: toProcessNumber(source.r_quantity), colorRows: [] };
  }

  if (sourceStep === ProcessStep.CUTTING) {
    return {
      capacity: toProcessNumber(source.r_quantity),
      colorRows: source.category_quantity.map((item) => ({
        color: item.color,
        quantity: item.received,
      })),
    };
  }

  if (sourceStep === ProcessStep.STONE) {
    const colorRows = source.category_quantity.map((item) => ({
      color: item.color,
      quantity: item.recieved_Data?.r_total,
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
        color: item.color,
        quantity: item.recieved,
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

export const getAllocatedFromSource = async ({ sourceStep, sourceId, session }) => {
  const allocated = { total: 0, byColor: new Map() };
  if (!sourceStep || !sourceId) return allocated;

  const docsByTarget = await Promise.all(
    allocationTargets.map((target) =>
      target.model
        .find(sourceQuery({ sourceStep, sourceId, targetStep: target.step }))
        .session(session)
    )
  );

  allocationTargets.forEach((target, index) => {
    docsByTarget[index].forEach((doc) => {
      allocated.total += target.getTotal(doc);
      (target.getRows(doc) || []).forEach((row) => {
        const key = toColorKey(row.color);
        allocated.byColor.set(
          key,
          (allocated.byColor.get(key) || 0) + toProcessNumber(row[target.rowQuantity])
        );
      });
    });
  });

  return allocated;
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

export const getProcessAvailability = async ({ sourceStep, sourceId, session }) => {
  const source = await getSourceRecord({ sourceStep, sourceId, session });
  const { capacity, colorRows } = getSourceQuantity(sourceStep, source);
  const allocated = await getAllocatedFromSource({ sourceStep, sourceId, session });

  return {
    capacity,
    allocated: allocated.total,
    available: capacity - allocated.total,
    byColor: getColorAvailability({
      capacity,
      colorRows,
      allocatedByColor: allocated.byColor,
    }),
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

  return availability;
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
