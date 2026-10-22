import { BaseModel } from "../../models/Stock/Base.Model.js";
import { setMongoose } from "../../utils/Mongoose.js";
import { getPaginationParams, getTodayDate } from "../../utils/Common.js";
import mongoose from "mongoose";
import { purchasing_History_model } from "../../models/sellers/PurchasingHistoryModel.js";
import { SellersModel } from "../../models/sellers/SellersModel.js";
import { calculateAccountBalance } from "../../utils/accounting.js";
import { verifyrequiredparams } from "../../middleware/Common.js";

const getBaseRowQuantity = (row) => Number(row.rowQuantity || 0);

const updateBaseSellerAfterBillReduction = async ({
  seller,
  billId,
  billNo,
  amount,
  session,
}) => {
  const {
    new_total_debit,
    new_total_credit,
    new_total_balance,
    new_status,
  } = calculateAccountBalance({
    amount,
    oldAccountData: seller,
    credit: true,
    add: false,
  });

  await SellersModel.findByIdAndUpdate(
    seller._id,
    {
      $set: {
        virtual_account: {
          total_credit: new_total_credit,
          total_debit: new_total_debit,
          total_balance: new_total_balance,
          status: new_status,
        },
      },
      $push: {
        credit_debit_history: {
          date: getTodayDate(),
          particular: `Partial stock delete adjustment for Bill No:${billNo}`,
          credit: -amount,
          balance: new_total_balance,
          bill_id: billId,
        },
      },
    },
    { session }
  );
};

export const reduceBaseStockQuantity = async ({
  category,
  colour,
  quantity,
  session,
  rowId,
}) => {
  const baseStock = await BaseModel.findOne({
    category: { $regex: new RegExp(`^${category}$`, "i") },
    colors: { $regex: new RegExp(`^${colour}$`, "i") },
  }).session(session);

  if (!baseStock) {
    throw new Error(`Base stock not found for ${category}, ${colour}`);
  }

  const quantityToDelete = quantity;
  if (baseStock.TYm < quantityToDelete) {
    throw new Error(`Not enough base stock for ${category}, ${colour}`);
  }

  const stockRecord = baseStock.all_Records.find((record) => record._id.equals(rowId));

  if (!stockRecord) {
    throw new Error(`Base stock record not found for ${category}, ${colour}`);
  }

  baseStock.TYm = baseStock.TYm - quantityToDelete;
  const remainingRecordQuantity = stockRecord.quantity - quantityToDelete;
  if (remainingRecordQuantity > 0) {
    stockRecord.quantity = remainingRecordQuantity;
  } else {
    baseStock.all_Records = baseStock.all_Records.filter(
      (record) => record._id.toString() !== rowId.toString()
    );
  }

  const latestRecord = baseStock.all_Records[baseStock.all_Records.length - 1];
  baseStock.recently = latestRecord ? latestRecord.quantity : 0;
  baseStock.r_Date = latestRecord ? latestRecord.Date : baseStock.r_Date;

  await baseStock.save({ session });
};

export const addBaseInStock = async (req, res, next) => {
  try {
    let { category, colors, r_Date, quantity } = req.body;
    if (!category || !colors || !quantity || !r_Date)
      throw new Error("All Fields Required");
    category =
      category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    colors = colors.charAt(0).toUpperCase() + colors.slice(1).toLowerCase();
    const checkExistingStock = await BaseModel.findOne({
      category: { $regex: new RegExp(category, "i") },
      colors: { $regex: new RegExp(colors, "i") },
    });
    let recordData = { category, colors, Date: r_Date, quantity, isDirectEntry:true };
    if (checkExistingStock) {
      const updatedTYm = checkExistingStock.TYm + quantity;
      (checkExistingStock.recently = quantity),
        (checkExistingStock.r_Date = r_Date),
        (checkExistingStock.TYm = updatedTYm),
        checkExistingStock.all_Records.push(recordData);
      await checkExistingStock.save();
    } else {
      await BaseModel.create({
        category,
        colors,
        recently: quantity,
        r_Date,
        TYm: quantity,
        all_Records: [recordData],
      });
    }

    return res.status(200).json({ message: "Successfully Added" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllBases = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    let search = req.query.search || "";
    let category = req.query.category || "";

    let query = {};
    if (search) {
      query.colors = { $regex: search, $options: "i" };
    }
    if (category) {
      query = { ...query, category: category };
    }
    const data = await BaseModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ updatedAt: -1 });

    const total = await BaseModel.countDocuments(query);

    const response = {
      totalPages: Math.ceil(total / limit),
      page,
      limit,
      Base: total,
      totalRecords: total,
      data,
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllCategoriesForbase = async (req, res, next) => {
  try {
    const data = await BaseModel.find({})
      .sort({ createdAt: -1 })
      .select("category");
    const categoryNames = Array.from(
      new Set(data?.map((item) => item.category))
    );
    setMongoose();
    return res.status(200).json(categoryNames);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllBasesForEmbroidery = async (req, res, next) => {
  try {
    const baseData = await BaseModel.find({});
    return res.status(200).json(baseData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteBaseStock = async (req, res, next) => {
  try {
    const { baseId, itemId } = req.body;

    if (!baseId || !itemId) {
      throw new Error("Required Missing Fields");
    }

    const base = await BaseModel.findById(baseId);
    if (!base) {
      throw new Error("Base Not Found");
    }

    const item = base.all_Records.find((record) => record._id.toString() === itemId);
    if (!item) {
      throw new Error("Item Not Found in Base");
    }

    const itemQuantity = parseInt(item.quantity, 10);

    if (base.TYm < itemQuantity) {
      throw new Error("Not Enough Quantity in Stock");
    }


    base.TYm -= itemQuantity;
    base.all_Records = base.all_Records.filter((record) => record._id.toString() !== itemId)
    const latestRecord = base.all_Records[base.all_Records.length - 1];
    base.recently = latestRecord?.quantity || 0;

    await base.save();

    return res.status(200).json({success:true , message: "Successfully Deleted Base Stock" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteBaseBillColorAndReverseStock = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { billId, rowId } = req.body;
      await verifyrequiredparams(req.body, ["billId", "rowId"]);

      const billData = await purchasing_History_model.findById(billId).session(session);
      if (!billData) throw new Error("Bill data not found");
      if (billData.seller_stock_category !== "Base") {
        throw new Error("Invalid bill category");
      }

      const rows = billData.measurementData || [];
      if (rows.length === 1) {
        throw new Error("Only one base row is remaining. Please delete the full bill instead.");
      }

      const rowToDelete = rows.find((row) => row._id.toString() === rowId);
      if (!rowToDelete) throw new Error("No matching base row found");

      const removedQuantity = getBaseRowQuantity(rowToDelete);
      const removedTotal = rowToDelete.rowTotal;

      if (billData.toAddinStock) {
        await reduceBaseStockQuantity({
          category: billData.category,
          colour: rowToDelete.colour,
          quantity: removedQuantity,
          session,
          rowId,
        });
      }

      const oldSellerData = await SellersModel.findOne({ name: billData.name }).session(session);
      if (!oldSellerData) throw new Error("Seller data not found");

      await updateBaseSellerAfterBillReduction({
        seller: oldSellerData,
        billId,
        billNo: billData.bill_no,
        amount: removedTotal,
        session,
      });

      billData.measurementData = rows.filter((row) => row._id.toString() !== rowId);
      billData.quantity = billData.quantity - removedQuantity;
      billData.total = billData.total - removedTotal;
      await billData.save({ session });
    });

    return res.status(200).json({ success: true, message: "Successfully Deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const partialDeleteBaseBillColorAndReverseStock = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { billId, rowId, quantity } = req.body;
      await verifyrequiredparams(req.body, ["billId", "rowId", "quantity"]);

      const quantityToDelete = Number(quantity);
      if (!quantityToDelete || quantityToDelete <= 0) {
        throw new Error("Please enter a valid delete quantity");
      }

      const billData = await purchasing_History_model.findById(billId).session(session);
      if (!billData) throw new Error("Bill data not found");
      if (billData.seller_stock_category !== "Base") {
        throw new Error("Invalid bill category");
      }

      const rows = billData.measurementData || [];
      const baseRow = rows.find((row) => row._id.equals(rowId));
      if (!baseRow) throw new Error("No matching base row found");

      const existingRoleQuantity = baseRow.roleQuantity;
      const measurement = baseRow.measurement;
      const rate = baseRow.rate;
      if (!existingRoleQuantity || !measurement || !rate) {
        throw new Error("Invalid base row data");
      }
      if (quantityToDelete >= existingRoleQuantity) {
        throw new Error("Use full color delete to delete the complete color quantity");
      }

      const removedQuantity = quantityToDelete * measurement;
      const removedTotal = removedQuantity * rate;

      if (billData.toAddinStock) {
        await reduceBaseStockQuantity({
          category: billData.category,
          colour: baseRow.colour,
          quantity: removedQuantity,
          session,
          rowId,
        });
      }

      const oldSellerData = await SellersModel.findOne({ name: billData.name }).session(session);
      if (!oldSellerData) throw new Error("Seller data not found");

      await updateBaseSellerAfterBillReduction({
        seller: oldSellerData,
        billId,
        billNo: billData.bill_no,
        amount: removedTotal,
        session,
      });

      const remainingRoleQuantity = existingRoleQuantity - quantityToDelete;
      const remainingQuantity = remainingRoleQuantity * measurement;
      baseRow.roleQuantity = remainingRoleQuantity;
      baseRow.rowQuantity = remainingQuantity;
      baseRow.rowTotal = remainingQuantity * rate;
      billData.quantity = billData.quantity - removedQuantity;
      billData.total = billData.total - removedTotal;
      await billData.save({ session });
    });

    return res.status(200).json({ success: true, message: "Successfully Deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
