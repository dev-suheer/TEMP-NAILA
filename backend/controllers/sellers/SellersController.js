import mongoose from "mongoose";
import { SellersModel } from "../../models/sellers/SellersModel.js";
import {
  addLaceInStock,
  removeLaceFromStock,
} from "../Stock/LaceController.js";
import {
  addAccesoriesInStock,
  removeAccesoriesFromStock,
} from "../Stock/AccessoriesController.js";
import {
  addBagsAndBoxInStock,
  removeBagsAndBoxFromStock,
} from "../Stock/BagsAndBoxController.js";
import { setMongoose } from "../../utils/Mongoose.js";
import { purchasing_History_model } from "../../models/sellers/PurchasingHistoryModel.js";
import moment from "moment-timezone";
import { BaseModel } from "../../models/Stock/Base.Model.js";
import { calculateAccountBalance } from "../../utils/accounting.js";
import { buildDateRangeQuery, getBusinessDateObject, getPaginationParams, getTodayDate } from "../../utils/Common.js";
import { verifyrequiredparams } from "../../middleware/Common.js";
import {
  addSuitsPurchaseInStock,
  normalizeSuitStockRows,
  removeSuitPurchaseStockRows,
} from "../Stock/SuitsController.js";
import { reduceBaseStockQuantity } from "../Stock/BaseController.js";


const normalizeBaseMeasurementData = (measurementData = []) => {
  if (!measurementData || !measurementData.length) {
    throw new Error("Missing base measurement data");
  }

  return measurementData.map((item) => {
    const roleQuantity = Number(item.roleQuantity);
    const measurement = Number(item.measurement);
    const colour = String(item.colour || "").trim();
    const rate = Number(item.rate || 0);
    const rowQuantity = Number(item.rowQuantity || roleQuantity * measurement);
    const rowTotal = Number(item.rowTotal || rowQuantity * rate);
    const rowId = new mongoose.Types.ObjectId();


    if (!colour || !measurement || !roleQuantity) {
      throw new Error("Missing base measurement data");
    }

    return { _id:rowId, roleQuantity, measurement, colour, rate, rowQuantity, rowTotal };
  });
};

const normalizeMeasurementData = (measurementData = []) => {
  if (!measurementData || !measurementData.length) {
    throw new Error("Missing measurement data");
  }

  return measurementData.map((item) => {
    const category = String(item.category || "").trim();
    const roleQuantity = Number(item.roleQuantity ?? item.quantity);
    const measurement = Number(item.measurement || 1);
    const colour = String(item.colour || "").trim();
    const rate = Number(item.rate || 0);
    const rowQuantity = Number(item.rowQuantity || roleQuantity * measurement);
    const rowTotal = Number(item.rowTotal || rowQuantity * rate);

    if (!roleQuantity || !measurement || !rate) {
      throw new Error("Missing measurement data");
    }

    return { category, roleQuantity, measurement, colour, rate, rowQuantity, rowTotal };
  });
};

export const addInStockAndGeneraeSellerData_NEW = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const {
        bill_no,
        date,
        name,
        phone,
        category,
        quantity,
        rate,
        total,
        seller_stock_category,
        measurementData,
        toAddinStock,
      } = req.body;

      //VALIDATING FIELDS
      const requiredFields = [
        "bill_no",
        "phone",
        "date",
        "name",
        "category",
        "quantity",
        "rate",
        "total",
        "seller_stock_category",
      ];
      const missingFields = [];
      requiredFields.forEach((field) => {
        if (req.body[field] === undefined || req.body[field] === null) {
          missingFields.push(field);
        }
      });
      if (missingFields.length > 0)
        throw new Error(`Missing Fields ${missingFields}`);
      const billCreatedAt = getBusinessDateObject(date);

      //VALIDATING EXISTING SELLER
      const existingSeller = await SellersModel.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
      });

      if (existingSeller) {
        throw new Error(`The seller name "${name}" already exists.`);
      }

      //DATA FOR VIRTUAL ACCOUNT
      const total_credit = total;
      const total_debit = 0;
      const total_balance = total_credit - total_debit;
      let status = "Unpaid";

      const virtualAccountData = {
        total_credit,
        total_debit,
        total_balance,
        status,
      };

      //DATA FOR CREDIT DEBIT HISTORY
      const billId = new mongoose.Types.ObjectId();
      const credit_debit_history_details = [
        {
          date,
          particular: `Bill No ${bill_no}`,
          credit: total,
          balance: total,
          bill_id: billId,
        },
      ];

      //ADDING BASE DATA IN  SELLER
      if (seller_stock_category === "Base") {
        const baseMeasurementData = normalizeBaseMeasurementData(measurementData);
        let stockData = [];
        if (toAddinStock === true) {
          baseMeasurementData.forEach((item) => {
            let { colour, measurement, roleQuantity, _id } = item;
            const totalQuantity = item.roleQuantity * item.measurement;
            const formattedCategory =
              category.charAt(0).toUpperCase() +
              category.slice(1).toLowerCase();
            const formattedColour =
              colour.charAt(0).toUpperCase() + colour.slice(1).toLowerCase();
            const duplicate = stockData.find(
              (stockItem) => stockItem.formattedColour === formattedColour
            );
            if (!duplicate) {
              stockData.push({
                formattedColour,
                totalQuantity,
                formattedCategory,
                _id
              });
            } else {
              duplicate.totalQuantity += totalQuantity;
            }
          });

          for (const stock of stockData) {
            const checkExistingStock = await BaseModel.findOne({
              category: stock.formattedCategory,
              colors: stock.formattedColour,
            }).session(session);
            let recordData = {
              category: stock.formattedCategory,
              colors: stock.formattedColour,
              Date: date,
              quantity: stock.totalQuantity,
              _id: stock._id
            };
            if (checkExistingStock) {
              const updatedTYm = checkExistingStock.TYm + stock.totalQuantity;
              (checkExistingStock.recently = stock.totalQuantity),
                (checkExistingStock.r_Date = date),
                (checkExistingStock.TYm = updatedTYm),
                checkExistingStock.all_Records.push(recordData);
              await checkExistingStock.save({ session });
            } else {
              await BaseModel.create(
                [
                  {
                    category: stock.formattedCategory,
                    colors: stock.formattedColour,
                    recently: stock.totalQuantity,
                    r_Date: date,
                    TYm: stock.totalQuantity,
                    all_Records: [recordData],
                  },
                ],
                { session }
              );
            }
          }
        }
        await Promise.all([
          SellersModel.create(
            [
              {
                bill_no,
                date,
                name,
                phone,
                category,
                quantity,
                rate,
                total,
                seller_stock_category,
                credit_debit_history: credit_debit_history_details,
                virtual_account: virtualAccountData,
              },
            ],
            { session }
          ),
          purchasing_History_model.create(
            [
              {
                _id: billId,
                seller_stock_category,
                bill_no,
                date,
                createdAt: billCreatedAt,
                name,
                category,
                quantity,
                rate,
                total,
                measurementData: baseMeasurementData,
                toAddinStock: Boolean(toAddinStock),
              },
            ],
            { session }
          ),
        ]);
      } else if (
        ["Lace", "Bag/box", "Accessories", "Suits"].includes(seller_stock_category)
      ) {
        let purchaseRows = [];
        if(seller_stock_category !== "Suits"){
         purchaseRows = measurementData && measurementData.length > 0
          ? normalizeMeasurementData(measurementData)
          : [] 
        } else {
          purchaseRows = normalizeSuitStockRows(measurementData);
        }
        //ADDING LACE OR BAG/BOX OR ACCESSORIES DATA IN STOCK
        switch (seller_stock_category) {
          case "Lace":
            const laceResult = await addLaceInStock({
              billId,
              bill_no,
              name,
              category,
              quantity,
              r_Date: date,
              session,
            });
            if (laceResult.error) throw new Error(laceResult.error);
            break;
          case "Accessories":
            const accessoriesResult = await addAccesoriesInStock({
              billId,
              serial_No: bill_no,
              name,
              r_Date: date,
              quantity,
              session,
              category,
            });
            if (accessoriesResult.error)
              throw new Error(accessoriesResult.error);
            break;
          case "Bag/box":
            const bagBoxResult = await addBagsAndBoxInStock({
              billId,
              name: category,
              bill_no,
              r_Date: date,
              quantity,
              session,
            });
            if (bagBoxResult.error) throw new Error(bagBoxResult.error);
            break;
          case "Suits":
              const suitResult = await addSuitsPurchaseInStock({
              billId,
              rows: purchaseRows,
              r_Date: date,
              session,
            });
             if (suitResult.error) throw new Error(suitResult.error);
            break;
          default:
            throw new Error("Invalid Category");
        }
        //ADDING SELLERS DATA
        await Promise.all([
          SellersModel.create(
            [
              {
                bill_no,
                date,
                name,
                phone,
                category,
                quantity,
                rate,
                total,
                seller_stock_category,
                credit_debit_history: credit_debit_history_details,
                virtual_account: virtualAccountData,
              },
            ],
            { session }
          ),
          purchasing_History_model.create(
            [
              {
                _id: billId,
                seller_stock_category,
                bill_no,
                date,
                createdAt: billCreatedAt,
                name,
                category,
                quantity,
                rate,
                total,
                measurementData: purchaseRows,
                ...(seller_stock_category === "Suits" && {toAddinStock: true})
              },
            ],
            { session }
          ),
        ]);
      }
    });
    return res
      .status(200)
      .json({ success: true, message: "Bill generated successfully" });
  } catch (error) {
    if (error.code === 11000 && error.keyValue.bill_no) {
      return res.status(409).json({
        error: "Bill No already in use. Please use another one",
      });
    } 
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const getSelleForPurchasingById = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Seller Id Required");
    const seller = await SellersModel.findById(id);
    if (!seller) throw new Error("Buyer Not Found");
    setMongoose();
    return res.status(200).json(seller);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllSellersForPurchasing = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    let name = req.query.name || "";
    let category = req.query.category || "";
    const status = req.query.status || "";

    let query = {};

    if (category) {
      query.seller_stock_category = category;
    }

    if (status) {
      query["virtual_account.status"] = status;
    }

    if (name) {
      query.name = name;
    }

    const namesQuery = { ...query };
    delete namesQuery.name;

    const [sellerNames, totalSellers, sellers] = await Promise.all([
      SellersModel.distinct("name", namesQuery),
      SellersModel.countDocuments(query),
      SellersModel.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ "virtual_account.status": -1, createdAt: -1 }),
    ]);

    const response = {
      sellers,
      sellerNames,
      page,
      limit,
      totalSellers,
      totalRecords: totalSellers,
      totalPages: Math.ceil(totalSellers / limit),
    };
    setMongoose();

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const validateAndGetOldSellerData = async (req, res, next) => {
  try {
    const { name, category } = req.body;
    if (!category) throw new Error("Missing Required fields");
    const query = {
      seller_stock_category: category,
    };

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    const oldSellerData = await SellersModel.find(query).sort({ name: 1 });
    setMongoose();
    return res.status(200).json({ success: true, oldSellerData });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const addInStockAndGeneraeSellerData_OLD = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const {
        sellerId,
        bill_no,
        date,
        name,
        phone,
        category,
        quantity,
        rate,
        total,
        seller_stock_category,
        measurementData,
        toAddinStock,
      } = req.body;

      //VALIDATING FIELDS
      const requiredFields = [
        "sellerId",
        "bill_no",
        "phone",
        "date",
        "name",
        "category",
        "quantity",
        "rate",
        "total",
        "seller_stock_category",
      ];
      const missingFields = [];
      requiredFields.forEach((field) => {
        if (req.body[field] === undefined || req.body[field] === null) {
          missingFields.push(field);
        }
      });
      if (missingFields.length > 0)
        throw new Error(`Missing Fields ${missingFields}`);
      const billCreatedAt = getBusinessDateObject(date);

      //GETTING OLD SELLER DATA
      const oldSellerData = await SellersModel.findById({ _id: sellerId });
      if (oldSellerData.seller_stock_category !== seller_stock_category)
        throw new Error("Invalid Stock Category For This Seller");

      //DATA FOR VIRTUAL ACCOUNT
      const {new_total_debit,new_total_credit,new_total_balance,new_status} = calculateAccountBalance({amount:total,oldAccountData:oldSellerData,credit:true});

      const virtualAccountData = {
        total_credit: new_total_credit,
        total_debit: new_total_debit,
        total_balance: new_total_balance,
        status: new_status,
      };

      //DATA FOR CREDIT DEBIT HISTORY
      const billId = new mongoose.Types.ObjectId();
      const credit_debit_history_details = [
        {
          date,
          particular: `Bill No ${bill_no}`,
          credit: total,
          balance: new_total_balance,
          bill_id:billId
        },
      ];

      //ADDING BASE DATA IN  SEELER
      if (
        seller_stock_category === "Base" &&
        oldSellerData.seller_stock_category === "Base"
      ) {
        const baseMeasurementData = normalizeBaseMeasurementData(measurementData);
        let stockData = [];
        if (toAddinStock === true) {
          baseMeasurementData.forEach((item) => {
            let { colour, measurement, roleQuantity, _id } = item;
            const totalQuantity = item.roleQuantity * item.measurement;
            const formattedCategory =
              category.charAt(0).toUpperCase() +
              category.slice(1).toLowerCase();
            const formattedColour =
              colour.charAt(0).toUpperCase() + colour.slice(1).toLowerCase();
            const duplicate = stockData.find((stockItem) => (
              stockItem.formattedColour === formattedColour
            ));
            if (!duplicate) {
              stockData.push({
                formattedColour,
                totalQuantity,
                formattedCategory,
                _id
              });
            } else {
              duplicate.totalQuantity += totalQuantity;
            }
          });
          for (const stock of stockData) {
            const checkExistingStock = await BaseModel.findOne({
              category: stock.formattedCategory,
              colors: stock.formattedColour,
            }).session(session);
            let recordData = {
              category: stock.formattedCategory,
              colors: stock.formattedColour,
              Date:date,
              quantity: stock.totalQuantity,
              _id: stock._id
            };
            if (checkExistingStock) {
              const updatedTYm = checkExistingStock.TYm + stock.totalQuantity;
              (checkExistingStock.recently = stock.totalQuantity),
                (checkExistingStock.r_Date = date),
                (checkExistingStock.TYm = updatedTYm),
                checkExistingStock.all_Records.push(recordData);
              await checkExistingStock.save({session});
            } else {
              await BaseModel.create([{
                category: stock.formattedCategory,
                colors: stock.formattedColour,
                recently: stock.totalQuantity,
                r_Date: date,
                TYm: stock.totalQuantity,
                all_Records: [recordData],
              }],{session});
            }
          }
        };
        await Promise.all([
          SellersModel.findByIdAndUpdate(
            sellerId,
            {
              bill_no,
              date,
              name,
              phone,
              category,
              quantity,
              rate,
              total,
              seller_stock_category,
              virtual_account: virtualAccountData,
              $push: {
                credit_debit_history: { $each: credit_debit_history_details },
              },
            },
            { session }
          ),
          purchasing_History_model.create(
            [
              {
                _id:billId,
                seller_stock_category,
                bill_no,
                date,
                createdAt: billCreatedAt,
                name,
                category,
                quantity,
                rate,
                total,
                measurementData: baseMeasurementData,
                toAddinStock: Boolean(toAddinStock),
              },
            ],
            { session }
          ),
        ]);
      } else if (
        ["Lace", "Bag/box", "Accessories", "Suits"].includes(seller_stock_category)
      ) {
        let purchaseRows = [];
        if(seller_stock_category !== "Suits") {
          purchaseRows = measurementData && measurementData.length > 0
          ? normalizeMeasurementData(measurementData)
          : [];
        } else {
           purchaseRows = normalizeSuitStockRows(measurementData);
        }

        //ADDING LACE OR BAG/BOX OR ACCESSORIES DATA IN STOCK
        switch (true) {
          case seller_stock_category === "Lace":
            const laceResult = await addLaceInStock({
              billId,
              bill_no,
              name,
              category,
              quantity,
              r_Date: date,
              session,
            });
            if (laceResult.error) throw new Error(laceResult.error);
            break;
          case seller_stock_category === "Accessories":
            const accessoriesResult = await addAccesoriesInStock({
              billId,
              serial_No: bill_no,
              name,
              r_Date: date,
              quantity,
              session,
              category,
            });
            if (accessoriesResult.error)
              throw new Error(accessoriesResult.error);
            break;
          case seller_stock_category === "Bag/box":
            const bagBoxResult = await addBagsAndBoxInStock({
              billId,
              name: category,
              bill_no,
              r_Date: date,
              quantity,
              session,
            });
            if (bagBoxResult.error) throw new Error(bagBoxResult.error);
            break;
              case seller_stock_category === "Suits":
              const suitResult = await addSuitsPurchaseInStock({
              billId,
              rows: purchaseRows,
              r_Date: date,
              session,
            });
             if (suitResult.error) throw new Error(suitResult.error);
            break;
          default:
            throw new Error("Invalid seller category");
        }

        //ADDING SELLERS DATA
        await Promise.all([
          SellersModel.findByIdAndUpdate(
            sellerId,
            {
              bill_no,
              date,
              name,
              phone,
              category,
              quantity,
              rate,
              total,
              seller_stock_category,
              $push: {
                credit_debit_history: { $each: credit_debit_history_details },
              },
              virtual_account: virtualAccountData,
            },

            { session }
          ),
          purchasing_History_model.create(
            [
              {
                _id:billId,
                seller_stock_category,
                bill_no,
                date,
                createdAt: billCreatedAt,
                name,
                category,
                quantity,
                rate,
                total,
                measurementData: purchaseRows,
                ...(seller_stock_category === "Suits" && {toAddinStock: true})
              },
            ],
            { session }
          ),
        ]);
      }
    });
    return res.status(200).json({ success: true, message: "Bill generated successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const getAllPurchasingHistory = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    let name = req.query.name || "";
    let category = req.query.category || "";
    let dateFrom = req.query.dateFrom || "";
    let dateTo = req.query.dateTo || "";

    let query = {};

    if (category) {
      query.seller_stock_category = category;
    }

    if (name) {
      query.name = name;
    }

    const dateRangeQuery = buildDateRangeQuery(dateFrom, dateTo);
    if (dateRangeQuery) {
      query.date = dateRangeQuery;
    }

    const [sellerNames, sellerHistory, sellers] = await Promise.all([
      purchasing_History_model.distinct(
        "name",
        category ? { seller_stock_category: category } : {},
      ),
      purchasing_History_model.countDocuments(query),
      purchasing_History_model
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
    ]);

    const response = {
      sellerHistory,
      sellerNames,
      page,
      limit,
      sellers,
      totalRecords: sellerHistory,
      totalPages: Math.ceil(sellerHistory / limit),
    };
    setMongoose();

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteSellerBillAndReverseStock = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { billId } = req.body;

      if (!billId)
        throw new Error('Bill id is missing');

      //GETTING BILL DATA
      const billData = await purchasing_History_model.findById({ _id: billId });
      if (!billData) throw new Error("Bill data not found");

      //GETTING OLD SELLER DATA
      const oldSellerData = await SellersModel.findOne({ name: billData.name });
      if (!oldSellerData) throw new Error("Seller data not found");

      const sellerId = oldSellerData._id;
      //DATA FOR VIRTUAL ACCOUNT
      const {new_total_debit,new_total_credit,new_total_balance,new_status} = calculateAccountBalance({amount:billData.total,oldAccountData:oldSellerData,credit:true,add:false});

      const virtualAccountData = {
        total_credit: new_total_credit,
        total_debit: new_total_debit,
        total_balance: new_total_balance,
        status: new_status,
      };

      //DATA FOR CREDIT DEBIT HISTORY
      const updated_credit_debit_history = oldSellerData.credit_debit_history.filter(
          (item) => item?.bill_id?.toString() !== billId
        );

      //ADDING BASE DATA IN  SEELER
      if (billData.seller_stock_category === "Base") {
        if(billData.toAddinStock) {
          const billRows = billData.measurementData || [];
          for (const row of billRows) {
            const {colour, rowQuantity, _id} = row;
            await reduceBaseStockQuantity({
               category: billData.category,
               colour,
               quantity:rowQuantity,
               session,
               rowId:_id,
            })
          } 
        }
        await Promise.all([
          SellersModel.findByIdAndUpdate(
            sellerId,
            {
              virtual_account: virtualAccountData,         
              credit_debit_history: updated_credit_debit_history,
              
            },
            { session }
          ),

          purchasing_History_model.findByIdAndDelete(billId).session(session),
        ]);
      } else if (
        ["Lace", "Bag/box", "Accessories", "Suits"].includes(
          billData.seller_stock_category
        )
      ) {
        //ADDING LACE OR BAG/BOX OR ACCESSORIES DATA IN STOCK
        const today = getTodayDate()
        switch (true) {
          case billData.seller_stock_category === "Lace":
            const laceResult = await removeLaceFromStock({
              billId,
              bill_no: billData.bill_no,
              name: billData.name,
              category: billData.category,
              quantity: billData.quantity,
              r_Date: today,
              session,
            });
            if (laceResult.error) throw new Error(laceResult.error);
            break;
          case billData.seller_stock_category === "Accessories":
            const accessoriesResult = await removeAccesoriesFromStock({
              billId,
              serial_No: billData.bill_no,
              name: billData.name,
              r_Date: today,
              quantity: billData.quantity,
              session,
              category: billData.category,
            });
            if (accessoriesResult.error)
              throw new Error(accessoriesResult.error);
            break;
          case billData.seller_stock_category === "Bag/box":
            const bagBoxResult = await removeBagsAndBoxFromStock({
              billId,
              name: billData.category,
              bill_no: billData.bill_no,
              r_Date: today,
              quantity: billData.quantity,
              session,
            });
            if (bagBoxResult.error) throw new Error(bagBoxResult.error);
            break;
          case billData.seller_stock_category === "Suits":
             const suitResult = await removeSuitPurchaseStockRows({
               billId,
               rows: billData.measurementData,
               session,
              });
               if (suitResult.error) throw new Error(bagBoxResult.error);
            break;
          default:
            throw new Error("Invalid Category");
        }

        //ADDING SELLERS DATA
        await Promise.all([
          SellersModel.findByIdAndUpdate(
            sellerId,
            {
              credit_debit_history: updated_credit_debit_history,
              virtual_account: virtualAccountData,
            },

            { session }
          ),
          purchasing_History_model.findByIdAndDelete(billId).session(session),
        ]);
      }
    });

    return res
      .status(200)
      .json({ success: true, message: "Successfully Deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const applyDiscountOnSellerAccount = async (req, res, next) => {
  try {
    const { id, amount, reason } = req.body;
    await verifyrequiredparams(req.body, ["id", "amount"]);
    const numericAmount = Number(amount);
    const accountData = await SellersModel.findById(id);

    if (!accountData) throw new CustomError("Account not found", 404);

    if (accountData.virtual_account.total_balance <= 0) {
      throw new CustomError("Invalid discount request", 400);
    }

    //UPDATING ACCOUNT STATUS

    const {new_total_debit,new_total_credit,new_total_balance,new_status} = calculateAccountBalance({amount:numericAmount,oldAccountData:accountData,credit:false});

    const virtualAccountData = {
        total_debit: new_total_debit,
        total_credit: new_total_credit,
        total_balance: new_total_balance,
        status: new_status,
      };

    
    const historydata = {
      date: getTodayDate(),
      particular: `Discount Entry/${reason}`,
      credit: 0,
      balance: new_total_balance,
      orderId: "",
      debit: amount,
    };

     (accountData.virtual_account = virtualAccountData),
      accountData.credit_debit_history.push(historydata);

      await accountData.save();

    return res.status(200).json({ success: true, message: "Discount applied successfully" });
  } catch (error) {
    next(error);
  }
};
