import { BranchModel } from "../models/Branch.Model.js";
import { setMongoose } from "../utils/Mongoose.js";
import moment from "moment-timezone";
import { DailySaleModel } from "../models/DailySaleModel.js";
import mongoose from "mongoose";
import { sendEmail } from "../utils/nodemailer.js";
import { virtualAccountsService } from "../services/VirtualAccountsService.js";
import { cashBookService } from "../services/CashbookService.js";
import { BranchCashOutHistoryModel } from "../models/BranchStock/BranchCashOutHistory.js";
import { getPaginationParams, getTodayDate, verifyPastDate } from "../utils/Common.js";
import { updateTotalCashForDateRange } from "../services/DailySaleService.js";
import { PaymentMethod } from "../enums/PaymentMethod.js";


export const getTodaysdailySaleforBranch = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Id Not Found");
    const today = moment.tz("Asia/karachi").format("YYYY-MM-DD");
    const dailySale = await DailySaleModel.findOne({
      branchId: id,
      date: { $eq: today },
    });
    if (!dailySale) throw new Error("daily Sale Not Found");
    setMongoose();
    return res.status(200).json(dailySale);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getDailySaleHistoryForBranch = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Id Not Found");
    const date = req.query.search || "";

    const { page, limit } = getPaginationParams(req.query);

    let query = {
      branchId: id,
      date: { $regex: date, $options: "i" },
    };
    const totalDocuments = await DailySaleModel.countDocuments(query);
    const dailySaleHistory = await DailySaleModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const response = {
      dailySaleHistory,
      page,
      limit,
      totalRecords: totalDocuments,
      totalPages: Math.ceil(totalDocuments / limit),
    };
    setMongoose();
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getDailySaleById = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Id not Found");
    const dailySale = await DailySaleModel.findById(id);
    if (!dailySale) throw new Error("Daily Sale Not Found");
    setMongoose();
    return res.status(200).json(dailySale);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const cashOutForBranch = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { branchId, amount, payment_Method, date } = req.body;
      if (!branchId || !amount || !payment_Method || !date)
        throw new Error("Missing Required Fields");
      const branch = await BranchModel.findById(branchId).session(session);
      const today = getTodayDate();
      const isPastDate = verifyPastDate(date);

      //DEDUCTING AMOUNT FROM DAILY SALE
      if (isPastDate) {
        const data = {
          date,
          branchId,
          amount,
          type: "subtract",
          session,
        };
         await updateTotalCashForDateRange(data);
      } else if (!isPastDate) {
        const dailySaleForToday = await DailySaleModel.findOne({
          branchId,
          date: today,
        }).session(session);
        if (!dailySaleForToday) {
          throw new Error("Daily sale record not found for This Date");
        }
        dailySaleForToday.saleData.totalCash -= amount;
        if (dailySaleForToday.saleData.totalCash < 0) {
          throw new Error("Insufficient cash");
        }
        await dailySaleForToday.save({ session });
      }

      const headOffice = await BranchModel.findOne({
        branchName: "Head Office",
      });

      //UPDATING VIRTUAL ACCOUNTS
      if (payment_Method !== PaymentMethod.CASH) {
        const data = {
          session,
          payment_Method,
          amount,
          transactionType: "Deposit",
          date,
          note: `Recieved Amount From ${branch.branchName}`,
        };
        await virtualAccountsService.makeTransactionInVirtualAccounts(data);
      }

      //UPDATING TOTAL CASH FOR HEAD OFFICE
      else if (payment_Method === PaymentMethod.CASH) {
        if (!headOffice) throw new Error("Unable to find head office data ");
        if (isPastDate) {
          const targetDate = moment.tz(date, "Asia/Karachi").startOf("day");
          const today = moment.tz("Asia/Karachi").startOf("day");

          const dateList = [];
          const current = moment(targetDate);
          while (current.isSameOrBefore(today)) {
            dateList.push(current.format("YYYY-MM-DD"));
            current.add(1, "day");
          }

          const dailySales = await DailySaleModel.find({
            branchId: headOffice._id,
            date: { $in: dateList },
          }).session(session);

          if (dailySales.length !== dateList.length) {
            const foundDates = dailySales.map((d) => d.date);
            const missing = dateList.filter((d) => !foundDates.includes(d));
            throw new Error(
              `Missing Daily Sale records for: ${missing.join(", ")}`
            );
          }

          // Prepare bulk operations
          const bulkOps = dailySales.map((saleDoc) => {
            const update = {
              $inc: {
                "saleData.totalCash": amount,
              },
            };

            return {
              updateOne: {
                filter: { _id: saleDoc._id },
                update,
              },
            };
          });

          await DailySaleModel.bulkWrite(bulkOps, { session });
        } else {
          const dailySaleForHeadOffice = await DailySaleModel.findOne({
            branchId: headOffice._id,
            date: today,
          }).session(session);
          if (!dailySaleForHeadOffice)
            throw new Error("Cannot find daily sales for head office");
          dailySaleForHeadOffice.saleData.totalCash += amount;
          await dailySaleForHeadOffice.save({ session });
        }
      }

      //PUSH DATA FOR CASH BOOK FOR HEAD OFFICE
      const dataForCashBookHeadOffice = {
        pastTransaction: isPastDate,
        branchId: headOffice._id,
        amount,
        tranSactionType: "Deposit",
        transactionFrom: "Branch Cash Out",
        partyName: branch.branchName,
        payment_Method,
        ...(isPastDate && { pastDate: date }),

        session,
      };
      await cashBookService.createCashBookEntry(dataForCashBookHeadOffice);

      //PUSH DATA FOR CASH BOOK
      const dataForCashBook = {
        pastTransaction: isPastDate,
        branchId,
        amount,
        tranSactionType: "WithDraw",
        transactionFrom: "Branch Cash Out",
        partyName: headOffice.branchName,
        payment_Method,
        ...(isPastDate && { pastDate: date }),
        session,
      };
      await cashBookService.createCashBookEntry(dataForCashBook);

      //BRANCH CASH OUT HISTORY
      await BranchCashOutHistoryModel.create({
        branchId,
        amount,
        payment_Method,
        date: today
      });

      //SEND EMAIL
      const branchCashOutData = {
        branchName: branch.branchName,
        amount: amount,
        date: today,
        payment_Method: payment_Method,
      };
      await sendEmail({
        email: "offical@nailaarts.com",
        email_Type: "Branch Cash Out",
        branchCashOutData,
      });

      return res
        .status(200)
        .json({ success: true, message: "Cash Out Transaction Successfull" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession(session);
  }
};
