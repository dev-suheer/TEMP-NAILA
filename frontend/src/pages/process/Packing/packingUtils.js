import {
  formatAmount,
  getAvailableColors,
  PACKING_STATUS,
  STITCH_TYPES,
  toColorKey,
} from "../../../Utils/Common";

//HEADING OF THE PACKING MODAL, E.G. "Stitching · Ali · S.N 12 / D# 611" OR "Order · S.N 12 / D# 611"
export const getPackingModalTitle = (label, record) =>
  [label, record?.partyName, `S.N ${record?.serial_No} / D# ${record?.design_no}`]
    .filter(Boolean)
    .join(" · ");

//WHICH PACKING ICON A RECORD SHOWS ({ tone, clickable }), OR null FOR NO ICON
//RECORDS PACKED BEFORE PACKING ROUNDS WERE TRACKED HAVE NO ROUNDS TO SHOW, SO THEIR ICON IS NOT CLICKABLE
//STITCHING: PACKING IS ITS ONLY NEXT STEP, SO FULLY / PARTIALLY PACKED IS EXACT
export const getStitchingPackingIcon = (stitching) => {
  if (stitching?.packing_status === PACKING_STATUS.PACKED) {
    return { tone: "packed", clickable: !stitching.packed_before_tracking };
  }
  if (stitching?.packing_status === PACKING_STATUS.PARTIALLY_PACKED) {
    return { tone: "partial", clickable: true };
  }
  return null;
};

//CUTTING / STONE: SUITS CAN ALSO GO ON TO THE NEXT STEP, SO THEY ARE JUDGED BY WHAT IS LEFT HERE (NOT SENT ANYWHERE)
//LISTS SEND packing_left, DETAIL PAGES ALREADY HAVE THE RECORD'S AVAILABILITY
export const getStepPackingIcon = (record) => {
  const left = record?.packing_left ?? record?.processAvailability?.available;
  if (!(record?.packed_quantity > 0) || typeof left !== "number") return null;
  const isDone = record.project_status === "Completed" && left <= 0;
  return { tone: isDone ? "packed" : "partial", clickable: true };
};

//ORDER: WHOLE-ORDER PROGRESS WORKED OUT BY THE SERVER (packing_status, packing_legacy)
export const getOrderPackingIcon = (order) => {
  if (order?.packing_status === PACKING_STATUS.PACKED) {
    return { tone: "packed", clickable: !order.packing_legacy };
  }
  if (order?.packing_status === PACKING_STATUS.PARTIALLY_PACKED) {
    return { tone: "partial", clickable: true };
  }
  return null;
};

export const canSendForward = (embroidery, availability) =>
  !embroidery?.next_steps?.packing ||
  (!!embroidery?.packing_tracked && Number(availability?.available || 0) > 0);

export const getSkipPackingRows = (availability, shirt = []) => {
  const getCategory = (color) =>
    (shirt.find((item) => item.color === color) || shirt[0])?.category || "";

  if (availability?.byColor?.length) {
    return getAvailableColors(availability).map((item) => ({
      category: getCategory(item.color),
      color: item.color,
      available: item.available,
      received: item.available,
    }));
  }

  return [...new Map(shirt.map((item) => [item.color, item])).values()].map(
    (item) => ({ category: item.category, color: item.color, received: "" })
  );
};

export const toPackingRow = (item, received) => ({
  id: item.id,
  return_quantity: received,
  cost_price: item.cost_price,
  sale_price: item.sale_price,
  category: item.category,
  color: item.color,
  stitch_type: STITCH_TYPES.UNSTITCHED,
  b_pair_quantity: "",
  b_pair_sale_price: "",
});

//E.G. "Round 2": THE HOW-MANYTH PACKING FROM ITS SOURCE RECORD
export const getRoundLabel = (packing) => `Round ${packing.round_no}`;

//E.G. "Stitching · Ali · Round 2"
export const getPackingSourceLabel = (packing) =>
  [
    packing.source_step,
    packing.source_partyName || packing.stitching_partyName,
    packing.round_no && getRoundLabel(packing),
  ]
    .filter(Boolean)
    .join(" · ");

const SOURCE_DETAIL_PAGES = {
  Embroidery: "embroidery-details",
  Cutting: "cutting-details",
  Stone: "stones-details",
  Stitching: "stitching-details",
};

//DETAIL PAGE OF THE STEP A PACKING WAS PACKED FROM
export const getPackingSourcePath = (packing) => {
  const page = SOURCE_DETAIL_PAGES[packing.source_step];
  return page && packing.source_id ? `/dashboard/${page}/${packing.source_id}` : null;
};

//THE ROUND A NEW PACKING FROM THIS RECORD WILL BE, AND HOW MUCH IS LEFT TO PACK
export const getNextRound = (availability) => ({
  no: Math.max(0, ...(availability?.packings || []).map((packing) => packing.round_no || 0)) + 1,
  available: Number(availability?.available || 0),
  capacity: Number(availability?.capacity || 0),
});

//STITCHING ROWS FOR ONE PACKING ROUND: THE QUANTITY CHOSEN FOR EACH COLOR (OR ALL THAT IS LEFT),
//SPREAD OVER THE ROWS OF THAT COLOR. ROWS WITH NOTHING TO PACK ARE LEFT OUT
export const getStitchingRoundRows = (rows = [], packRows) => {
  const chosen =
    packRows &&
    new Map(packRows.map((row) => [toColorKey(row.color), Number(row.quantity) || 0]));
  return rows
    .map((item) => {
      const left = Math.max((Number(item.recieved) || 0) - (Number(item.packed_quantity) || 0), 0);
      if (!chosen) return toPackingRow(item, left);
      const key = toColorKey(item.color);
      const quantity = Math.min(chosen.get(key) || 0, left);
      chosen.set(key, (chosen.get(key) || 0) - quantity);
      return toPackingRow(item, quantity);
    })
    .filter((row) => row.return_quantity > 0);
};

export const getRowQuantities = (item) => {
  const received = Number(item?.return_quantity) || 0;
  const bPair = item?.b_pair_quantity === "" ? 0 : Number(item?.b_pair_quantity);
  const validBPair = Number.isInteger(bPair) && bPair >= 0 && bPair <= received;
  return { received, bPair: validBPair ? bPair : 0, validBPair };
};

export const isPackingRowInvalid = (item) => {
  const { received, bPair, validBPair } = getRowQuantities(item);
  if (!validBPair) return true;
  const main = received - bPair;
  if ((main > 0 || bPair === 0) && (!Number(item?.cost_price) || !Number(item?.sale_price))) {
    return true;
  }
  return bPair > 0 && !Number(item?.b_pair_sale_price);
};

export const getPartyKey = (party) =>
  `${party.process_step}:${party.process_id}`;

//CALENDER IS BILLED PER METER, SO A PER SUIT LABOUR DEDUCTION DOES NOT APPLY
export const canDeductLabour = (party) => !party.unit;

//PENALTY = (B PAIR QTY + LABOUR QTY) x PARTY RATE + ADDITIONAL COST (SAME AS THE SERVER)
//LABOUR QTY = ALREADY DAMAGED SUITS THE PARTY WORKED ON, SO IT IS NOT PAID FOR THEM
export const getPartyPenalty = (party, values = {}, totalBPairQuantity = 0) => {
  const quantityText = values.quantity ?? "";
  const labourText = values.labour_quantity ?? "";
  const additionalText = values.additional_cost ?? "";
  const quantity = quantityText === "" ? 0 : Number(quantityText);
  const labourInput = labourText === "" ? 0 : Number(labourText);
  const additional_cost = additionalText === "" ? 0 : Number(additionalText);
  const validQuantity = Number.isInteger(quantity) && quantity >= 0;
  const damaged = validQuantity ? quantity : 0;
  const validLabour =
    !canDeductLabour(party) ||
    (Number.isInteger(labourInput) &&
      labourInput >= 0 &&
      labourInput <= totalBPairQuantity - damaged);
  const labour_quantity = canDeductLabour(party) && validLabour ? labourInput : 0;
  const validAdditional = Number.isFinite(additional_cost) && additional_cost >= 0;
  const assigned = damaged + labour_quantity > 0;
  const penalty_amount = Math.round((damaged + labour_quantity) * (party.rate || 0));
  const additional = damaged > 0 && validAdditional ? additional_cost : 0;

  return {
    quantity: damaged,
    labour_quantity,
    additional_cost: additional,
    penalty_amount,
    total_penalty: penalty_amount + additional,
    invalidQuantity: !validQuantity,
    invalidLabour: !validLabour,
    invalidAdditional: damaged > 0 && !validAdditional,
    valid:
      validQuantity &&
      validLabour &&
      (!assigned || (party.bill_generated && (damaged === 0 || validAdditional))),
  };
};

//E.G. "3 × 500 = 1,500", "3 labour × 100 = 300" OR "(2 + 3 labour) × 100 = 500"
export const getPenaltyBreakdown = ({ quantity, labour_quantity = 0, rate, penalty_amount }) => {
  const labour = labour_quantity > 0 ? `${labour_quantity} labour` : "";
  const units = quantity > 0 && labour ? `(${quantity} + ${labour})` : labour || quantity;
  return `${units} × ${rate} = ${formatAmount(penalty_amount)}`;
};

export const getPenaltyStatus = (parties, penaltyValues, totalBPairQuantity) => {
  const rows = parties.map((party) => ({
    party,
    ...getPartyPenalty(party, penaltyValues[getPartyKey(party)], totalBPairQuantity),
  }));
  const assignedRows = rows.filter((row) => row.quantity > 0 || row.labour_quantity > 0);
  const assignedQuantity = assignedRows.reduce((total, row) => total + row.quantity, 0);
  const totalPenalty = assignedRows.reduce((total, row) => total + row.total_penalty, 0);

  return {
    rows,
    assignedRows,
    assignedQuantity,
    totalPenalty,
    isComplete:
      totalBPairQuantity === 0 ||
      (assignedQuantity === totalBPairQuantity && rows.every((row) => row.valid)),
  };
};
