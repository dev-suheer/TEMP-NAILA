import { BranchModel } from "../models/Branch.Model.js";
import { CashInOutModel } from "../models/CashInOutModel.js";
import { DailySaleModel } from "../models/DailySaleModel.js";
import { SuitsModel } from "../models/Stock/Suits.Model.js";
import { setMongoose } from "../utils/Mongoose.js";
import moment from "moment-timezone";
import mongoose from "mongoose";
import { branchStockHistoryModel } from "../models/BranchStock/BranchStockHistoryModel.js";
import {
  getPaginationParams,
  getTodayDate,
  skuSearchQuery,
  stitchTypeQuery,
  toStitchType,
} from "../utils/Common.js";
import { branchStockModel } from "../models/BranchStock/BranchSuitsStockModel.js";
import { BranchCashOutHistoryModel } from "../models/BranchStock/BranchCashOutHistory.js";
import { addBPairStock } from "./Process/B_PairController.js";
import { BPairSource } from "../enums/BillType.js";

export const createBranch = async (req, res) => {
  try {
    const { branchName } = req.body;
    if (!branchName) throw new Error("Invalid branch name");
    const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");

    const existingBranch = await BranchModel.findOne({
      branchName: { $regex: new RegExp(branchName, "i") },
    });
    if (existingBranch) {
      throw new Error("This branch already exists");
    }
    const branchData = await BranchModel.create({ branchName });
    await CashInOutModel.create({
      branchId: branchData._id,
      date: today,
      todayCashIn: 0,
      todayCashOut: 0,
    });
    await DailySaleModel.create({
      branchId: branchData._id,
      date: today,
      saleData: {},
    });

    return res.status(201).json({ success: true, message: "Success" });
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { branchName, branchId } = req.body;
    if (!branchName || !branchId) throw new Error("Invalid Update Data");
    const foundBranch = BranchModel.findById(branchId);
    if (!foundBranch) throw new Error("Invalid Branch Id");
    const existingBranch = await BranchModel.findOne({
      branchName: { $regex: new RegExp(branchName, "i") },
    });
    if (existingBranch && existingBranch._id !== branchId) {
      throw new Error("This branch already exists");
    }
    await BranchModel.findByIdAndUpdate(
      { _id: branchId },
      { branchName: branchName }
    );
    return res
      .status(201)
      .json({ success: true, message: "updated successfully" });
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const { branchId } = req.body;
    if (!branchId) throw new Error("Invalid branch ID");
    await BranchModel.findByIdAndDelete(branchId);
    return res
      .status(201)
      .json({ success: true, message: "deleted successfully" });
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
};

export const getAllBranches = async (req, res) => {
  try {
    const branchId = req.branch_id;
    const role = req.user_role;
    if (role !== "superadmin" && !branchId)
      throw new Error("Branch Id Required");
    if (!role) throw new Error("User Role Not Found");
    let response;
    if (role === "superadmin") {
      const branches = await BranchModel.find({});
      response = branches;
    } else {
      const branch = await BranchModel.findOne({ _id: branchId });
      response = [branch];
    }
    setMongoose();
    return res.status(200).json(response);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
};

export const assignStockToBranch = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { branchId, bundles, note } = req.body;
      const requiredFields = ["branchId", "bundles", "note"];
      const bundleFields = [
        "category",
        "color",
        "quantity",
        "cost_price",
        "sale_price",
        "d_no",
        "Item_Id",
      ];
      const missingFields = [];

      //CHECKING FOR REQUIRED FIELDS
      requiredFields.forEach((field) => {
        if (!req.body[field]) {
          missingFields.push(`${field}`);
        } else if (field === "bundles" && req.body[field].length === 0) {
          missingFields.push(`${field} Cannot be empty)`);
        }
      });

      //CHECKING FOR BUNDLE DETAILS FIELDS
      const structuredArray = bundles.flat();

      structuredArray.forEach((obj, index) => {
        const missingStockFields = [];
        bundleFields.forEach((item) => {
          if (!obj[item]) {
            missingStockFields.push(item);
          }
        });
        if (missingStockFields.length > 0) {
          missingFields.push(
            `${missingStockFields} for suit item ${index + 1}`
          );
        }
      });

      if (missingFields.length > 0) {
        throw new Error(`Missing Fields ${missingFields}`);
      }

      //DEDUCTING SUITS FROM MAIN STOCK
      const result = await SuitsModel.bulkWrite(
        structuredArray.map((item) => ({
          updateOne: {
            filter: {
              _id: item.Item_Id,
              quantity: { $gte: item.quantity },
            },
            update: {
              $inc: { quantity: -item.quantity },
            },
          },
        })),
        { session }
      );

      if (result.modifiedCount !== structuredArray.length) {
        throw new Error("One or more items have insufficient stock.");
      }

      //EACH BUNDLE ITEM CARRIES THE STITCH TYPE OF ITS MAIN STOCK LINE
      const mainSuits = await SuitsModel.find({
        _id: structuredArray.map((item) => item.Item_Id),
      }).session(session);
      const mainStitchTypes = new Map(
        mainSuits.map((suit) => [String(suit._id), suit.stitch_type])
      );
      structuredArray.forEach((item) => {
        item.stitch_type = mainStitchTypes.get(String(item.Item_Id));
      });

      //WRITING TO BRANCH STOCK HISTORY
      await branchStockHistoryModel.create(
        [
          {
            branchId: branchId,
            issueDate: getTodayDate(),
            note,
            bundles,
          },
        ],
        { session }
      );

      return res.status(200).json({
        success: true,
        message: "Stock updated successfully",
      });
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const returnStockToMain = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const branchId = req.branch_id;
      const { bundles, note } = req.body;
      const requiredFields = ["bundles", "note"];
      const bundleFields = [
        "branchStock_Id",
        "Item_Id",
        "category",
        "color",
        "quantity",
        "cost_price",
        "sale_price",
        "d_no",
      ];
      const missingFields = [];

      if (!branchId) {
        throw new Error("Branch id required");
      }

      requiredFields.forEach((field) => {
        if (!req.body[field]) {
          missingFields.push(`${field}`);
        } else if (field === "bundles" && req.body[field].length === 0) {
          missingFields.push(`${field} Cannot be empty`);
        }
      });

      const structuredArray = bundles?.flat() || [];
      structuredArray.forEach((obj, index) => {
        const missingStockFields = [];
        bundleFields.forEach((item) => {
          if (!obj[item]) {
            missingStockFields.push(item);
          }
        });
        if (missingStockFields.length > 0) {
          missingFields.push(
            `${missingStockFields} for suit item ${index + 1}`
          );
        }
        if (Number(obj.quantity) <= 0) {
          missingFields.push(`quantity must be greater than 0 for suit item ${index + 1}`);
        }
      });

      if (missingFields.length > 0) {
        throw new Error(`Missing Fields ${missingFields}`);
      }

      const result = await branchStockModel.bulkWrite(
        structuredArray.map((item) => ({
          updateOne: {
            filter: {
              _id: item.branchStock_Id,
              branchId,
              total_quantity: { $gte: Number(item.quantity) },
            },
            update: {
              $inc: { total_quantity: -Number(item.quantity) },
              $set: { lastUpdated: getTodayDate() },
            },
          },
        })),
        { session }
      );

      if (result.modifiedCount !== structuredArray.length) {
        throw new Error("One or more items have insufficient branch stock.");
      }

      //EACH BUNDLE ITEM CARRIES THE STITCH TYPE OF ITS BRANCH STOCK LINE
      const branchSuits = await branchStockModel.find({
        _id: structuredArray.map((item) => item.branchStock_Id),
      }).session(session);
      const branchStitchTypes = new Map(
        branchSuits.map((suit) => [String(suit._id), suit.stitch_type])
      );
      structuredArray.forEach((item) => {
        item.stitch_type = branchStitchTypes.get(String(item.branchStock_Id));
      });

      await branchStockHistoryModel.create(
        [
          {
            branchId,
            issueDate: getTodayDate(),
            note,
            bundles,
            transferType: "RETURN_TO_MAIN",
          },
        ],
        { session }
      );

      return res.status(200).json({
        success: true,
        message: "Return request created successfully",
      });
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const getBranchCashoutHistory = async (req, res) => {
  try {
    const branchId = req.branch_id;
    if (!branchId) throw new Error("Branch id required");
    const { page, limit } = getPaginationParams(req.query);

    let query = {
      branchId: branchId,
    };
    const totalDocuments = await BranchCashOutHistoryModel.countDocuments(
      query
    );
    const data = await BranchCashOutHistoryModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const response = {
      data,
      page,
      limit,
      totalRecords: totalDocuments,
      totalPages: Math.ceil(totalDocuments / limit),
    };
    setMongoose();
    return res.status(200).json(response);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
};

export const getAllBranchStockHistory = async (req, res) => {
  try {
    const branchId = req.query.branchId;
    const transferType = req.query.transferType;
    const bundleStatus = req.query.bundleStatus;
    const { page, limit } = getPaginationParams(req.query);

    let query = {};
    if (branchId) {
      query.branchId = branchId;
    }
    if (transferType === "RETURN_TO_MAIN") {
      query.transferType = "RETURN_TO_MAIN";
    } else if (transferType === "TO_BRANCH") {
      query.transferType = { $ne: "RETURN_TO_MAIN" };
    }
    if (bundleStatus) {
      query.bundleStatus = bundleStatus;
    }

    const data = await branchStockHistoryModel
      .find(query)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .limit(limit);

    const total = await branchStockHistoryModel.countDocuments(query);

    setMongoose();

    const response = {
      totalPages: Math.ceil(total / limit),
      page,
      limit,
      totalRecords: total,
      data,
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getPendingReturnedStock = async (req, res) => {
  try {
    const count = await branchStockHistoryModel.countDocuments({
        bundleStatus: "Pending",
        transferType: "RETURN_TO_MAIN",
      });

    return res.status(200).json({ count });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getAllSuitsStockForBranch = async (req, res, next) => {
  try {
    const branchId = req.branch_id;
    const { page, limit } = getPaginationParams(req.query);
    let d_no = parseInt(req.query.search) || "";
    let category = req.query.category || "";
    const stitchTypeFilter = req.query.stitch_type
      ? { stitch_type: stitchTypeQuery(toStitchType(req.query.stitch_type)) }
      : {};

    let query = { ...stitchTypeFilter };

    if (!branchId) {
      throw new Error("Branch Id Required");
    }

    query.branchId = branchId;

    if (d_no) {
      query = { ...query, d_no };
    } else if (req.query.search) {
      query = { ...query, ...skuSearchQuery(req.query.search) };
    }

    if (category) {
      query = { ...query, category };
    }

    const total = await branchStockModel.countDocuments(query);
    const result = await branchStockModel
      .find(query)
      .skip((page - 1) * limit)
      .sort({ total_quantity: -1 })
      .limit(limit);

    const aggregatedData = await branchStockModel.aggregate([
      {
        $match: {
          branchId: branchId,
          ...stitchTypeFilter,
        },
      },
      {
        $facet: {
          d_no_quantity: [
            {
              $group: {
                _id: "$d_no",
                quantity: { $sum: "$total_quantity" },
              },
            },
          ],
          category_data: [
            {
              $group: {
                _id: "$category",
                quantity: { $sum: "$total_quantity" },
              },
            },
          ],
          total_stock: [
            {
              $group: {
                _id: null,
                total_quantity: { $sum: "$total_quantity" },
              },
            },
          ],
        },
      },
    ]);

    const mergedDataWithD_No = result.map((suit) => {
      const plainObject = suit.toObject();
      const data = aggregatedData[0].d_no_quantity.find(
        (item) => item._id === plainObject.d_no
      );
      return {
        ...plainObject,
        total_dno_quantity: data?.quantity,
      };
    });

    setMongoose();
    const response = {
      totalPages: Math.ceil(total / limit),
      page,
      limit,
      totalRecords: total,
      data: mergedDataWithD_No,
      category_data: aggregatedData[0].category_data,
      total_stock: aggregatedData[0].total_stock[0]?.total_quantity || 0,
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const approveOrRejectStock = async (req, res) => {
  try {
    const { stockId, status } = req.body;
    if (
      !stockId ||
      (!status && (status !== "Approved" || status !== "Rejected"))
    )
      throw new Error("Invalid Fields");

    const pendingtockData = await branchStockHistoryModel.findById(stockId);
    if (!pendingtockData) throw new Error("No pending stock found");
    if (pendingtockData.bundleStatus !== "Pending")
      throw new Error("Error updating stock.Stock is not pending");
    const bundles = pendingtockData.bundles;
    const structuredArray = bundles.flat();
    if (status === "Approved") {
      for (const suit of structuredArray) {
        const branchsuitStock = await branchStockModel.findOne({
          main_stock_Id: suit.Item_Id,
          branchId: pendingtockData.branchId,
        });
        if (branchsuitStock) {
          branchsuitStock.total_quantity += suit.quantity;
          branchsuitStock.lastUpdated = getTodayDate();
          branchsuitStock.cost_price = suit.cost_price;
          branchsuitStock.sale_price = suit.sale_price;
          await branchsuitStock.save();
        } else if (!branchsuitStock) {
          const mainSuit = await SuitsModel.findById(suit.Item_Id).select("sku");
          await branchStockModel.create({
            branchId: pendingtockData.branchId,
            lastUpdated: getTodayDate(),
            category: suit.category,
            color: suit.color,
            stitch_type: suit.stitch_type,
            sku: mainSuit?.sku,
            total_quantity: suit.quantity,
            cost_price: suit.cost_price,
            sale_price: suit.sale_price,
            d_no: suit.d_no,
            main_stock_Id: suit.Item_Id,
          });
        }
      };
      pendingtockData.bundleStatus = "Approved";
      pendingtockData.updatedOn = getTodayDate();
      await pendingtockData.save();
    } else if (status === "Rejected") {
      await SuitsModel.bulkWrite(
        structuredArray.map((item) => ({
          updateOne: {
            filter: {
              _id: item.Item_Id,
            },
            update: {
              $inc: { quantity: item.quantity },
            },
          },
        }))
      );
      pendingtockData.bundleStatus = "Rejected";
      pendingtockData.updatedOn = getTodayDate();
      await pendingtockData.save();
    }

    return res
      .status(200)
      .json({ success: true, message: "Stock Updated Successfully" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const buildReturnAllocations = (items, allocations = []) => {
  if (!Array.isArray(allocations)) throw new Error("Invalid allocations");
  allocations.forEach((allocation) => {
    if (!items.some((item) => item._id.toString() === String(allocation?.item_id))) {
      throw new Error("Allocation does not belong to this return");
    }
  });

  return items.map((item) => {
    const allocation = allocations.find(
      (entry) => String(entry.item_id) === item._id.toString()
    );
    const returnedQuantity = Number(item.quantity);
    if (!allocation) {
      return {
        item,
        main_quantity: returnedQuantity,
        main_Item_Id: item.Item_Id,
        b_pair_quantity: 0,
        b_pair_sale_price: 0,
      };
    }

    const main_quantity = Number(allocation.main_quantity) || 0;
    const b_pair_quantity = Number(allocation.b_pair_quantity) || 0;
    const b_pair_sale_price = Number(allocation.b_pair_sale_price) || 0;
    const label = `D# ${item.d_no} (${item.color})`;
    if (
      !Number.isInteger(main_quantity) ||
      !Number.isInteger(b_pair_quantity) ||
      main_quantity < 0 ||
      b_pair_quantity < 0
    ) {
      throw new Error(`Invalid quantities for ${label}`);
    }
    if (main_quantity + b_pair_quantity !== returnedQuantity) {
      throw new Error(
        `Main and B Pair quantity must be equal to returned quantity ${returnedQuantity} for ${label}`
      );
    }
    if (b_pair_quantity > 0 && !(b_pair_sale_price > 0)) {
      throw new Error(`B Pair sale price is required for ${label}`);
    }

    return {
      item,
      main_quantity,
      main_Item_Id: allocation.main_Item_Id || item.Item_Id,
      b_pair_quantity,
      b_pair_sale_price,
    };
  });
};

export const approveOrRejectReturnedStock = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { stockId, status, allocations } = req.body;
      if (
        !stockId ||
        (status !== "Approved" && status !== "Rejected")
      ) {
        throw new Error("Invalid Fields");
      }

      const pendingStockData = await branchStockHistoryModel
        .findById(stockId)
        .session(session);
      if (!pendingStockData) throw new Error("No pending return stock found");
      if (pendingStockData.transferType !== "RETURN_TO_MAIN") {
        throw new Error("Invalid return stock request");
      }
      if (pendingStockData.bundleStatus !== "Pending") {
        throw new Error("Error updating stock.Stock is not pending");
      }

      const structuredArray = pendingStockData.bundles.flat();
      if (status === "Approved") {
        const itemAllocations = buildReturnAllocations(structuredArray, allocations);
        const today = getTodayDate();

        for (const allocation of itemAllocations) {
          const { item, main_quantity, main_Item_Id, b_pair_quantity, b_pair_sale_price } =
            allocation;
          const itemAllocation = { b_pair_quantity, b_pair_sale_price, main_quantity: 0 };

          if (main_quantity > 0) {
            const mainSuit = await SuitsModel.findById(main_Item_Id).session(session);
            if (!mainSuit) {
              throw new Error(`Main stock not found for D# ${item.d_no} (${item.color})`);
            }
            if (mainSuit.stitch_type !== item.stitch_type) {
              throw new Error(
                `Main stock for D# ${item.d_no} (${item.color}) must be ${item.stitch_type}`
              );
            }
            mainSuit.quantity += main_quantity;
            mainSuit.all_records.push({
              date: today,
              quantity: main_quantity,
              cost_price: mainSuit.cost_price,
              sale_price: mainSuit.sale_price,
              is_stock_source_packing: false,
              branchId: pendingStockData.branchId,
              branch_stock_history_id: pendingStockData._id,
            });
            await mainSuit.save({ session });

            Object.assign(itemAllocation, {
              main_quantity,
              main_Item_Id: mainSuit._id,
              main_d_no: mainSuit.d_no,
              main_category: mainSuit.category,
              main_color: mainSuit.color,
            });
          }

          if (b_pair_quantity > 0) {
            await addBPairStock(
              {
                d_no: item.d_no,
                category: item.category,
                color: item.color,
                stitch_type: item.stitch_type,
                quantity: b_pair_quantity,
                sale_price: b_pair_sale_price,
                record: {
                  source: BPairSource.BRANCH_RETURN,
                  branchId: pendingStockData.branchId,
                  branch_stock_history_id: pendingStockData._id,
                },
              },
              session
            );
          }

          item.allocation = itemAllocation;
        }
      } else if (status === "Rejected") {
        const result = await branchStockModel.bulkWrite(
          structuredArray.map((item) => ({
            updateOne: {
              filter: {
                _id: item.branchStock_Id,
                branchId: pendingStockData.branchId,
              },
              update: {
                $inc: { total_quantity: Number(item.quantity) },
                $set: { lastUpdated: getTodayDate() },
              },
            },
          })),
          { session }
        );

        if (result.modifiedCount !== structuredArray.length) {
          throw new Error("Failed to restore branch stock");
        }
      }

      pendingStockData.bundleStatus = status;
      pendingStockData.updatedOn = getTodayDate();
      await pendingStockData.save({ session });
    });

    return res.status(200).json({
      success: true,
      message: "Return stock updated successfully",
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const getPendingStockForBranch = async (req, res) => {
  try {
    const branchId = req.branch_id;
    const data = await branchStockHistoryModel.find({
      branchId: branchId,
      bundleStatus: "Pending",
      $or: [{ transferType: "TO_BRANCH" }, { transferType: { $exists: false } }],
    });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getSuitsStockToGenerateBill = async (req, res, next) => {
  try {
    const branchId = req.branch_id;
    const role = req.user_role;

    let query = {};

    if (role !== "superadmin") {
      if (!branchId) throw new Error("Branch ID required");
      query.branchId = branchId;
    }

    const data = await branchStockModel.find(query);

    setMongoose();

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
