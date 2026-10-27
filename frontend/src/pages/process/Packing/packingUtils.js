import { formatAmount, getAvailableColors, STITCH_TYPES } from "../../../Utils/Common";

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
