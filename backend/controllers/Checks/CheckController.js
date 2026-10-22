import mongoose from "mongoose";
import CustomError from "../../config/errors/CustomError.js";
import { verifyrequiredparams } from "../../middleware/Common.js";
import { CheckModel } from "../../models/Checks/CheckModel.js";
import { DailySaleModel } from "../../models/DailySaleModel.js";
import { BuyersModel } from "../../models/BuyersModel.js";
import { sendEmail } from "../../utils/nodemailer.js";
import { setMongoose } from "../../utils/Mongoose.js";
import moment from "moment-timezone";
import { virtualAccountsService } from "../../services/VirtualAccountsService.js";
import { cashBookService } from "../../services/CashbookService.js";
import { getTodayDate } from "../../utils/Common.js";
import { PaymentMethod } from "../../enums/PaymentMethod.js";

export const addBuyerCheck = async (req, res, next) => {
  try {
    const { buyerId, checkAmount, checkNumber, date, note } = req.body;
    await verifyrequiredparams(req.body, [
      "buyerId",
      "checkAmount",
      "checkNumber",
      "date",
      "note",
    ]);
    const checkData = {
      checkNumber,
      checkAmount,
      date,
      note,
    };
    //DIPLICATE CHECK
    const duplicateCheck = await CheckModel.findOne({ buyerId: buyerId });
    if (duplicateCheck) {
      duplicateCheck.checkDetails.push(checkData);
      await duplicateCheck.save();
    } else {
      await CheckModel.create({
        buyerId,
        checkDetails: [checkData],
      });
    }

    res
      .status(201)
      .json({ success: true, message: "Check added successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateBuyerCheckWithNew = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const {
        id,
        checkId,
        checkNumber,
        checkAmount,
        note,
        date,
        partialPayment,
        payment_Method,
        partialAmount,
      } = req.body;
      await verifyrequiredparams(req.body, [
        "id",
        "checkId",
        "checkNumber",
        "checkAmount",
        "note",
        "date",
      ]);
      if (checkAmount === 0) {
        throw new CustomError("Check Amount cannot be zero", 400);
      }
      if ((partialPayment && !payment_Method) || !partialAmount) {
        throw new CustomError(
          "Partial Payment and Payment Method are required",
          400
        );
      }
      //GET CHECK DATA
      const checkData = await CheckModel.findById(id).session(session);
      if (!checkData) {
        throw new CustomError("Check Data Not Found", 404);
      }

      //UPDATE CHECK
      const toUpdate = checkData.checkDetails.findIndex(
        (item) => item._id == checkId
      );
      if (toUpdate === -1) {
        throw new CustomError("Check Detail Not Found", 404);
      }
      checkData.checkDetails[toUpdate].updated = true;
      //NEW CHECK DATA
      const data = {
        checkNumber,
        checkAmount,
        date,
        note,
        newCheck: false,
      };
      //SAVE CHECK DETAILS
      checkData.checkDetails.splice(toUpdate + 1, 0, data);
      await checkData.save({ session });
      if (partialPayment) {
        //GET BUYER DATA
        const userDataToUpdate = await BuyersModel.findById(checkData.buyerId);
        if (!userDataToUpdate) {
          throw new CustomError("Buyer Data Not Found", 404);
        }

        //UPDATE DAILY SALE
        const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");
        const dailySaleForToday = await DailySaleModel.findOne({
          branchId: userDataToUpdate.branchId,
          date: today,
        }).session(session);
        if (!dailySaleForToday) {
          throw new CustomError(
            "Daily sale record not found for This Date",
            404
          );
        }

        const updatedSaleData = {
          ...dailySaleForToday.saleData,
          [payment_Method]: (dailySaleForToday.saleData[payment_Method] +=
            partialAmount),
          totalSale: (dailySaleForToday.saleData.totalSale += partialAmount),
          todayBuyerCredit: (dailySaleForToday.saleData.todayBuyerCredit +=
            partialAmount),
        };

        if (payment_Method === PaymentMethod.CASH) {
          updatedSaleData.totalCash = dailySaleForToday.saleData.totalCash +=
            partialAmount;
        }

        dailySaleForToday.saleData = updatedSaleData;
        await dailySaleForToday.save({ session });

        //UPDATING VIRTUAL ACCOUNTS
        if (payment_Method !== PaymentMethod.CASH) {
          const data = {
            session,
            payment_Method,
            amount: partialAmount,
            transactionType: "Deposit",
            date,
            note: `Check transaction For : ${userDataToUpdate.name}`,
          };
          await virtualAccountsService.makeTransactionInVirtualAccounts(data);
        }

        //PUSH DATA FOR CASH BOOK
        const dataForCashBook = {
          pastTransaction: false,
          branchId: userDataToUpdate.branchId,
          amount,
          tranSactionType: "Deposit",
          transactionFrom: "Checks",
          partyName: userDataToUpdate.name,
          payment_Method,
          session,
        };
        await cashBookService.createCashBookEntry(dataForCashBook);

        //UPDATING BUYER ACCOUNT

        const new_total_debit =
          userDataToUpdate.virtual_account.total_debit - partialAmount;
        const new_total_credit =
          userDataToUpdate.virtual_account.total_credit + partialAmount;
        const new_total_balance =
          userDataToUpdate.virtual_account.total_balance - partialAmount;
        let new_status;

        switch (true) {
          case new_total_balance === 0:
            new_status = "Paid";
            break;
          case new_total_balance === new_total_debit &&
            new_total_credit > 0 &&
            new_total_balance > 0:
            new_status = "Partially Paid";
            break;
          case new_total_credit === 0 && new_total_balance === new_total_debit:
            new_status = "Unpaid";
            break;
          case new_total_balance < 0:
            new_status = "Advance Paid";
            break;
          default:
            new_status = "";
        }

        const virtualAccountData = {
          total_debit: new_total_debit,
          total_credit: new_total_credit,
          total_balance: new_total_balance,
          status: new_status,
        };

        //DATA FOR CREDIT DEBIT HISTORY
        const credit_debit_history_details = {
          credit: partialAmount,
          date: today,
          particular: `Partial Check Payment  P.M/${payment_Method}`,
          debit: 0,
          balance:
            userDataToUpdate.virtual_account.total_balance - partialAmount,
        };

        //UPDATING USER DATA IN DB
        userDataToUpdate.virtual_account = virtualAccountData;
        userDataToUpdate.credit_debit_history.push(
          credit_debit_history_details
        );

        await userDataToUpdate.save({ session });
      }

      res
        .status(200)
        .json({ success: true, message: "New Check added successfully" });
    });
  } catch (error) {
    next(error);
  }
};

export const markCheckAsPaid = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { id, checkId, date, payment_Method } = req.body;
      await verifyrequiredparams(req.body, [
        "id",
        "checkId",
        "date",
        "payment_Method",
      ]);
      //GET CHECK DATA
      const checkData = await CheckModel.findById(id).session(session);
      if (!checkData) {
        throw new CustomError("Check Not Found", 404);
      }
      //VERIFY IF CHECK IS PAID
      if (checkData.status === "Paid") {
        throw new CustomError("Check is already paid", 400);
      }
      //UPDATE CHECK
      checkData.status = "Paid";
      checkData.paidAmount = checkData.totalAmount;
      const toUpdate = checkData.checkDetails.find(
        (item) => item._id == checkId
      );
      if (!toUpdate) {
        throw new CustomError("Check Detail Not Found", 404);
      }
      toUpdate.paid = true;
      await checkData.save({ session });

      //GET BUYER DATA
      const userDataToUpdate = await BuyersModel.findById(checkData.buyerId);
      if (!userDataToUpdate) {
        throw new CustomError("Buyer Data Not Found", 404);
      }

      //UPDATE DAILY SALE
      const dailySaleForToday = await DailySaleModel.findOne({
        branchId: userDataToUpdate.branchId,
        date,
      }).session(session);
      if (!dailySaleForToday) {
        throw new CustomError("Daily sale record not found for This Date", 404);
      }

      const updatedSaleData = {
        ...dailySaleForToday.saleData,
        [payment_Method]: (dailySaleForToday.saleData[payment_Method] +=
          toUpdate.checkAmount),
        totalSale: (dailySaleForToday.saleData.totalSale +=
          toUpdate.checkAmount),
        todayBuyerCredit: (dailySaleForToday.saleData.todayBuyerCredit +=
          toUpdate.checkAmount),
      };

      if (payment_Method === PaymentMethod.CASH) {
        updatedSaleData.totalCash = dailySaleForToday.saleData.totalCash +=
          toUpdate.checkAmount;
      }

      dailySaleForToday.saleData = updatedSaleData;
      await dailySaleForToday.save({ session });

      //UPDATING VIRTUAL ACCOUNTS
      if (payment_Method !== PaymentMethod.CASH) {
        const data = {
          session,
          payment_Method,
          amount: toUpdate.checkAmount,
          transactionType: "Deposit",
          date,
          note: `Check transaction For : ${userDataToUpdate.name}`,
        };
        await virtualAccountsService.makeTransactionInVirtualAccounts(data);
      }

      //PUSH DATA FOR CASH BOOK
      const dataForCashBook = {
        pastTransaction: false,
        branchId: userDataToUpdate.branchId,
        amount,
        tranSactionType: "Deposit",
        transactionFrom: "Checks",
        partyName: userDataToUpdate.name,
        payment_Method,
        session,
      };
      await cashBookService.createCashBookEntry(dataForCashBook);

      //UPDATING BUYER ACCOUNT

      const new_total_debit =
        userDataToUpdate.virtual_account.total_debit - toUpdate.checkAmount;
      const new_total_credit =
        userDataToUpdate.virtual_account.total_credit + toUpdate.checkAmount;
      const new_total_balance =
        userDataToUpdate.virtual_account.total_balance - toUpdate.checkAmount;
      let new_status;

      switch (true) {
        case new_total_balance === 0:
          new_status = "Paid";
          break;
        case new_total_balance === new_total_debit &&
          new_total_credit > 0 &&
          new_total_balance > 0:
          new_status = "Partially Paid";
          break;
        case new_total_credit === 0 && new_total_balance === new_total_debit:
          new_status = "Unpaid";
          break;
        case new_total_balance < 0:
          new_status = "Advance Paid";
          break;
        default:
          new_status = "";
      }

      const virtualAccountData = {
        total_debit: new_total_debit,
        total_credit: new_total_credit,
        total_balance: new_total_balance,
        status: new_status,
      };

      //DATA FOR CREDIT DEBIT HISTORY
      const credit_debit_history_details = {
        credit: toUpdate.checkAmount,
        date,
        particular: `Check Cashed P.M/${payment_Method}`,
        debit: 0,
        balance:
          userDataToUpdate.virtual_account.total_balance - toUpdate.checkAmount,
      };

      //UPDATING USER DATA IN DB
      userDataToUpdate.virtual_account = virtualAccountData;
      userDataToUpdate.credit_debit_history.push(credit_debit_history_details);

      await userDataToUpdate.save({ session });

      //SEND EMAIL FOR CHECK
      const checkPaidEmailData = {
        name: checkData.partyName,
        amount: toUpdate.checkAmount,
        date: date,
        payment_Method: payment_Method,
      };
      await sendEmail({
        email: "offical@nailaarts.com",
        email_Type: "Check Paid",
        checkPaidEmailData,
      });
      return res
        .status(200)
        .json({ success: true, message: "Check marked as paid successfully" });
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

export const getAllChecksForParty = async (req, res, next) => {
  try {
    const { buyerId } = req.body;
    await verifyrequiredparams(req.body, ["buyerId"]);
    const checkData = await CheckModel.findOne({ buyerId: buyerId });
    if (!checkData) {
      throw new CustomError("Check Data Not Found", 404);
    }
    setMongoose();
    res.status(200).json(checkData);
  } catch (error) {
    next(error);
  }
};

export const deleteCheck = async (req, res, next) => {
  try {
    const { id, checkId } = req.body;
    await verifyrequiredparams(req.body, ["checkId", "id"]);

    const checkData = await CheckModel.findById(id);
    if (!checkData) {
      throw new CustomError("Check Data Not Found", 404);
    }

    const checkIndex = checkData.checkDetails.findIndex(
      (item) => item._id.toString() === checkId
    );
    if (checkIndex === -1) {
      throw new CustomError("Check Detail Not Found", 404);
    }

    const toDelete = checkData.checkDetails[checkIndex];
    if (toDelete.updated || toDelete.paid) {
      throw new CustomError("Check cannot be deleted", 400);
    }

    let previousItem =
      checkIndex > 0 ? checkData.checkDetails[checkIndex - 1] : null;

    checkData.checkDetails.splice(checkIndex, 1);

    if (previousItem && !previousItem.paid) {
      previousItem.updated = false;
    }

    await checkData.save();

    res.status(200).json({ success: true, message: "Success" });
  } catch (error) {
    next(error);
  }
};

export const showNotificationsForChecks = async (req, res, next) => {
  try {
    const today = getTodayDate();
    const threeDaysAhead = moment
      .tz("Asia/Karachi")
      .add(3, "days")
      .format("YYYY-MM-DD");

    const all_Checks = await CheckModel.aggregate([
      {
        $match: {
          checkDetails: { $exists: true, $ne: [] },
        },
      },
      {
        $unwind: "$checkDetails",
      },
      {
        $match: {
          "checkDetails.paid": false,
          "checkDetails.updated": false,
          $or: [
            {
              "checkDetails.date": {
                $lte: threeDaysAhead,
              },
            },
            { "checkDetails.date": { $lt: today } },
          ],
        },
      },
      {
        $lookup: {
          from: "buyers",
          let: { buyerId: { $toObjectId: "$buyerId" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$buyerId"] } } }],
          as: "buyerDetails",
        },
      },
      {
        $unwind: "$buyerDetails",
      },
      {
        $project: {
          buyerId: 1,
          checkNumber: "$checkDetails.checkNumber",
          checkAmount: "$checkDetails.checkAmount",
          date: "$checkDetails.date",
          note: "$checkDetails.note",
          paid: "$checkDetails.paid",
          updated: "$checkDetails.updated",
          buyerName: "$buyerDetails.name",
          buyerPhone: "$buyerDetails.phone",
        },
      },
    ]);

    res.status(200).json({ success: true, data: all_Checks });
  } catch (error) {
    next(error);
  }
};
