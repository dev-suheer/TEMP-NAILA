import CustomError from "../../config/errors/CustomError.js";
import { verifyrequiredparams } from "../../middleware/Common.js";
import { DailySaleModel } from "../../models/DailySaleModel.js";
import {
  OtherAccountsModel,
  OtherAccountsTransactionModel,
} from "../../models/OtherAccounts/OtherAccountsModel.js";
import { updateTotalCashForDateRange } from "../../services/DailySaleService.js";
import { getPaginationParams, getTodayDate, verifyPastDate } from "../../utils/Common.js";
import { cashBookService } from "../../services/CashbookService.js";
import { virtualAccountsService } from "../../services/VirtualAccountsService.js";
import mongoose from "mongoose";
import { CashbookTransactionSource, TransactionType } from "../../enums/cashbookk.enum.js";
import { PaymentMethod } from "../../enums/PaymentMethod.js";

export const createOtherAccount = async (req, res, next) => {
  try {
    await verifyrequiredparams(req.body, ["name", "city", "phone"]);
    await OtherAccountsModel.create(req.body);
    return res
      .status(201)
      .json({ success: true, message: "Account Created Successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAllOtherAccounts = async (req, res, next) => {
  try {
    const name = req.query.name || "";
    const { page, limit } = getPaginationParams(req.query);
    let query = {};
    if (name) {
      query = { name: { $regex: name, $options: "i" } };
    }
    const data = await OtherAccountsModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalDocuments = await OtherAccountsModel.countDocuments();
    const response = {
      data,
      page,
      limit,
      totalRecords: totalDocuments,
      totalPages: Math.ceil(totalDocuments / limit),
    };
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getOtherAccountDataById = async (req, res, next) => {
  try {
    const accountId = req.params.id;
    if (!accountId) {
      throw new CustomError("Account id is missing", 404);
    }
    const result = await OtherAccountsTransactionModel.find({
      accountId,
    }).populate("accountId", "name city phone total_balance");
    const { accountDetails, transactions } = result.reduce(
      (acc, item, index) => {
        if (index === 0) {
          const { name, city, phone, total_balance } = item.accountId;
          acc.accountDetails = {
            name,
            city,
            phone,
            total_balance,
          };
          
        }
          acc.transactions.push({
          debit: item.debit,
          credit: item.credit,
          balance: item.balance,
          payment_Method: item.payment_Method,
          reason: item.reason,
          date: item.date,
          id:item._id
        });

        return acc;
      },
      {
        accountDetails: null,
        transactions: []
      }
    );
    const response = {
      accountDetails,
      transactions,
    };
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const creditDebitOtherAccount = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const {
        transactionType,
        amount,
        date,
        reason,
        payment_Method,
        accountId,
        branchId,
      } = req.body;
      await verifyrequiredparams(req.body, [
        "transactionType",
        "amount",
        "date",
        "reason",
        "payment_Method",
        "accountId",
        "branchId",
      ]);
      let account = await OtherAccountsModel.findById(accountId).session(
        session
      );
      if (!account) throw new CustomError("Account not found", 404);
      const isPastDate = verifyPastDate(date);
      let transactionDetails = {};
      const newEntryId = new mongoose.Types.ObjectId();
      
      if (transactionType === "credit") {
        account.total_balance = account.total_balance + amount;

        //DATA FOR TRANSACTION DETAILS
        transactionDetails = {
          _id:newEntryId,
          date,
          reason: `${payment_Method}/${reason}`,
          credit: amount,
          balance: account.total_balance,
          accountId,
          payment_Method,
          branchId,
        };
      } else if (transactionType === "debit") {
        account.total_balance = account.total_balance - amount;;

        //DATA FOR TRANSACTION DETAILS
        transactionDetails = {
          _id:newEntryId,
          date,
          reason: `${payment_Method}/${reason}`,
          debit: amount,
          balance: account.total_balance,
          accountId,
          payment_Method,
          branchId,
        };
      }

      //UPDATING ACCOUNT AND TRANSACYIONS DATA
      await account.save({ session });
      await OtherAccountsTransactionModel.create([transactionDetails], {
        session,
      });

      //UPDATE DAILY SALES
      if (isPastDate && payment_Method === PaymentMethod.CASH) {
        const data = {
          date,
          branchId,
          amount,
          type:transactionType === "credit" ?  "add" : "subtract",
          session,
        };
        await updateTotalCashForDateRange(data);
      } else if (!isPastDate && payment_Method === PaymentMethod.CASH) {
        const dailySaleForToday = await DailySaleModel.findOne({
          branchId,
          date,
        }).session(session);
        if (!dailySaleForToday) {
          throw new CustomError(
            "Daily sale record not found for This Date",
            404
          );
        }
        const amountToDeduct = transactionType === "credit" ?  amount : -amount
          dailySaleForToday.totalCash = dailySaleForToday.saleData.totalCash +=
            amountToDeduct;
      
        await dailySaleForToday.save({ session });
      }

      //UPDATING VIRTUAL ACCOUNTS
      if (payment_Method !== PaymentMethod.CASH) {
        const data = {
          session,
          payment_Method,
          amount,
          transactionType: transactionType === "credit" ? "Deposit" : "WithDraw",
          date,
          note: `${transactionType} transaction for other account ${account.name}`,
          sourceId: newEntryId
        };
        await virtualAccountsService.makeTransactionInVirtualAccounts(data);
      }

      const dataForCashBook = {
        pastTransaction: isPastDate,
        branchId,
        amount,
        tranSactionType: transactionType === "credit" ? TransactionType.WITHDRAW : TransactionType.DEPOSIT,
        transactionFrom: CashbookTransactionSource.OTHER_ACCOUNTS,
        partyName: account.name,
        payment_Method,
        sourceId:newEntryId,
        category: CashbookTransactionSource.OTHER_ACCOUNTS,
        ...(isPastDate && { pastDate: date }),
        session,
      };
      await cashBookService.createCashBookEntry(dataForCashBook);
      return res.status(200).json({
        success: true,
        message: `${transactionType} tranaction successfull`,
      });
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

export const deleteOtherAccontsTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const id = req.params.id;
      if(!id) throw new CustomError("Transaction id is missing")
      const deleted = await OtherAccountsTransactionModel.findByIdAndDelete(
        id
      ).session(session);
      const {date,accountId,credit,debit,payment_Method,branchId} = deleted;
      const transactionType = credit > 0 ? "credit" : "debit";
      const amount = credit > 0 ? credit : debit;
      const isPastDate = verifyPastDate(date);
       let account = await OtherAccountsModel.findById(accountId).session(
        session
      );
      if (!account) throw new CustomError("Account not found", 404);
      if (transactionType === "credit") {
        account.total_balance = account.total_balance - amount;
      } else if (transactionType === "debit") {
        account.total_balance = account.total_balance + amount;
      }

      //UPDATING ACCOUNT 
      await account.save({ session });
     
      //UPDATE DAILY SALES
      if (isPastDate && payment_Method === PaymentMethod.CASH) {
        const data = {
          date,
          branchId,
          amount,
          type:transactionType === "credit" ?  "subtract" : "add",
          session,
        };
        await updateTotalCashForDateRange(data);
      } else if (!isPastDate && payment_Method === PaymentMethod.CASH) {
        const dailySaleForToday = await DailySaleModel.findOne({
          branchId,
          date,
        }).session(session);
        if (!dailySaleForToday) {
          throw new CustomError(
            "Daily sale record not found for This Date",
            404
          );
        }
        const amountToDeduct = transactionType === "credit" ?  -amount : amount
          dailySaleForToday.totalCash = dailySaleForToday.saleData.totalCash +=
            amountToDeduct;
      
        await dailySaleForToday.save({ session });
      }

      //UPDATING VIRTUAL ACCOUNTS
      if (payment_Method !== PaymentMethod.CASH) {
        const data = {
          session,
          payment_Method,
          amount,
          transactionType:
            transactionType === "credit" ? "WithDraw" : "Deposit",
          date: getTodayDate(),
          note: `${transactionType} transaction deleted for other account ${account.name}`,
          sourceId:id,
          isDelete: true
        };
        await virtualAccountsService.makeTransactionInVirtualAccounts(data);
      }

      const dataForCashBook = {
        id,
        session,
      };
      await cashBookService.deleteEntry(dataForCashBook);

      return res.status(200).json({
        success: true,
        message: `tranaction deleted successfull`,
      });
    });
  } catch (error) {
    next(error);
  }
};
