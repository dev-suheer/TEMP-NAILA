import mongoose from "mongoose";
import { BranchModel } from "../models/Branch.Model.js";
import { BagsAndBoxModel } from "../models/Stock/BagsAndBoxModel.js";
import { DailySaleModel } from "../models/DailySaleModel.js";
import {
  BuyersBillsModel,
  BuyersModel
} from "../models/BuyersModel.js";
import { ReturnSuitModel } from "../models/Returns/ReturnModel.js";
import { UserModel } from "../models/User.Model.js";
import { setMongoose } from "../utils/Mongoose.js";
import generatePDF from "../utils/GeneratePdf.js";
import moment from "moment-timezone";
import { virtualAccountsService } from "../services/VirtualAccountsService.js";
import { cashBookService } from "../services/CashbookService.js";
import { branchStockModel } from "../models/BranchStock/BranchSuitsStockModel.js";
import CustomError from "../config/errors/CustomError.js";
import { calculateBuyerAccountBalance } from "../utils/buyers.js";
import { CashbookTransactionAccounts, CashbookTransactionSource } from "../enums/cashbookk.enum.js";
import { buildDateRangeQuery, canDeleteRecord, getBusinessDateObject, getPaginationParams } from "../utils/Common.js";
import { verifyrequiredparams } from "../middleware/Common.js";
import { BillType } from "../enums/BillType.js";
import { B_PairExchangeModel } from "../models/Process/B_PairExchangeModel.js";
import {
  computeBPairHoldings,
  deductBPairStockForBill,
  restockBPairForDeletedBill,
} from "./Process/B_PairController.js";
import { PaymentMethod } from "../enums/PaymentMethod.js";

//TODAY
const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");

const getBillType = (bill_type) => {
  const billType = bill_type || BillType.MAIN;
  if (!Object.values(BillType).includes(billType)) {
    throw new Error("Invalid bill type");
  }
  return billType;
};

const deductStockForBill = async ({ billType, suits_data, session }) => {
  if (billType === BillType.B_PAIR) {
    return await deductBPairStockForBill({ suits_data, session });
  }

  const suitsIdsToDeduct = suits_data.map((suit) => suit.id);
  const suitsStock = await branchStockModel.find({ _id: suitsIdsToDeduct });
  if (!suitsStock.length) throw new Error("No suitsStock found");
  const bulkOps = suitsStock.map((suit) => {
    const suitToUpdate = suits_data.find((item) => item.id == suit._id);
    const updatedSuitQuantity = suit.total_quantity - suitToUpdate.quantity;
    const updatedSoldQuantity = suit.sold_quantity + suitToUpdate.quantity;
    if (updatedSuitQuantity < 0)
      throw new Error(
        `Not enough stock for suit with Design No: ${suit.d_no}`
      );
    return {
      updateOne: {
        filter: { _id: suit._id },
        update: {
          $set: {
            total_quantity: updatedSuitQuantity,
            sold_quantity: updatedSoldQuantity,
          },
        },
      },
    };
  });

  await branchStockModel.bulkWrite(bulkOps, { session });

  let TotalProfit = 0;
  let profitDataForHistory = [];
  suits_data.forEach((suit) => {
    const suitInStock = suitsStock.find((item) => item._id == suit.id);
    const profitOnSale = suit.price - suitInStock.cost_price;
    profitDataForHistory.push({
      d_no: suit.d_no,
      color: suit.color,
      category: suitInStock.category,
      stitch_type: suitInStock.stitch_type,
      sku: suitInStock.sku,
      suitId: suit.id,
      quantity: suit.quantity,
      suitSalePrice: suit.price,
      profit: profitOnSale,
      quantity_for_return: suit.quantity,
    });
    TotalProfit += profitOnSale * suit.quantity;
  });
  
  return { profitDataForHistory, TotalProfit };
};

export const generateBuyersBillandAddBuyer = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const {
        branchId,
        serialNumber,
        name,
        city,
        cargo,
        phone,
        date,
        bill_by,
        payment_Method,
        packaging,
        discount,
        suits_data,
        total,
        paid,
        remaining,
        other_Bill_Data,
        pastBill,
        bill_type,
      } = req.body;

      //VALIDATING FIELDS DATA
      const requiredFields = [
        "branchId",
        "serialNumber",
        "name",
        "city",
        "cargo",
        "phone",
        "date",
        "bill_by",
        "payment_Method",
        "discount",
        "suits_data",
        "total",
        "paid",
        "remaining",
      ];
      const missingFields = [];
      requiredFields.forEach((field) => {
        if (req.body[field] === undefined || req.body[field] === null) {
          missingFields.push(field);
        } else if (field === "suits_data") {
          if (suits_data.length < 1)
            throw new Error("Please Add Atleat 1 Suit");
          req.body.suits_data.forEach((suit, index) => {
            const requiredSuitFields = [
              "id",
              "d_no",
              "color",
              "quantity",
              "price",
            ];
            requiredSuitFields.forEach((suit_field) => {
              if (!suit[suit_field]) {
                missingFields.push(`${suit_field} for suit ${index + 1}`);
              }
            });
          });
        }
      });
      if (missingFields.length > 0)
        throw new Error(`Missing Fields ${missingFields}`);
      const billType = getBillType(bill_type);
      const billCreatedAt = getBusinessDateObject(date);
      const branch = await BranchModel.findOne({ _id: branchId }).session(
        session
      );

      //DEDUCTING BOXES FROM STOCK
      if (packaging) {
        const bagsorBoxStock = await BagsAndBoxModel.findById(
          packaging.id
        ).session(session);
        if (!bagsorBoxStock) throw new Error("Packaging Not Found");
        const updatedBagsorBoxQuantity =
          bagsorBoxStock.totalQuantity - parseInt(packaging.quantity);
        if (updatedBagsorBoxQuantity < 0)
          throw new Error(`Not Enough ${bagsorBoxStock.name} in Stock`);
        bagsorBoxStock.totalQuantity = updatedBagsorBoxQuantity;
        await bagsorBoxStock.save({ session });
      }

      //DEDUCTING SUITS FROM STOCK
      const { profitDataForHistory, TotalProfit } = await deductStockForBill({
        billType,
        suits_data,
        session,
      });

      //CHECK FUTURE DATE
      const isFutureDate = moment
        .tz(date, "Asia/Karachi")
        .isAfter(moment.tz(today, "Asia/Karachi"));

      //ADDING IN DAILY SALE AND HANDLING PAST SALE
      let dailySaleForToday = await DailySaleModel.findOne({
        branchId,
        date: { $eq: date },
      }).session(session);

      //PAST SALE HANDLING
      if (date !== today && !isFutureDate) {
        if (!dailySaleForToday) {
          //GET LAST CREATED SALE TOTAL CASH
          const totalCashFromLastSale = await findLastSaleBeforeDate(
            branchId,
            date,
            session
          );

          //CREATE NEW DAILY SALE FOR PAST DATE
          const newDailySale = new DailySaleModel({
            branchId,
            date,
            saleData: {
              totalCash: totalCashFromLastSale,
            },
          });
          await newDailySale.save({ session });
          dailySaleForToday = newDailySale;

          //UPDATING THE SALE BETWEEN PAST DATE AND TODAY

          if (payment_Method === PaymentMethod.CASH) {
            let currentDate = moment(date);
            const endDate = moment(today);

            while (currentDate.isBefore(endDate)) {
              currentDate.add(1, "days");
              const formattedDate = currentDate.format("YYYY-MM-DD");

              const dailySale = await DailySaleModel.findOne({
                branchId,
                date: formattedDate,
              }).session(session);

              if (dailySale) {
                // Step 4: Update existing sales
                console.log(`Updated existing sale for ${formattedDate}`);
                // Example update
                dailySale.saleData.totalCash +=
                  paid
                await dailySale.save({ session });
              } else {
                console.log(`No sale found for ${formattedDate}, skipping.`);
              }
            }
          }
        } else if (dailySaleForToday) {
          //IF DAILY SALE EXISTS FOR THAT PAST DATE

          //UPDATING THE SALE BETWEEN PAST DATE AND TODAY

          if (payment_Method === PaymentMethod.CASH) {
            let currentDate = moment(date);
            const endDate = moment(today);

            while (currentDate.isSameOrBefore(endDate)) {
              // Use `isSameOrBefore` for inclusive comparison
              const formattedDate = currentDate.format("YYYY-MM-DD");

              const dailySale = await DailySaleModel.findOne({
                branchId,
                date: formattedDate,
              }).session(session);

              if (dailySale) {
                // Update existing sales
                console.log(`Updated existing sale for ${formattedDate}`);
                dailySale.saleData.totalCash +=
                  paid 
                await dailySale.save({ session });
              } else {
                console.log(`No sale found for ${formattedDate}, skipping.`);
              }

              currentDate.add(1, "days"); // Increment to the next day
            }
          }
        }
      } else if (!dailySaleForToday && date === today) {
        throw new Error("Daily Sale Not Found For Today");
      } else if (!dailySaleForToday && isFutureDate) {
        throw new Error("Invalid future date error");
      }

      let updatedSaleData = {
        ...dailySaleForToday.saleData,
        [payment_Method]: (dailySaleForToday.saleData[payment_Method] +=
          paid),
        totalSale: (dailySaleForToday.saleData.totalSale += paid),
        todayBuyerCredit: (dailySaleForToday.saleData.todayBuyerCredit += paid),
        todayBuyerDebit: (dailySaleForToday.saleData.todayBuyerDebit +=
          remaining > 0 ? remaining : 0),
        totalProfit: (dailySaleForToday.saleData.totalProfit += TotalProfit),
      };

      if (payment_Method === PaymentMethod.CASH) {
        updatedSaleData.totalCash = dailySaleForToday.saleData.totalCash +=
          paid
      }

      dailySaleForToday.saleData = updatedSaleData;
      await dailySaleForToday.save({ session });

      //TOTAL AMOUNT PAID + OTHER BILL
      const totalAmount = paid 
      const billId = new mongoose.Types.ObjectId();

      //UPDATING VIRTUAL ACCOUNTS
      if (payment_Method !== PaymentMethod.CASH) {
        const data = {
          session,
          payment_Method,
          amount: totalAmount,
          transactionType: "Deposit",
          date,
          note: `Bill Generated For : ${name}`,
          sourceId: billId
        };
        await virtualAccountsService.makeTransactionInVirtualAccounts(data);
      };

      //PUSH DATA FOR CASH BOOK
      const dataForCashBook = {
        pastTransaction: pastBill,
        branchId,
        amount: totalAmount,
        tranSactionType: "Deposit",
        transactionFrom:
          billType === BillType.B_PAIR
            ? CashbookTransactionSource.B_PAIR
            : CashbookTransactionSource.BUYERS,
        partyName: name,
        payment_Method,
        sourceId:billId,
        category:CashbookTransactionAccounts.BUYERS,
        session,
        ...(pastBill && { pastDate: date }),
      };

      await cashBookService.createCashBookEntry(dataForCashBook);

      //DATA FOR VIRTUAL ACCOUNT OF BUYER
      const total_debit = total;
      const total_credit = paid;
      const total_balance = total_debit - total_credit;
      let status = "";

       switch (true) {
         case total_balance === 0:
           status = "Paid";
           break;
         case total_credit === 0:
           status = "Unpaid";
         case total_balance > 0:
           status = "Partially Paid";
           break;
         case total_balance < 0:
           status = "Advance Paid";
           break;
         default:
           throw new Error(
             "Wrong account balance calculation. Invalid account status"
           );
       }

      const virtualAccountData = {
        total_debit,
        total_credit,
        total_balance,
        status,
      };

      //DATA FOR CREDIT DEBIT HISTORY
      const credit_debit_history_details = [
        {
          date,
          particular: `Bill No ${serialNumber}`,
          debit: total,
          balance: total_balance,
          bill_id:billId
        },
      ];
      if (paid > 0) {
        credit_debit_history_details.push({
          date,
          particular: payment_Method,
          credit: paid,
          balance: total_balance,
          bill_id:billId
        });
      }

      //GENERATING AUTO SERIAL NUMBER
      const lastDocument = await BuyersModel.findOne()
        .sort({ _id: -1 })
        .select("autoSN")
        .session(session);

      const lastAutoSN = lastDocument ? lastDocument.autoSN : 0;

      //CREATING BUYER
      const buyerResult = await BuyersModel.create(
        [
          {
            branchId,
            serialNumber,
            autoSN: lastAutoSN + 1,
            name,
            city,
            cargo,
            phone,
            date,
            bill_by,
            payment_Method,
            packaging,
            discount,
            suits_data,
            virtual_account: virtualAccountData,
            credit_debit_history: credit_debit_history_details,
          },
        ],
        { session }
      );

      //CREATING BILL HISTORY
      await BuyersBillsModel.create(
        [
          {
            _id:billId,
            branchId,
            buyerId: buyerResult[0]._id,
            serialNumber,
            autoSN: lastAutoSN + 1,
            date,
            createdAt: billCreatedAt,
            name,
            phone,
            total,
            paid,
            remaining,
            TotalProfit,
            payment_Method,
            city,
            profitDataForHistory,
            bill_type: billType,
            ...(packaging && {packaging: {
              packaging_type:packaging.id,
              quantity: packaging.quantity
            }}),
            ...(other_Bill_Data ? { other_Bill_Data } : {}),
          },
        ],
        { session }
      );

      return res
        .status(200)
        .json({ succes: true, message: "Bill Generated Successfully" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const generateBillForOldbuyer = async (req, res, nex) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const {
        buyerId,
        branchId,
        serialNumber,
        name,
        city,
        cargo,
        phone,
        date,
        bill_by,
        payment_Method,
        packaging,
        discount,
        suits_data,
        total,
        paid,
        remaining,
        other_Bill_Data,
        pastBill,
        bill_type,
      } = req.body;

      //VALIDATING FIELDS DATA
      const requiredFields = [
        "buyerId",
        "branchId",
        "serialNumber",
        "name",
        "city",
        "cargo",
        "phone",
        "date",
        "bill_by",
        "payment_Method",
        "discount",
        "suits_data",
        "total",
        "paid",
        "remaining",
      ];
      const missingFields = [];
      requiredFields.forEach((field) => {
        if (req.body[field] === undefined || req.body[field] === null) {
          missingFields.push(field);
        } else if (field === "suits_data") {
          if (suits_data.length < 1)
            throw new Error("Please Add Atleat 1 Suit");
          req.body.suits_data.forEach((suit, index) => {
            const requiredSuitFields = [
              "id",
              "d_no",
              "color",
              "quantity",
              "price",
            ];
            requiredSuitFields.forEach((suit_field) => {
              if (!suit[suit_field]) {
                missingFields.push(`${suit_field} for suit ${index + 1}`);
              }
            });
          });
        }
      });
      if (missingFields.length > 0)
        throw new Error(`Missing Fields ${missingFields}`);
      const billType = getBillType(bill_type);
      const billCreatedAt = getBusinessDateObject(date);
      const branch = await BranchModel.findOne({ _id: branchId }).session(
        session
      );
      if (!branch) throw new Error("Branch Not Found");

      //DEDUCTING BAGS OR BOXES FROM STOCK
      if (packaging) {
        const bagsorBoxStock = await BagsAndBoxModel.findById(
          packaging.id
        ).session(session);
        if (!bagsorBoxStock) throw new Error("Packaging Not Found");
        const updatedBagsorBoxQuantity =
          bagsorBoxStock.totalQuantity - parseInt(packaging.quantity);
        if (updatedBagsorBoxQuantity < 0)
          throw new Error(`Not Enough ${bagsorBoxStock.name} in Stock`);
        bagsorBoxStock.totalQuantity = updatedBagsorBoxQuantity;
        await bagsorBoxStock.save({ session });
      }

      //DEDUCTING SUITS FROM STOCK
      const { profitDataForHistory, TotalProfit } = await deductStockForBill({
        billType,
        suits_data,
        session,
      });

      //CHECK FUTURE DATE
      const isFutureDate = moment
        .tz(date, "Asia/Karachi")
        .isAfter(moment.tz(today, "Asia/Karachi"));

      //ADDING IN DAILY SALE
      let dailySaleForToday = await DailySaleModel.findOne({
        branchId,
        date: { $eq: date },
      }).session(session);
      if (date !== today && !isFutureDate) {
        //IF NO DAILY SALE EXIST FOR THAT PAST DATE
        if (!dailySaleForToday) {
          //GET LAST CREATED SALE TOTAL CASH
          const totalCashFromLastSale = await findLastSaleBeforeDate(
            branchId,
            date,
            session
          );

          //CREATE NEW DAILY SALE FOR PAST DATE
          const newDailySale = new DailySaleModel({
            branchId,
            date,
            saleData: {
              totalCash: totalCashFromLastSale,
            },
          });
          await newDailySale.save({ session });
          dailySaleForToday = newDailySale;

          //UPDATING THE SALE BETWEEN PAST DATE AND TODAY

          if (payment_Method === PaymentMethod.CASH) {
            let currentDate = moment(date);
            const endDate = moment(today);

            while (currentDate.isBefore(endDate)) {
              currentDate.add(1, "days");
              const formattedDate = currentDate.format("YYYY-MM-DD");

              const dailySale = await DailySaleModel.findOne({
                branchId,
                date: formattedDate,
              }).session(session);

              if (dailySale) {
                // Step 4: Update existing sales
                console.log(`Updated existing sale for ${formattedDate}`);
                // Example update
                dailySale.saleData.totalCash += paid;
                await dailySale.save({ session });
              } else {
                console.log(`No sale found for ${formattedDate}, skipping.`);
              }
            }
          }
        } else if (dailySaleForToday) {
          //IF DAILY SALE EXISTS FOR THAT PAST DATE

          //UPDATING THE SALE BETWEEN PAST DATE AND TODAY

          if (payment_Method === PaymentMethod.CASH) {
            let currentDate = moment(date); // Start from the current date
            const endDate = moment(today); // Subtract 1 day to include up to `endDate - 1`

            while (currentDate.isSameOrBefore(endDate)) {
              // Use `isSameOrBefore` for inclusive comparison
              const formattedDate = currentDate.format("YYYY-MM-DD");

              const dailySale = await DailySaleModel.findOne({
                branchId,
                date: formattedDate,
              }).session(session);

              if (dailySale) {
                // Update existing sales
                console.log(`Updated existing sale for ${formattedDate}`);
                dailySale.saleData.totalCash += paid;
                await dailySale.save({ session });
              } else {
                console.log(`No sale found for ${formattedDate}, skipping.`);
              }

              currentDate.add(1, "days"); // Increment to the next day
            }
          }
        }
      } else if (!dailySaleForToday && date === today) {
        throw new Error("Daily Sale Not Found For Today");
      } else if (!dailySaleForToday && isFutureDate) {
        throw new Error("Invalid future date error");
      }

      //TOTAL AMOUNT PAID + OTHER BILL
      const totalAmount = paid;
      const billId = new mongoose.Types.ObjectId();

      //UPDATING VIRTUAL ACCOUNTS
      if (payment_Method !== PaymentMethod.CASH) {
        const data = {
          session,
          payment_Method,
          amount: totalAmount,
          transactionType: "Deposit",
          date,
          note: `Bill Generated For : ${name}`,
          sourceId: billId
        };
        await virtualAccountsService.makeTransactionInVirtualAccounts(data);
      }

      //PUSH DATA FOR CASH BOOK
      const dataForCashBook = {
        pastTransaction: pastBill,
        branchId,
        amount: totalAmount,
        tranSactionType: "Deposit",
        transactionFrom:
          billType === BillType.B_PAIR
            ? CashbookTransactionSource.B_PAIR
            : CashbookTransactionSource.BUYERS,
        partyName: name,
        payment_Method,
        sourceId: billId,
        category:CashbookTransactionAccounts.BUYERS,
        session,
        ...(pastBill && { pastDate: date }),
      };

      await cashBookService.createCashBookEntry(dataForCashBook);

      //UPDATING DAILY SALE

      const updatedSaleData = {
        ...dailySaleForToday.saleData,
        [payment_Method]: (dailySaleForToday.saleData[payment_Method] += paid),
        totalSale: (dailySaleForToday.saleData.totalSale += paid),
        todayBuyerCredit: (dailySaleForToday.saleData.todayBuyerCredit += paid),
        todayBuyerDebit: (dailySaleForToday.saleData.todayBuyerDebit +=
          remaining > 0 ? remaining : 0),
        totalProfit: (dailySaleForToday.saleData.totalProfit += TotalProfit),
      };

      if (payment_Method === PaymentMethod.CASH) {
        updatedSaleData.totalCash = dailySaleForToday.saleData.totalCash +=
          paid;
      }

      dailySaleForToday.saleData = updatedSaleData;
      await dailySaleForToday.save({ session });

      //GETTING BUYERS PREVIOUS DATA
      const buyerData = await BuyersModel.findById({ _id: buyerId }).session(
        session
      );
      if (!buyerData) throw new Error("Buyer data not found");

      //DATA FOR VIRTUAL ACCOUNT

      const { total_debit, total_credit, total_balance, status } =
        calculateBuyerAccountBalance({
          paid: paid,
          total: total,
          oldAccountData: buyerData.virtual_account,
        });

      const virtualAccountData = {
        total_debit,
        total_credit,
        total_balance,
        status,
      };

      //DATA FOR CREDIT DEBIT HISTORY
      const credit_debit_history_details = [
        {
          date,
          particular: `Bill No ${serialNumber}`,
          debit: total,
          balance: total_balance,
          bill_id:billId
        },
      ];
      if (paid > 0) {
        credit_debit_history_details.push({
          date,
          particular: payment_Method,
          credit: paid,
          balance: total_balance,
          bill_id:billId
        });
      }

      // UPDATING BUYER DATA
      await BuyersModel.findByIdAndUpdate(
        buyerId,
        {
          branchId,
          serialNumber,
          name,
          city,
          cargo,
          phone,
          date,
          bill_by,
          payment_Method,
          packaging,
          discount,
          virtual_account: virtualAccountData,
          $push: {
            credit_debit_history: { $each: credit_debit_history_details },
            suits_data: { $each: suits_data },
          },
        },
        { session }
      );

      //CREATING BILL HISTORY
      await BuyersBillsModel.create(
        [
          {
            _id:billId,
            branchId,
            buyerId: buyerData._id,
            serialNumber,
            autoSN: buyerData.autoSN,
            date,
            createdAt: billCreatedAt,
            name,
            phone,
            total,
            paid,
            remaining,
            TotalProfit,
            payment_Method,
            city,
            profitDataForHistory,
            bill_type: billType,
            ...(packaging && {packaging: {
              packaging_type:packaging.id,
              quantity: packaging.quantity
            }}),
            ...(other_Bill_Data ? { other_Bill_Data } : {}),
          },
        ],
        { session }
      );

      return res
        .status(200)
        .json({ succes: true, message: "Bill Generated Successfully" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const getBuyersForBranch = async (req, res, next) => {
  try {
    const { id } = req.body;
    const { page, limit } = getPaginationParams(req.query);
    let name = req.query.name || "";
    let branchQuery = req.query.branchId || "";
    const status = req.query.status || "";

    if (!id) throw new Error("User Id Required");
    const user = await UserModel.findById(id);
    if (!user) throw new Error("User Not Found");

    let query = {};

    if (user.role === "superadmin" && branchQuery) {
      query.branchId = branchQuery;
    } else if (user.role !== "superadmin") {
      query.branchId = user.branchId;
    }

    if (status) {
      query["virtual_account.status"] = status;
    }

    if (name) {
      query.name = name;
    }

    const namesQuery = { ...query };
    delete namesQuery.name;

    const [buyerNames, totalBuyers, buyers] = await Promise.all([
      BuyersModel.distinct("name", namesQuery),
      BuyersModel.countDocuments(query),
      BuyersModel.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ "virtual_account.status": -1, createdAt: -1 }),
    ]);

    const response = {
      buyers,
      buyerNames,
      page,
      limit,
      totalBuyers,
      totalRecords: totalBuyers,
      totalPages: Math.ceil(totalBuyers / limit),
    };
    setMongoose();

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const searchBuyersForBill = async (req, res, next) => {
  try {
    const name = req.query.name?.trim() || "";
    const role = req.user_role;
    const userBranchId = req.branch_id;

    if (!name) {
      return res.status(200).json({ buyers: [], totalRecords: 0 });
    }

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query = {
      name: { $regex: escapedName, $options: "i" },
    };

    if (role !== "superadmin") {
      if (!userBranchId) throw new Error("Branch Id Required");
      query.branchId = userBranchId;
    }

    const buyers = await BuyersModel.find(query)
      .select(
        "name city phone virtual_account.status virtual_account.total_balance createdAt",
      )
      .sort({
        "virtual_account.status": -1,
        createdAt: -1,
      });

    setMongoose();
    return res.status(200).json({ buyers, totalRecords: buyers.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getBuyerById = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Buyer Id Required");
    const buyer = await BuyersModel.findById(id);
    if (!buyer) throw new Error("Buyer Not Found");
    setMongoose();
    return res.status(200).json(buyer);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getBuyerBillDetails = async (req, res) => {
  try {
    const { billId } = req.body;
    let bill = null;
    if (billId && mongoose.Types.ObjectId.isValid(billId)) {
      bill = await BuyersBillsModel.findById(billId);
    }

    if (!bill) throw new Error("Bill details not found");

    const returnBills = await ReturnSuitModel.find({ bill_Id: bill._id }).sort({
      createdAt: -1,
    });

    let exchanges = [];
    let holdings = [];
    if (bill.bill_type === BillType.B_PAIR) {
      exchanges = await B_PairExchangeModel.find({ bill_Id: bill._id }).sort({
        createdAt: -1,
      });
      holdings = computeBPairHoldings(bill, exchanges);
    }

    setMongoose();
    return res.status(200).json({ bill, returnBills, exchanges, holdings });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const validateD_NoAndGetSuitData = async (req, res, next) => {
  try {
    const { d_no, branchId } = req.body;
    if (!d_no) throw new Error("D No Required");
    if (!branchId) throw new Error("Please Select Branch First");
    const branch = await BranchModel.findById(branchId);
    if (!branch) throw new Error("Branch Not Found");
    const suitData = branch.stockData.filter(
      (item) => item.d_no === parseInt(d_no)
    );
    if (!suitData) throw new Error("Suit Data Not Found");
    setMongoose();
    return res.status(200).json(suitData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const validateAndGetOldBuyerData = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) throw new Error("Buyer Name Required");
    const oldBuyerData = await BuyersModel.find({
      name: { $regex: name, $options: "i" },
    });
    if (!oldBuyerData) throw new Error("No Data Found With This Buyer Name");
    setMongoose();
    return res.status(200).json({ success: true, oldBuyerData });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const generatePdfFunction = async (req, res, next) => {
  try {
    const data = req.body;
    const pdfBuffer = await generatePDF(data.modifiedBillData);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${data.modifiedBillData.name}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.status(200).end(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

//BILLS OF A BUYER THAT STILL HAVE SUITS TO RETURN
export const getReturnableBillsForBuyer = async (req, res) => {
  try {
    const { buyerId } = req.body;
    if (!buyerId) throw new Error("Buyer Id Required");

    const bills = await BuyersBillsModel.find({
      buyerId,
      bill_type: { $ne: BillType.B_PAIR },
      "profitDataForHistory.quantity_for_return": { $gt: 0 },
    }).sort({ createdAt: -1 });

    setMongoose();
    return res.status(200).json(bills);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getBuyerBillHistoryForBranch = async (req, res, next) => {
  try {
    const id  = req.query.id;
    const role = req.user_role;
    if (!id) throw new Error("Branch Id Required");
    const name = req.query.name || "";
    const dateFrom = req.query.dateFrom || "";
    const dateTo = req.query.dateTo || "";
    const city = req.query.city || "";
    const { page, limit } = getPaginationParams(req.query);

    let query = {
      branchId: id,
    };

    if (name) {
      query.name = name;
    }

    const dateRangeQuery = buildDateRangeQuery(dateFrom, dateTo);
    if (dateRangeQuery) {
      query.date = dateRangeQuery;
    }

    if (city) {
      query.city = city;
    }

    const citiesQuery = { ...query };
    delete citiesQuery.city;

    const [buyerNames, buyerCities, totalDocuments, docs] = await Promise.all([
      BuyersBillsModel.distinct("name", { branchId: id }),
      BuyersBillsModel.distinct("city", citiesQuery),
      BuyersBillsModel.countDocuments(query),
      BuyersBillsModel.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
    ]);

      setMongoose();

      const data = docs.map((d) => d.toJSON());

    const updatedData = data.map((item) => ({
      ...item,
      canDelete: canDeleteRecord({
        role,
        date: item.createdAt,
        transactionFrom: CashbookTransactionSource.BUYERS,
        cashBookCase: false
      }),
    }));

    const response = {
      data:updatedData,
      buyerNames,
      buyerCities,
      page,
      limit,
      totalRecords: totalDocuments,
      totalPages: Math.ceil(totalDocuments / limit),
    };
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteBuyerBill = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const billId = req.params.billId;
      const billData = await BuyersBillsModel.findById(billId);

      if (!billData) {
        throw new CustomError("Bill record not found", 404);
      }
      if (billData.is_return_made) {
        throw new CustomError(
          "Delete not permitted. A return entry has already been made for this bill."
        );
      }

      //RESROCK PACKAGING
      if (billData.packaging.packaging_type !== null) {
        const packagingStock = await BagsAndBoxModel.findById(
          billData.packaging.packaging_type
        ).session(session);
        if (!packagingStock) throw new CustomError("Packaging not found", 404);
        const updatedBagsorBoxQuantity =
          packagingStock.totalQuantity + parseInt(billData.packaging.quantity);
        packagingStock.totalQuantity = updatedBagsorBoxQuantity;
        await packagingStock.save({ session });
      };

      //RESTOCK SUITS
      if (billData.bill_type === BillType.B_PAIR) {
        await restockBPairForDeletedBill({ bill: billData, session });
      } else {
        const suitsIds = billData.profitDataForHistory.map((suit) => suit.suitId);
        const suitsStock = await branchStockModel.find({ _id: suitsIds });
        if (!suitsStock.length)
          throw new CustomError("No suits stock found", 404);
        const bulkOps = suitsStock.map((suit) => {
          const suitToUpdate = billData.profitDataForHistory.find(
            (item) => item.suitId == suit._id
          );
          const updatedSuitQuantity = suit.total_quantity + suitToUpdate.quantity;
          const updatedSoldQuantity = suit.sold_quantity - suitToUpdate.quantity;
          return {
            updateOne: {
              filter: { _id: suit._id },
              update: {
                $set: {
                  total_quantity: updatedSuitQuantity,
                  sold_quantity: updatedSoldQuantity,
                },
              },
            },
          };
        });

        await branchStockModel.bulkWrite(bulkOps, { session });
      }

      //DAILY SALE,CASH METHOD AND VIRUAL ACCOUNTS CALCULATIONS

      //ADDING IN DAILY SALE AND HANDLING PAST SALE
      let saleRecordForSaleDate = await DailySaleModel.findOne({
        branchId: billData.branchId,
        date: billData.date ,
      }).session(session);

      const {payment_Method} = billData;

      if (payment_Method === PaymentMethod.CASH) {
        let currentDate = moment(billData.date);
        const endDate = moment(today);

        while (currentDate.isBefore(endDate)) {
          currentDate.add(1, "days");
          const formattedDate = currentDate.format("YYYY-MM-DD");

          const saleRecord = await DailySaleModel.findOne({
            branchId: billData.branchId,
            date: formattedDate,
          }).session(session);

          if (saleRecord) {
            console.log(`Updated existing sale for ${formattedDate}`);
            saleRecord.saleData.totalCash -= billData.paid;
            await saleRecord.save({ session });
          } else {
            console.log(`No sale found for ${formattedDate}, skipping.`);
          }
        }
      }

      let updatedSaleData = {
        ...saleRecordForSaleDate.saleData,
        [payment_Method]: (saleRecordForSaleDate.saleData[payment_Method] -=
          billData.paid),
        totalSale: (saleRecordForSaleDate.saleData.totalSale -= billData.paid),
        todayBuyerCredit: (saleRecordForSaleDate.saleData.todayBuyerCredit -=
          billData.paid),
        todayBuyerDebit: (saleRecordForSaleDate.saleData.todayBuyerDebit -=
          billData.remaining > 0 ? billData.remaining : 0),
        totalProfit: (saleRecordForSaleDate.saleData.totalProfit -=
          billData.TotalProfit),
      };

      if (payment_Method === PaymentMethod.CASH) {
        updatedSaleData.totalCash = saleRecordForSaleDate.saleData.totalCash -=
          billData.paid;
      };

      saleRecordForSaleDate.saleData = updatedSaleData;
      await saleRecordForSaleDate.save({ session });

      if (payment_Method !== PaymentMethod.CASH) {
        const data = {
          session,
          payment_Method: billData.payment_Method,
          amount: billData.paid,
          transactionType: "WithDraw",
          date: today,
          note: `Bill deleted For : ${billData.name}`,
          isDelete: true,
          sourceId: billId

        };
        await virtualAccountsService.makeTransactionInVirtualAccounts(data);
      };

      //PUSH DATA FOR CASH BOOK
      const dataForCashBook = {
        id:billData._id,
        session,
      };
      await cashBookService.deleteEntry(dataForCashBook);

      //UPDATE BUYERS ACCOUNT

      const buyerAccountData = await BuyersModel.findById(billData.buyerId);
      if(!buyerAccountData){
        throw new CustomError("Buyer account record not found", 404);
      };

      const { total_debit, total_credit, total_balance, status } = calculateBuyerAccountBalance({paid:billData.paid, total:billData.total, oldAccountData:buyerAccountData.virtual_account, deleteBill:true})

      const virtualAccountData = {
        total_debit,
        total_credit,
        total_balance,
        status,
      };

      buyerAccountData.virtual_account = virtualAccountData;
      buyerAccountData.credit_debit_history = buyerAccountData.credit_debit_history.filter((item) => item?.bill_id?.toString() !== billId);
      await buyerAccountData.save({session});

      //DELETE BUYER BILL
      await BuyersBillsModel.findByIdAndDelete(billId).session(session);

      return res.status(200).json({ succes:true, message: "Bill deleted successfull"})

    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

export const applyDiscountOnBuyersAccount = async (req, res, next) => {
  try {
    const { id, amount, reason } = req.body;
    await verifyrequiredparams(req.body, ["id", "amount"]);
    const numericAmount = Number(amount);
    const accountData = await BuyersModel.findById(id);

    if (!accountData) throw new CustomError("Account data not found", 404);

    if (accountData.virtual_account.total_balance <= 0) {
      throw new CustomError("Invalid discount request", 400);
    }

    //UPDATING ACCOUNT STATUS

    const { total_debit, total_credit, total_balance, status } =
        calculateBuyerAccountBalance({
          paid: amount,
          total: 0,
          oldAccountData: accountData.virtual_account,
        });
        
        //DATA FOR VIRTUAL ACCOUNT

        const virtualAccountData = {
          total_debit,
          total_credit,
          total_balance,
          status,
        };

        //DATA FOR CREDIT DEBIT HISTORY
        const credit_debit_history_details = {
          date:today,
          particular: `Discount Entry/${reason}`,
          credit: amount,
          balance: total_balance,
        };

        //UPDATING USER DATA IN DB
        accountData.virtual_account = virtualAccountData;
        accountData.credit_debit_history.push(
          credit_debit_history_details
        );

        await accountData.save();

    return res.status(200).json({ success: true, message: "Discount applied successfully" });
    
  } catch (error) {
    next(error);
  }
};


//COMMON
const findLastSaleBeforeDate = async (branchId, providedDate, session) => {
  const lastSale = await DailySaleModel.findOne({
    branchId,
    date: { $lt: providedDate },
  })
    .sort({ date: -1 })
    .session(session);

  if (!lastSale) {
    return 0;
  }
  return lastSale.saleData.totalCash || 0;
};
