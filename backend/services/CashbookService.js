import moment from "moment-timezone";
import { verifyrequiredparams } from "../middleware/Common.js";
import { cashBookServiceModel } from "../models/CashBookService/CashBookServiceModel.js";
import { setMongoose } from "../utils/Mongoose.js";
import { CashbookTransactionAccounts, CashbookTransactionSource, TransactionType } from "../enums/cashbookk.enum.js";
import CustomError from "../config/errors/CustomError.js";
import { BuyersModel } from "../models/BuyersModel.js";
import { processBillsModel } from "../models/Process/ProcessBillsModel.js";
import { SellersModel } from "../models/sellers/SellersModel.js";
import { PicruresAccountModel } from "../models/Process/PicturesModel.js";
import { calculateBuyerAccountBalance } from "../utils/buyers.js";
import { calculateAccountBalance } from "../utils/accounting.js";
import { canDeleteRecord } from "../utils/Common.js";
import { virtualAccountsService } from "./VirtualAccountsService.js";
import { DailySaleModel } from "../models/DailySaleModel.js";
import { CashInOutModel } from "../models/CashInOutModel.js";
import { PaymentMethod } from "../enums/PaymentMethod.js";

class cashBookHistoryService {
  getCurrentTime() {
    return moment.tz("Asia/Karachi").format("HH:mm");
  }

  getTodayDate() {
    return moment.tz("Asia/Karachi").format("YYYY-MM-DD");
  }

  async createCashBookEntry(data) {
    try {
      const {
        pastDate,
        pastTransaction,
        branchId,
        amount,
        tranSactionType,
        transactionFrom,
        partyName,
        payment_Method,
        sourceId,
        category,
        session,
      } = data;

      await verifyrequiredparams(data, [
        "branchId",
        "amount",
        "tranSactionType",
        "transactionFrom",
        "partyName",
        "payment_Method",
      ]);

      if (pastTransaction && !pastDate) {
        throw new Error("Past date is required for past transaction");
      }

      const result = await cashBookServiceModel.create(
        [
          {
            pastTransaction,
            branchId,
            amount,
            tranSactionType,
            transactionFrom,
            partyName,
            payment_Method,
            sourceId,
            category,
            transactionTime: this.getCurrentTime(),
            ...(!pastTransaction && { currentDate: this.getTodayDate() }),
            ...(pastTransaction && { pastDate: pastDate }),
          },
        ],
        { session }
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getAllCashBookEntries(req) {
    try {
      const dateFrom = req.query.dateFrom || "";
      const dateTo = req.query.dateTo || "";
      const account = req.query.account || "";
      const transactionType = req.query.transactionType || "";
      const userRole = req.user_role;
      const branchIdFromQuery = req.query.branchId || "";
      const role = req.user_role;
      let branchId = req.branch_id;

      let query = {};
      let dateQuery = [];

      if (dateFrom && dateTo) {
        dateQuery.push(
          { currentDate: { $gte: dateFrom, $lte: dateTo } },
          { pastDate: { $gte: dateFrom, $lte: dateTo } }
        );
      } else if (dateFrom) {
        dateQuery.push(
          { currentDate: { $eq: dateFrom } },
          { pastDate: { $eq: dateFrom } }
        );
      }

      if (dateQuery.length) {
        query.$or = dateQuery;
      }

      if (account) {
        query.payment_Method = account;
      }
      if (transactionType) {
        query.tranSactionType = transactionType;
      }

      if (userRole !== "superadmin") {
        query.branchId = branchId;
      }

      if (userRole === "superadmin" && branchIdFromQuery) {
        query.branchId = branchIdFromQuery;
      }

      const data = await cashBookServiceModel
        .find(query)
        .sort({ createdAt: -1 })
        .populate({
          path: "branchId",
          select: "branchName",
        })
        .lean();

      const updatedData = data.map((item) => ({
        ...item,
        canDelete: canDeleteRecord({
          role,
          date: item.createdAt,
          transactionFrom: item.transactionFrom,
        }),
      }));

      setMongoose();
      return updatedData;
    } catch (error) {
      throw error;
    }
  }

  async deleteEntry(data) {
    try {
      const { id, session } = data;
      await cashBookServiceModel
        .findOneAndDelete({ sourceId: id })
        .session(session);
    } catch (error) {
      throw error;
    }
  }

  async deleteCashBookRecord(data) {
    try {
      const { id, session } = data;
      const record = await cashBookServiceModel.findById(id).session(session);
      if (!record) throw new CustomError("No record data found", 404);

      const { category, sourceId } = record;
      const date = record.currentDate || record.pastDate;
      const payment_Method = record.payment_Method;
      const branchId = record.branchId;
      const isDeposit = record.tranSactionType === TransactionType.DEPOSIT;
      const amount = isDeposit ? -record.amount : record.amount;


      const modelBycategory = {
        [CashbookTransactionAccounts.BUYERS]: BuyersModel,
        [CashbookTransactionAccounts.PROCESS]: processBillsModel,
        [CashbookTransactionAccounts.SELLERS]: SellersModel,
        [CashbookTransactionAccounts.PICTURES]: PicruresAccountModel,
      };

      const Model = modelBycategory[category];
      if (!Model) throw new CustomError("Invalid account category", 400);
      const accountData = await Model.findById(sourceId).session(session);
      if (!accountData) throw new CustomError("Linked account with transaction not found", 404);

      if (category === CashbookTransactionAccounts.BUYERS) {
        const { total_debit, total_credit, total_balance, status } =
          calculateBuyerAccountBalance({
            paid: isDeposit ? record.amount : 0,
            total: isDeposit ? 0 : record.amount,
            oldAccountData: accountData.virtual_account,
            deleteBill: true,
          });

        const virtualAccountData = {
          total_debit,
          total_credit,
          total_balance,
          status,
        };
        accountData.virtual_account = virtualAccountData;
      } else {
        const {
          new_total_debit,
          new_total_credit,
          new_total_balance,
          new_status,
        } = calculateAccountBalance({
          amount: isDeposit ? record.amount : -record.amount,
          oldAccountData: accountData,
          credit: isDeposit ?? true,
          add:false,
        });
        const virtualAccountData = {
          total_credit: new_total_credit,
          total_debit: new_total_debit,
          total_balance: new_total_balance,
          status: new_status,
        };
        accountData.virtual_account = virtualAccountData;
      }

      //UPDATING DAILY SALES AND PAYMENT METHODS AMOUNT

      //GET DATES TO UPDATE
      const startDate = moment(date, "YYYY-MM-DD");
      const endDate = this.getTodayDate();
      let datesToUpdate = [];
      const current = startDate.clone();
      while (current.isSameOrBefore(endDate)) {
        datesToUpdate.push(current.format("YYYY-MM-DD"));
        current.add(1, "day");
      }

      //LOOP THROUGH ALL DATES TILL TODAY TO UPDATE TOTAL CASH
      if (payment_Method === PaymentMethod.CASH) {
        for (const item of datesToUpdate) {
          const dailySale = await DailySaleModel.findOne({
            branchId,
            date: item,
          }).session(session);
          if (!dailySale) {
            throw new CustomError(
              `Daily sale record not found for ${item}`,
              404
            );
          }
          dailySale.saleData.totalCash += amount;
          if (isDeposit && date === item) {
            dailySale.saleData[PaymentMethod.CASH] += amount;
            dailySale.saleData.totalSale += amount;
            if (category === CashbookTransactionAccounts.BUYERS) {
              dailySale.saleData.todayBuyerCredit += amount;
            }
          }

          if (dailySale.saleData.totalCash < 0) {
            throw new CustomError(`Not Enough Total Cash For ${item}`, 400);
          }
          await dailySale.save({ session });
        }
      }

      //UPDATING CASH IN OUT
      for (const date of datesToUpdate) {
        const cashInOutRecord = await CashInOutModel.findOne({
          branchId,
          date: date,
        }).session(session);
        if (!cashInOutRecord) {
          throw new CustomError("Cash In Out Not Found For Today", 404);
        }
        if (isDeposit) {
          cashInOutRecord.todayCashIn += amount;
        } else {
          cashInOutRecord.todayCashOut -= amount;
        }
        await cashInOutRecord.save({ session });
      }

      //UPDATING VIRTUAL ACCOUNTS AND DAILY SALE
      if (payment_Method !== PaymentMethod.CASH) {
        const data = {
          session,
          payment_Method,
          amount: record.amount,
          transactionType: isDeposit ? "WithDraw" : "Deposit",
          date: this.getTodayDate(),
          note: `Cash Book Transaction Deleted For : ${record.partyName}`,
          isDelete: true,
          sourceId: id 
        };
        await virtualAccountsService.makeTransactionInVirtualAccounts(data);
        if (isDeposit && category === CashbookTransactionAccounts.BUYERS) {
          const dailySale = await DailySaleModel.findOne({
            branchId,
            date: date,
          }).session(session);
          if (!dailySale) {
            throw new CustomError(
              `Daily sale record not found for ${date}`,
              404
            );
          }

          const updatedSaleData = {
            ...dailySale.saleData,
            [payment_Method]: (dailySale.saleData[payment_Method] += amount),
            todayBuyerCredit: (dailySale.saleData.todayBuyerCredit += amount),
            totalSale: (dailySale.saleData.totalSale += amount),
          };

          dailySale.saleData = updatedSaleData;
          await dailySale.save({ session });
        }
      }
      accountData.credit_debit_history =
        accountData.credit_debit_history.filter(
          (item) => item?.bill_id?.toString() !== id
        );
      await accountData.save({ session });
      await cashBookServiceModel.findByIdAndDelete(id).session(session);
    } catch (error) {
      throw error;
    }
  }
}

export const cashBookService = new cashBookHistoryService();
