import { B_PairModel } from "../../models/Process/B_PairModel.js";
import { B_PairExchangeModel } from "../../models/Process/B_PairExchangeModel.js";
import { SuitsModel } from "../../models/Stock/Suits.Model.js";
import { EmbroideryModel } from "../../models/Process/EmbroideryModel.js";
import { CalenderModel } from "../../models/Process/CalenderModel.js";
import { CuttingModel } from "../../models/Process/CuttingModel.js";
import { StoneModel } from "../../models/Process/StoneModel.js";
import { StitchingModel } from "../../models/Process/StitchingModel.js";
import { BuyersBillsModel } from "../../models/BuyersModel.js";
import { processBillsModel } from "../../models/Process/ProcessBillsModel.js";
import { calculateAccountBalance } from "../../utils/accounting.js";
import { setMongoose } from "../../utils/Mongoose.js";
import mongoose from "mongoose";
import { BillType, B_PAIR_PENALTY_ENTRY } from "../../enums/BillType.js";
import {
  escapeRegex,
  getPaginationParams,
  getTodayDate,
  skuSearchQuery,
  stitchTypeQuery,
  toStitchType,
} from "../../utils/Common.js";
import { ProcessStep } from "../../utils/ProcessQuantity.js";
import { assertSkuFree, getSuitSku, toBPairSku } from "../../utils/SuitSku.js";

const exactMatch = (value) => new RegExp(`^${escapeRegex(value)}$`, "i");

export const addBPairStock = async (
  { d_no, category, color, stitch_type, quantity, sale_price, record },
  session
) => {
  const designNo = Number(d_no);
  const categoryName = String(category || "").trim();
  const colorName = String(color || "").trim();
  const bPairQuantity = Number(quantity);
  const salePrice = Number(sale_price);

  if (!designNo || !categoryName || !colorName) {
    throw new Error("Missing fields for adding B Pair stock");
  }
  if (!Number.isInteger(bPairQuantity) || bPairQuantity <= 0) {
    throw new Error(`Invalid B Pair quantity for D# ${designNo} (${colorName})`);
  }
  if (!(salePrice > 0)) {
    throw new Error(`B Pair sale price is required for D# ${designNo} (${colorName})`);
  }

  const suitWithDNo = await SuitsModel.findOne({ d_no: designNo }).session(session);
  const bPairWithDNo = await B_PairModel.findOne({ d_no: designNo }).session(session);
  const assignedCategory = suitWithDNo?.category || bPairWithDNo?.category;
  if (
    assignedCategory &&
    assignedCategory.trim().toLowerCase() !== categoryName.toLowerCase()
  ) {
    throw new Error(
      `The Design No ${designNo} is already assigned to the category '${assignedCategory}'`
    );
  }

  const recordData = {
    ...record,
    date: getTodayDate(),
    quantity: bPairQuantity,
    sale_price: salePrice,
  };

  const existingBPair = await B_PairModel.findOne({
    d_no: designNo,
    category: exactMatch(categoryName),
    color: exactMatch(colorName),
    stitch_type: stitchTypeQuery(stitch_type),
  }).session(session);

  if (existingBPair) {
    existingBPair.quantity += bPairQuantity;
    existingBPair.sale_price = salePrice;
    existingBPair.all_records.push(recordData);
    await existingBPair.save({ session });
    return existingBPair;
  }

  const sku = toBPairSku(
    await getSuitSku({
      d_no: designNo,
      category: categoryName,
      color: colorName,
      stitch_type,
      session,
    })
  );
  await assertSkuFree(B_PairModel, sku, session);
  const [createdBPair] = await B_PairModel.create(
    [
      {
        d_no: designNo,
        category: categoryName,
        color: colorName,
        stitch_type,
        sku,
        quantity: bPairQuantity,
        sale_price: salePrice,
        all_records: [recordData],
      },
    ],
    { session }
  );
  return createdBPair;
};

const processPartyFields = {
  [ProcessStep.EMBROIDERY]: { model: EmbroideryModel, sent: "T_Suit", received: "T_Recieved_Suit", rate: "per_suit" },
  [ProcessStep.CALENDER]: { model: CalenderModel, sent: "T_Quantity", received: "r_quantity", rate: "rate", unit: "m" },
  [ProcessStep.CUTTING]: { model: CuttingModel, sent: "T_Quantity", received: "r_quantity", rate: "rate" },
  [ProcessStep.STONE]: { model: StoneModel, sent: "T_Quantity", received: "r_quantity", rate: "rate" },
  [ProcessStep.STITCHING]: { model: StitchingModel, sent: "Quantity", received: "r_quantity", rate: "rate" },
};

const getPartySelectFields = (process_step) => {
  const { sent, received, rate } = processPartyFields[process_step];
  return `partyName bill_generated ${sent} ${received} ${rate}`;
};

const toProcessParty = (process_step, doc) => {
  const { sent, received, rate, unit = "" } = processPartyFields[process_step];
  const receivedQuantity = Number(doc[received]) || 0;
  const partyRate = Number(doc[rate]) || 0;
  return {
    process_step,
    process_id: doc._id,
    partyName: doc.partyName,
    sent: Number(doc[sent]) || 0,
    received: receivedQuantity,
    unit,
    rate: partyRate,
    bill_generated: !!doc.bill_generated,
    bill_amount: doc.bill_generated ? Math.round(partyRate * receivedQuantity) : null,
  };
};

export const getProcessPartiesForOrder = async (embroidery_Id, session = null) => {
  const embroidery = await EmbroideryModel.findById(embroidery_Id)
    .select(getPartySelectFields(ProcessStep.EMBROIDERY))
    .session(session);
  if (!embroidery) throw new Error("Embroidery record not found");

  const parties = [toProcessParty(ProcessStep.EMBROIDERY, embroidery)];

  const processSteps = [
    ProcessStep.CALENDER,
    ProcessStep.CUTTING,
    ProcessStep.STONE,
    ProcessStep.STITCHING,
  ];

  for (const process_step of processSteps) {
    const docs = await processPartyFields[process_step].model
      .find({ embroidery_Id })
      .select(getPartySelectFields(process_step))
      .sort({ createdAt: 1 })
      .session(session);
    docs.forEach((doc) => parties.push(toProcessParty(process_step, doc)));
  }

  return parties;
};

export const getPenaltyParties = async ({
  embroidery_Id,
  b_pair_parties,
  total_quantity,
  session,
}) => {
  if (!Array.isArray(b_pair_parties) || b_pair_parties.length === 0) {
    throw new Error("Assign the B Pair suits to the responsible parties");
  }

  const orderParties = await getProcessPartiesForOrder(embroidery_Id, session);
  const selectedKeys = new Set();
  const parties = [];

  for (const selected of b_pair_parties) {
    const key = `${selected?.process_step}:${selected?.process_id}`;
    if (selectedKeys.has(key)) {
      throw new Error("A party is selected more than once");
    }
    selectedKeys.add(key);

    const party = orderParties.find(
      (item) =>
        item.process_step === selected.process_step &&
        String(item.process_id) === String(selected.process_id)
    );
    if (!party) throw new Error("Selected party is not part of this order");

    const quantity = Number(selected.quantity || 0);
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error(`Invalid B Pair quantity for ${party.partyName}`);
    }
    const labour_quantity = Number(selected.labour_quantity || 0);
    if (!Number.isInteger(labour_quantity) || labour_quantity < 0) {
      throw new Error(`Invalid labour quantity for ${party.partyName}`);
    }
    if (quantity + labour_quantity === 0) {
      throw new Error(`Enter a B Pair or labour quantity for ${party.partyName}`);
    }
    //CALENDER IS BILLED PER METER, SO A PER SUIT LABOUR DEDUCTION DOES NOT APPLY
    if (labour_quantity > 0 && party.unit) {
      throw new Error(`Labour deduction is not allowed for ${party.process_step}`);
    }
    if (quantity + labour_quantity > total_quantity) {
      throw new Error(
        `B Pair and labour quantity for ${party.partyName} cannot be more than total B Pair quantity ${total_quantity}`
      );
    }
    const additional_cost = Number(selected.additional_cost || 0);
    if (!Number.isFinite(additional_cost) || additional_cost < 0) {
      throw new Error(`Invalid additional cost for ${party.partyName}`);
    }
    if (!party.bill_generated) {
      throw new Error(
        `Generate the ${party.process_step} bill of ${party.partyName} before adding a penalty`
      );
    }

    const account = await processBillsModel
      .findOne({ process_Category: party.process_step, partyName: party.partyName })
      .select("_id")
      .session(session);
    if (!account) {
      throw new Error(`Process account not found for ${party.partyName}`);
    }

    const penalty_amount = Math.round((quantity + labour_quantity) * party.rate);
    parties.push({
      ...party,
      account_id: account._id,
      quantity,
      labour_quantity,
      penalty_amount,
      additional_cost,
      total_penalty: penalty_amount + additional_cost,
    });
  }

  const assignedQuantity = parties.reduce((total, party) => total + party.quantity, 0);
  if (assignedQuantity !== total_quantity) {
    throw new Error(
      `Assigned B Pair quantity ${assignedQuantity} must be equal to total B Pair quantity ${total_quantity}`
    );
  }

  return parties;
};

export const applyPackingPenalties = async ({
  parties,
  serial_No,
  Manual_No,
  design_no,
  session,
}) => {
  const date = getTodayDate();
  const penalties = [];

  for (const party of parties) {
    const account = await processBillsModel.findById(party.account_id).session(session);
    if (!account) throw new Error(`Process account not found for ${party.partyName}`);

    const { new_total_debit, new_total_credit, new_total_balance, new_status } =
      calculateAccountBalance({
        amount: party.total_penalty,
        oldAccountData: account,
        credit: false,
      });
    const additionalNote =
      party.additional_cost > 0 ? ` + Additional ${party.additional_cost}` : "";
    //E.G. "3", "3 labour" OR "2 + 3 labour"
    const quantityNote = [
      party.quantity > 0 ? `${party.quantity}` : "",
      party.labour_quantity > 0 ? `${party.labour_quantity} labour` : "",
    ]
      .filter(Boolean)
      .join(" + ");

    account.virtual_account = {
      total_debit: new_total_debit,
      total_credit: new_total_credit,
      total_balance: new_total_balance,
      status: new_status,
    };
    account.credit_debit_history.push({
      date,
      particular: `B-Pair · S.N:${serial_No}/M.N:${Manual_No}/D.N:${design_no} · ${quantityNote} · ${party.penalty_amount}${additionalNote}`,
      debit: party.total_penalty,
      credit: 0,
      balance: new_total_balance,
      orderId: B_PAIR_PENALTY_ENTRY,
    });
    const entry = account.credit_debit_history[account.credit_debit_history.length - 1];
    await account.save({ session });

    penalties.push({
      process_step: party.process_step,
      process_id: party.process_id,
      partyName: party.partyName,
      account_id: account._id,
      entry_id: entry._id,
      quantity: party.quantity,
      labour_quantity: party.labour_quantity,
      rate: party.rate,
      penalty_amount: party.penalty_amount,
      additional_cost: party.additional_cost,
      total_penalty: party.total_penalty,
    });
  }

  return penalties;
};

export const reversePackingPenalties = async (penalties, session) => {
  for (const penalty of penalties) {
    const account = await processBillsModel
      .findById(penalty.account_id)
      .session(session);
    const entry = account?.credit_debit_history.id(penalty.entry_id);
    if (!entry) continue;

    const { new_total_debit, new_total_credit, new_total_balance, new_status } =
      calculateAccountBalance({
        amount: -Number(entry.debit || 0),
        oldAccountData: account,
        credit: false,
      });
    account.virtual_account = {
      total_debit: new_total_debit,
      total_credit: new_total_credit,
      total_balance: new_total_balance,
      status: new_status,
    };
    account.credit_debit_history.pull(entry._id);
    await account.save({ session });
  }
};

export const computeBPairHoldings = (bill, exchanges = []) => {
  const holdings = new Map();
  const adjust = (item, quantity) => {
    const key = String(item.bpair_id);
    const holding = holdings.get(key) || {
      bpair_id: key,
      d_no: item.d_no,
      category: item.category,
      color: item.color,
      stitch_type: item.stitch_type,
      sku: item.sku,
      quantity: 0,
    };
    holding.quantity += quantity;
    holdings.set(key, holding);
  };

  bill.profitDataForHistory.forEach((line) => {
    adjust(
      {
        bpair_id: line.suitId,
        d_no: line.d_no,
        category: line.category,
        color: line.color,
        stitch_type: line.stitch_type,
        sku: line.sku,
      },
      line.quantity
    );
  });
  exchanges.forEach((exchange) => {
    exchange.issued_items.forEach((item) => adjust(item, item.quantity));
    exchange.returned_items.forEach((item) => adjust(item, -item.quantity));
  });

  return [...holdings.values()].filter((holding) => holding.quantity > 0);
};

export const deductBPairStockForBill = async ({ suits_data, session }) => {
  const soldQuantities = new Map();
  suits_data.forEach((suit) => {
    const quantity = Number(suit.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Invalid quantity for Design No: ${suit.d_no}`);
    }
    const key = String(suit.id);
    soldQuantities.set(key, (soldQuantities.get(key) || 0) + quantity);
  });

  const bPairStock = new Map();
  for (const [id, quantity] of soldQuantities) {
    const bPair = await B_PairModel.findOneAndUpdate(
      { _id: id, quantity: { $gte: quantity } },
      { $inc: { quantity: -quantity, sold_quantity: quantity } },
      { new: true, session }
    );
    if (!bPair) {
      const stock = await B_PairModel.findById(id).session(session);
      throw new Error(
        stock
          ? `Not enough B Pair stock for Design No: ${stock.d_no} (${stock.color})`
          : "B Pair stock not found"
      );
    }
    bPairStock.set(id, bPair);
  }

  const profitDataForHistory = suits_data.map((suit) => {
    const bPair = bPairStock.get(String(suit.id));
    return {
      d_no: bPair.d_no,
      color: bPair.color,
      category: bPair.category,
      stitch_type: bPair.stitch_type,
      sku: bPair.sku,
      suitId: String(bPair._id),
      quantity: suit.quantity,
      suitSalePrice: suit.price,
      profit: 0,
      quantity_for_return: 0,
    };
  });

  return { profitDataForHistory, TotalProfit: 0 };
};

export const restockBPairForDeletedBill = async ({ bill, session }) => {
  const exchanges = await B_PairExchangeModel.find({ bill_Id: bill._id }).session(
    session
  );
  const holdings = computeBPairHoldings(bill, exchanges);

  for (const holding of holdings) {
    const bPair = await B_PairModel.findByIdAndUpdate(
      holding.bpair_id,
      { $inc: { quantity: holding.quantity, sold_quantity: -holding.quantity } },
      { new: true, session }
    );
    if (!bPair) throw new Error(`B Pair stock not found for D# ${holding.d_no}`);
  }

  await B_PairExchangeModel.deleteMany({ bill_Id: bill._id }).session(session);
};

export const getAllBPairs = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const search = parseInt(req.query.search) || "";
    const category = req.query.category || "";
    const stitchTypeFilter = req.query.stitch_type
      ? { stitch_type: stitchTypeQuery(toStitchType(req.query.stitch_type)) }
      : {};

    let query = { ...stitchTypeFilter };
    if (search) {
      query.d_no = search;
    } else if (req.query.search) {
      Object.assign(query, skuSearchQuery(req.query.search));
    }
    if (category) {
      query.category = category;
    }

    const aggregatedData = await B_PairModel.aggregate([
      { $match: stitchTypeFilter },
      {
        $facet: {
          category_data: [
            {
              $group: {
                _id: "$category",
                quantity: { $sum: "$quantity" },
              },
            },
          ],
          total_stock: [
            {
              $group: {
                _id: null,
                total_quantity: { $sum: "$quantity" },
              },
            },
          ],
        },
      },
    ]);

    const total = await B_PairModel.countDocuments(query);
    const data = await B_PairModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ quantity: -1, createdAt: -1 });

    setMongoose();
    return res.status(200).json({
      totalPages: Math.ceil(total / limit),
      page,
      limit,
      totalRecords: total,
      data,
      category_data: aggregatedData[0].category_data,
      total_stock: aggregatedData[0]?.total_stock[0]?.total_quantity || 0,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getOrderProcessParties = async (req, res, next) => {
  try {
    const { embroidery_Id } = req.body;
    if (!embroidery_Id) throw new Error("Embroidery Id Required");
    const data = await getProcessPartiesForOrder(embroidery_Id);
    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getBPairStockForBill = async (req, res, next) => {
  try {
    const data = await B_PairModel.find({ quantity: { $gt: 0 } })
      .select("d_no category color stitch_type sku quantity sale_price")
      .sort({ d_no: 1 });
    setMongoose();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


const mergeExchangeItems = (items) => {
  const merged = new Map();
  (items || []).forEach((item) => {
    const quantity = Number(item?.quantity);
    if (!item?.bpair_id || !mongoose.Types.ObjectId.isValid(item.bpair_id)) {
      throw new Error("Invalid suit selected for exchange");
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Exchange quantity must be a whole number greater than 0");
    }
    const key = String(item.bpair_id);
    merged.set(key, (merged.get(key) || 0) + quantity);
  });
  return [...merged].map(([bpair_id, quantity]) => ({ bpair_id, quantity }));
};

const toExchangeItem = (bPair, quantity) => ({
  bpair_id: bPair._id,
  d_no: bPair.d_no,
  category: bPair.category,
  color: bPair.color,
  stitch_type: bPair.stitch_type,
  sku: bPair.sku,
  quantity,
});

export const exchangeBPairBill = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { bill_Id, note, returned_items, issued_items } = req.body;
      if (!bill_Id) throw new Error("Bill Id Required");

      const returnedItems = mergeExchangeItems(returned_items);
      const issuedItems = mergeExchangeItems(issued_items);
      if (!returnedItems.length || !issuedItems.length) {
        throw new Error("Please select suits to take back and suits to give");
      }

      const totalReturned = returnedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalIssued = issuedItems.reduce((sum, item) => sum + item.quantity, 0);
      if (totalReturned !== totalIssued) {
        throw new Error(
          `Exchange quantity must be equal. Taking back ${totalReturned} but giving ${totalIssued}`
        );
      }
      if (
        returnedItems.some((returned) =>
          issuedItems.some((issued) => issued.bpair_id === returned.bpair_id)
        )
      ) {
        throw new Error("Same suit cannot be taken back and given in one exchange");
      }

      const bill = await BuyersBillsModel.findById(bill_Id).session(session);
      if (!bill) throw new Error("Bill not found");
      if (bill.bill_type !== BillType.B_PAIR) {
        throw new Error("Only B Pair bills can be exchanged");
      }

      const previousExchanges = await B_PairExchangeModel.find({
        bill_Id: bill._id,
      }).session(session);
      const holdings = computeBPairHoldings(bill, previousExchanges);

      const returnedData = [];
      for (const item of returnedItems) {
        const holding = holdings.find((h) => h.bpair_id === item.bpair_id);
        if (!holding || holding.quantity < item.quantity) {
          throw new Error(
            holding
              ? `Buyer only holds ${holding.quantity} suits of D# ${holding.d_no} (${holding.color})`
              : "Selected suit is not part of this bill"
          );
        }
        const bPair = await B_PairModel.findByIdAndUpdate(
          item.bpair_id,
          { $inc: { quantity: item.quantity, sold_quantity: -item.quantity } },
          { new: true, session }
        );
        if (!bPair) throw new Error(`B Pair stock not found for D# ${holding.d_no}`);
        returnedData.push(toExchangeItem(bPair, item.quantity));
      }

      const issuedData = [];
      for (const item of issuedItems) {
        const bPair = await B_PairModel.findOneAndUpdate(
          { _id: item.bpair_id, quantity: { $gte: item.quantity } },
          { $inc: { quantity: -item.quantity, sold_quantity: item.quantity } },
          { new: true, session }
        );
        if (!bPair) {
          throw new Error("Not enough B Pair stock for one of the selected suits");
        }
        issuedData.push(toExchangeItem(bPair, item.quantity));
      }

      await B_PairExchangeModel.create(
        [
          {
            branchId: bill.branchId,
            buyerId: bill.buyerId,
            bill_Id: bill._id,
            partyName: bill.name,
            serialNumber: bill.serialNumber,
            date: getTodayDate(),
            note: String(note || "").trim(),
            returned_items: returnedData,
            issued_items: issuedData,
          },
        ],
        { session }
      );
    });
    return res
      .status(200)
      .json({ success: true, message: "Exchange completed successfully" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
