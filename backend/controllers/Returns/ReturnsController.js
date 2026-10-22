import mongoose from "mongoose";
import { BuyersBillsModel, BuyersModel } from "../../models/BuyersModel.js";
import { DailySaleModel } from "../../models/DailySaleModel.js";
import { ReturnSuitModel } from "../../models/Returns/ReturnModel.js";
import { setMongoose } from "../../utils/Mongoose.js";
import { branchStockModel } from "../../models/BranchStock/BranchSuitsStockModel.js";
import { cashBookService } from "../../services/CashbookService.js";
import moment from "moment-timezone";
import { calculateBuyerAccountBalance } from "../../utils/buyers.js";
import { CashbookTransactionAccounts, CashbookTransactionSource, TransactionType } from "../../enums/cashbookk.enum.js";
import { getPaginationParams } from "../../utils/Common.js";
import { BillType } from "../../enums/BillType.js";
import { PaymentMethod } from "../../enums/PaymentMethod.js";

export const createReturn = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // CHECKING FOR REQUIRED FIELDS
      const {
        branchId,
        buyerId,
        partyName,
        serialNumber,
        phone,
        date,
        T_Return_Amount,
        Amount_From_Balance,
        Amount_Payable,
        bills,
        method,
      } = req.body;

      const requiredFields = [
        "branchId",
        "buyerId",
        "method",
        "partyName",
        "serialNumber",
        "phone",
        "date",
        "T_Return_Amount",
        "Amount_From_Balance",
        "Amount_Payable",
        "bills",
      ];

      const requiredSuitsFields = [
        "id",
        "d_no",
        "color",
        "category",
        "quantity",
        "price",
      ];
      const missingFields = [];

      requiredFields.forEach((field) => {
        if (req.body[field] === undefined || req.body[field] === null) {
          missingFields.push(field);
        }
      });

      if (!Array.isArray(bills) || bills.length === 0) {
        throw new Error("Please select at least one bill to return");
      }

      bills.forEach((bill, billIndex) => {
        if (!bill?.bill_Id) {
          missingFields.push(`Bill No ${billIndex + 1} is missing: bill_Id`);
        }
        if (!Array.isArray(bill?.suits_data) || bill.suits_data.length === 0) {
          missingFields.push(`Bill No ${billIndex + 1} has no suits to return`);
          return;
        }
        bill.suits_data.forEach((suit, index) => {
          const missingSuitFields = [];
          requiredSuitsFields.forEach((requiredField) => {
            if (!suit[requiredField]) {
              missingSuitFields.push(requiredField);
            }
          });
          if (missingSuitFields.length > 0) {
            missingFields.push(
              `Bill No ${billIndex + 1} Suit No ${index + 1} is missing: ${missingSuitFields}`
            );
          }
        });
      });

      if (missingFields.length > 0) {
        throw new Error(`Missing Fields: ${missingFields}`);
      }

      if (!["default-account", "account", "cash"].includes(method)) {
        throw new Error("Please select a valid method");
      }

      if (Amount_Payable > 0 && method === "default-account") {
        throw new Error("Please select a valid method");
      }

      const billIds = bills.map((bill) => String(bill.bill_Id));
      if (new Set(billIds).size !== billIds.length) {
        throw new Error("A bill is selected more than once");
      }

      //BILLS TO RETURN, IN THE ORDER THEY WERE SELECTED
      const buyerBills = await BuyersBillsModel.find({ _id: { $in: billIds } }).session(
        session
      );
      const returnBills = bills.map((bill) => {
        const buyerBill = buyerBills.find(
          (item) => String(item._id) === String(bill.bill_Id)
        );
        if (!buyerBill) {
          throw new Error("Bill not found");
        }
        if (String(buyerBill.buyerId) !== String(buyerId)) {
          throw new Error(
            `Bill S.N-${buyerBill.serialNumber} does not belong to this buyer`
          );
        }
        if (buyerBill.bill_type === BillType.B_PAIR) {
          throw new Error("B Pair bills cannot be returned. Please use exchange");
        }
        bill.suits_data.forEach((suit) => {
          if (
            !buyerBill.profitDataForHistory.some(
              (record) => record.suitId === suit.id
            )
          ) {
            throw new Error(
              `D# ${suit.d_no} (${suit.color}) is not part of bill S.N-${buyerBill.serialNumber}`
            );
          }
        });
        return {
          buyerBill,
          suits_data: bill.suits_data,
          amount: bill.suits_data.reduce(
            (total, suit) => total + Number(suit.price) * Number(suit.quantity),
            0
          ),
        };
      });

      const linesTotal = returnBills.reduce((total, bill) => total + bill.amount, 0);
      if (
        Math.abs(linesTotal - Number(T_Return_Amount)) > 0.01 ||
        Math.abs(
          Number(Amount_From_Balance) + Number(Amount_Payable) - Number(T_Return_Amount)
        ) > 0.01
      ) {
        throw new Error("Invalid return amounts. Please refresh and try again");
      }

      //ADDING RETURN QUANTITY BACK INTO STOCK
      const updateBranchStock = await branchStockModel.bulkWrite(
        returnBills
          .flatMap((bill) => bill.suits_data)
          .map((suit) => ({
            updateOne: {
              filter: { _id: suit.id },
              update: {
                $inc: {
                  total_quantity: suit.quantity,
                  sold_quantity: -suit.quantity,
                },
              },
            },
          })),
        { session }
      );

      if (updateBranchStock.modifiedCount === 0) {
        throw new Error("Failed to update stock");
      }

      //DEDUCTING TOTAL PROFIT FROM SALE DAY OF EACH BILL (BILLS OF ONE DAY SHARE ITS RECORD)
      const saleDays = new Map();
      for (const { buyerBill, suits_data } of returnBills) {
        const bill_Date = buyerBill.date;
        let dailySaleForSaleDay = saleDays.get(bill_Date);
        if (!dailySaleForSaleDay) {
          dailySaleForSaleDay = await DailySaleModel.findOne({
            branchId,
            date: bill_Date,
          }).session(session);

          if (!dailySaleForSaleDay) {
            throw new Error("Daily sale record not found for sale day");
          }
          saleDays.set(bill_Date, dailySaleForSaleDay);
        }
        let profitToDeduct = 0;
        let amounttodeductFromBillSale = 0;
        suits_data.forEach((suit) => {
          buyerBill.profitDataForHistory.forEach((record) => {
            if (record.suitId === suit.id) {
              suit.stitch_type = record.stitch_type;
              suit.sku = record.sku;
              const amount = record.profit * suit.quantity;
              profitToDeduct += amount;
              amounttodeductFromBillSale += record.suitSalePrice * suit.quantity;
              record.quantity_for_return -= suit.quantity;
              if (record.quantity_for_return < 0) {
                throw new Error(
                  `Not enough returnable quantity for (Category/${record.category},Color/${record.color})`
                );
              }
            }
          });
        });
        dailySaleForSaleDay.saleData.totalProfit -= profitToDeduct;
        dailySaleForSaleDay.saleData.totalSale -= amounttodeductFromBillSale;
        if (dailySaleForSaleDay.saleData.totalSale < 0) {
          throw new Error(
            `Invalid return request.Total sale for ${bill_Date} cannot be less then 0`
          );
        }
        buyerBill.is_return_made = true;
        await buyerBill.save({ session });
      }
      for (const dailySaleForSaleDay of saleDays.values()) {
        await dailySaleForSaleDay.save({ session });
      }

      //GET BUYER DETAILS
      const buyer = await BuyersModel.findById(buyerId).session(session);

      const futureDate = moment.tz(date, "Asia/Karachi").startOf("day");
      const now = moment.tz("Asia/Karachi").startOf("day");
      const isFutureDate = futureDate.isAfter(now);
      const isPastDate = futureDate.isBefore(now);
      if (isFutureDate) {
        throw new Error("Invalid Future Date");
      }

      //UPDATE BUYERS ACCOUNT: A CREDIT FOR EACH RETURNED BILL, THEN A DEBIT FOR CASH PAID OUT
      const isCashReturn = Amount_Payable > 0 && method === "cash";
      const billLabels = returnBills
        .map(({ buyerBill }) => `A.S.N-${buyerBill.autoSN}/S.N-${buyerBill.serialNumber}`)
        .join(", ");
      let accountData = buyer.virtual_account;
      const historyEntries = [];
      const addHistoryEntry = (entry, isCashOut = false) => {
        accountData = calculateBuyerAccountBalance({
          paid: entry.credit ?? entry.debit,
          total: 0,
          oldAccountData: accountData,
          isCashOut,
        });
        historyEntries.push({ ...entry, date, balance: accountData.total_balance });
      };

      returnBills.forEach(({ buyerBill, amount }) =>
        addHistoryEntry({
          particular: `Return payment for bill: A.S.N-${buyerBill.autoSN}/S.N-${buyerBill.serialNumber}`,
          credit: amount,
          bill_id: buyerBill._id,
        })
      );
      if (isCashReturn) {
        addHistoryEntry(
          {
            particular: `Cash payment for return bill: ${billLabels}`,
            debit: Amount_Payable,
            bill_id: returnBills[0].buyerBill._id,
          },
          true
        );
      }

      buyer.virtual_account = accountData;
      buyer.credit_debit_history.push(...historyEntries);
      await buyer.save({ session });

      if (isCashReturn) {
        //CURRENT DAY CASH DEDUCTION
        if (!isPastDate && !isFutureDate) {
          const dailySaleForToday = await DailySaleModel.findOne({
            branchId,
            date: date,
          }).session(session);
          if (!dailySaleForToday) {
            throw new Error("Daily sale record not found for selected date");
          }
          dailySaleForToday.saleData.totalCash -= Amount_Payable;
          if (dailySaleForToday.saleData.totalCash < 0) {
            throw new Error("Not enough total cash");
          }
          await dailySaleForToday.save({ session });
        }
        //PAST DATE CASH DEDUCTION
        else if (isPastDate) {
          const targetDate = moment.tz(date, "Asia/Karachi").startOf("day");
          const today = moment.tz("Asia/Karachi").startOf("day");

          const dateList = [];
          const current = moment(targetDate);
          while (current.isSameOrBefore(today)) {
            dateList.push(current.format("YYYY-MM-DD"));
            current.add(1, "day");
          }

          const dailySales = await DailySaleModel.find({
            branchId,
            date: { $in: dateList },
          }).session(session);

          if (dailySales.length !== dateList.length) {
            const foundDates = dailySales.map((d) => d.date);
            const missing = dateList.filter((d) => !foundDates.includes(d));
            throw new Error(
              `Missing daily dale records for: ${missing.join(", ")}`
            );
          }

          // Prepare bulk operations
          const bulkOps = dailySales.map((saleDoc) => {
            const update = {
              $inc: {
                "saleData.totalCash": -Amount_Payable,
              },
            };

            const futureCash = saleDoc.saleData.totalCash - Amount_Payable;
            if (futureCash < 0) {
              throw new Error(`Not enough cash available on ${saleDoc.date}`);
            }

            return {
              updateOne: {
                filter: { _id: saleDoc._id },
                update,
              },
            };
          });

          await DailySaleModel.bulkWrite(bulkOps, { session });
        }

        //PUSH DATA FOR CASH BOOK
        const dataForCashBook = {
          pastTransaction: isPastDate,
          branchId,
          amount: Amount_Payable,
          tranSactionType: TransactionType.WITHDRAW,
          transactionFrom: CashbookTransactionSource.RETURN_BILLS,
          partyName: returnBills[0].buyerBill.name,
          sourceId: returnBills[0].buyerBill._id,
          category:CashbookTransactionAccounts.BUYERS,
          payment_Method: PaymentMethod.CASH,
          session,
          ...(isPastDate && { pastDate: date }),
        };

        await cashBookService.createCashBookEntry(dataForCashBook);
      }

      //CREATING A RETURN SUIT BILL FOR EACH BILL (AMOUNT FROM BALANCE IS USED BY THE BILLS IN ORDER)
      let balanceLeft = Number(Amount_From_Balance);
      await ReturnSuitModel.create(
        returnBills.map(({ buyerBill, suits_data, amount }) => {
          const fromBalance = Math.min(amount, balanceLeft);
          balanceLeft -= fromBalance;
          return {
            branchId,
            buyerId,
            bill_Id: buyerBill._id,
            partyName,
            serialNumber,
            phone,
            date,
            T_Return_Amount: amount,
            Amount_From_Balance: fromBalance,
            Amount_Payable: amount - fromBalance,
            suits_data,
          };
        }),
        { session, ordered: true }
      );

      return res
        .status(200)
        .json({ success: true, message: "Return bill generated successfull" });
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
