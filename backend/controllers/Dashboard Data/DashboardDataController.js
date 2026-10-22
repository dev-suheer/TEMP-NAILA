import { BranchModel } from "../../models/Branch.Model.js";
import { BuyersBillsModel, BuyersModel } from "../../models/BuyersModel.js";
import { BillType } from "../../enums/BillType.js";
import { SellersModel } from "../../models/sellers/SellersModel.js";
import { DailySaleModel } from "../../models/DailySaleModel.js";
import { SuitsModel } from "../../models/Stock/Suits.Model.js";
import { UserModel } from "../../models/User.Model.js";
import { OtpModel } from "../../models/Otp.Model.js";
import moment from "moment-timezone";
import {
  validateOneMinuteExpiry,
  validateOtp,
} from "../../middleware/ValidateOtp.js";
import { sendEmail } from "../../utils/nodemailer.js";
import jwt from "jsonwebtoken";
import {
  VA_HistoryModal,
  VirtalAccountModal,
} from "../../models/DashboardData/VirtalAccountsModal.js";
import { setMongoose } from "../../utils/Mongoose.js";
import { virtualAccountsService } from "../../services/VirtualAccountsService.js";
import mongoose from "mongoose";
import CustomError from "../../config/errors/CustomError.js";
import { getPaginationParams } from "../../utils/Common.js";
import { processBillsModel } from "../../models/Process/ProcessBillsModel.js";
import { PicruresAccountModel } from "../../models/Process/PicturesModel.js";
import { PaymentMethod } from "../../enums/PaymentMethod.js";


export const getDashBoardDataForBranch = async (req, res, next) => {
  try {
    const id = req.session.userId;
    if (!id) {
      return res.status(403).send({ message: "Please Login Again" });
    }
    const user = await UserModel.findById({ _id: id });
    if (!user.branchId) throw new Error("No branch Data For Authorized User");
    const branch = await BranchModel.findById({ _id: user.branchId });
    if (!branch) {
      return res
        .status(404)
        .send({ message: "No branch Data For Authorized User" });
    }

    //RECIEVEABLE AND SALES BY LOCATION DATA

    const buyers = await BuyersModel.find({ branchId: user.branchId });
    let recieveableSum = 0;
    let saleLocationData = [];
    buyers.forEach((buyer) => {
      recieveableSum += buyer.virtual_account.total_balance;
      const verifyCity = saleLocationData.find(
        (item) => item.city.name.toLowerCase() === buyer.city.toLowerCase()
      );
      if (!verifyCity) {
        saleLocationData.push({
          city: {
            name: buyer.city,
            value: 1,
          },
        });
      } else {
        verifyCity.city.value += 1;
      }
    });

    //SALES DATA , BANK DATA AND CASH IN HAND

    //daily sale and difference from yesterday
    const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");
    const yesterday = moment
      .tz("Asia/Karachi")
      .subtract(1, "day")
      .format("YYYY-MM-DD");
    const previousDaySale = await DailySaleModel.findOne({
      branchId: user.branchId,
      date: yesterday,
    });
    const dailySaleForToday = await DailySaleModel.findOne({
      branchId: user.branchId,
      date: today,
    });
    const sumoftodaysale = dailySaleForToday
      ? dailySaleForToday.saleData.totalSale
      : 0;
    const sumofyesterdaysale = previousDaySale
      ? previousDaySale.saleData.totalSale
      : 0;
    const dailySaleData = {
      today: sumoftodaysale,
      differenceFromYesterday: sumoftodaysale - sumofyesterdaysale,
      percentage:
        sumofyesterdaysale === 0
          ? sumoftodaysale === 0
            ? 0
            : 100
          : Math.round(
              ((sumoftodaysale - sumofyesterdaysale) / sumofyesterdaysale) * 100
            ),
    };

    //monthly and yearly sale and difference from previous month and year
    const currentMonth = moment.tz("Asia/Karachi").format("YYYY-MM");
    const currentyear = moment.tz("Asia/Karachi").format("YYYY");
    const previousYear = moment
      .tz("Asia/Karachi")
      .subtract(1, "year")
      .format("YYYY");
    const previousMonth = moment
      .tz("Asia/Karachi")
      .subtract(1, "month")
      .format("YYYY-MM");
    const currentMonthAndYearSale = await DailySaleModel.aggregate([
      {
        $match: {
          branchId: user.branchId,
          date: { $regex: `^${currentyear}` },
        },
      },
      {
        $facet: {
          yearlyGrossSale: [
            {
              $group: {
                _id: null,
                totalSale: { $sum: "$saleData.totalSale" },
              },
            },
          ],
          yearlyGrossProfit: [
            {
              $group: {
                _id: null,
                totalProfit: { $sum: "$saleData.totalProfit" },
              },
            },
          ],
          monthlyGrossSale: [
            {
              $match: {
                branchId: user.branchId,
                date: { $regex: `^${currentMonth}` },
              },
            },
            {
              $group: {
                _id: null,
                totalSale: { $sum: "$saleData.totalSale" },
              },
            },
          ],
        },
      },
    ]);

    const previousMonthAndYearlysale = await DailySaleModel.aggregate([
      {
        $facet: {
          yearlyGrossSale: [
            {
              $match: {
                branchId: user.branchId,
                date: { $regex: `^${previousYear}` },
              },
            },
            {
              $group: {
                _id: null,
                totalSale: { $sum: "$saleData.totalSale" },
              },
            },
          ],
          yearlyGrossProfit: [
            {
              $match: {
                branchId: user.branchId,
                date: { $regex: `^${previousYear}` },
              },
            },
            {
              $group: {
                _id: null,
                totalProfit: { $sum: "$saleData.totalProfit" },
              },
            },
          ],
          monthlyGrossSale: [
            {
              $match: {
                branchId: user.branchId,
                date: { $regex: `^${previousMonth}` },
              },
            },
            {
              $group: {
                _id: null,
                totalSale: { $sum: "$saleData.totalSale" },
              },
            },
          ],
        },
      },
    ]);

    //monthly sale data

    const currentMonthSale =
      currentMonthAndYearSale[0].monthlyGrossSale.length > 0
        ? currentMonthAndYearSale[0].monthlyGrossSale[0].totalSale
        : 0;

    const lastMonthSale =
      previousMonthAndYearlysale[0].monthlyGrossSale.length > 0
        ? previousMonthAndYearlysale[0].monthlyGrossSale[0].totalSale
        : 0;

    const monthlySaleData = {
      currentMonthSale: currentMonthSale,
      differenceFromLastMonth: currentMonthSale - lastMonthSale,
      percentage:
        lastMonthSale === 0
          ? currentMonthSale === 0
            ? 0
            : 100
          : Math.round(
              ((currentMonthSale - lastMonthSale) / lastMonthSale) * 100
            ),
    };

    //yearly sale data

    const currentYearData =
      currentMonthAndYearSale[0].yearlyGrossSale.length > 0
        ? currentMonthAndYearSale[0].yearlyGrossSale[0].totalSale
        : 0;

    const previousYearData =
      previousMonthAndYearlysale[0].yearlyGrossSale.length > 0
        ? previousMonthAndYearlysale[0].yearlyGrossSale[0].totalSale
        : 0;

    const yearlySaleData = {
      currentyearSale: currentYearData,
      differenceFromLastYear: currentYearData - previousYearData,
      percentage:
        previousYearData === 0
          ? currentYearData === 0
            ? 0
            : 100
          : Math.round(
              ((currentYearData - previousYearData) / previousYearData) * 100
            ),
    };

    //yearly gross profit

    const currentYearProfit =
      currentMonthAndYearSale[0].yearlyGrossProfit.length > 0
        ? currentMonthAndYearSale[0].yearlyGrossProfit[0].totalProfit
        : 0;

    const lastYearProfit =
      previousMonthAndYearlysale[0].yearlyGrossProfit.length > 0
        ? previousMonthAndYearlysale[0].yearlyGrossProfit[0].totalProfit
        : 0;

    const yearlyGrossProfitData = {
      currentYearGrossProfit: currentYearProfit,
      differenceFromLastyear: currentYearProfit - lastYearProfit,
      percentage:
        lastYearProfit !== 0
          ? Math.round(
              ((currentYearProfit - lastYearProfit) / lastYearProfit) * 100
            )
          : 0,
    };

    //banks data

    const banksDataRaw = await VirtalAccountModal.findOne();
    const plainData = banksDataRaw.toObject();
    let banksData = [];
    for (const key in plainData) {
      if (banksDataRaw.hasOwnProperty(key) && key !== PaymentMethod.CASH) {
        const data = { name: key, value: banksDataRaw[key] };
        banksData.push(data);
      }
    }

    //cash in hand data
    const cashInHandData = dailySaleForToday.saleData.totalCash || 0;

    //MOTHLY SALES DATA FOR GRAPH
    const salesForEveryMonth = await DailySaleModel.aggregate([
      {
        $match: {
          branchId: user.branchId,
          date: { $regex: `^${currentyear}` },
        },
      },
      {
        $group: {
          _id: {
            month: { $substr: ["$date", 5, 2] },
          },
          totalSale: { $sum: "$saleData.totalSale" },
        },
      },
      {
        $sort: {
          "_id.month": 1,
        },
      },
      {
        $project: {
          month: "$_id.month",
          totalSale: 1,
          _id: 0,
        },
      },
    ]);

    //TOTAL SUITS DATA
    const projection = "category quantity color stitch_type";
    const totalSuitsData = await SuitsModel.find({}, projection).sort({
      createdAt: -1,
    });

    let dashBoardData = {
      salesBylocation: saleLocationData,
      bankAccountsData: banksData,
      cashInHand: cashInHandData,
      totalSuits: totalSuitsData,
      recieveable: recieveableSum,
      dailySale: dailySaleData,
      monthlysale: monthlySaleData,
      grossSale: yearlySaleData,
      grossProfit: yearlyGrossProfitData,
      monthlyGraphData: salesForEveryMonth,
    };

    return res.status(200).json(dashBoardData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getDashBoardDataForSuperAdmin = async (req, res, next) => {
  try {
    //RECIEVEABLE AND SALES BY LOCATION DATA

    const buyers = await BuyersModel.find({});
    let recieveableSum = 0;
    let saleLocationData = [];
    buyers.forEach((buyer) => {
      recieveableSum += buyer.virtual_account.total_balance;
      const verifyCity = saleLocationData.find(
        (item) => item.city.name.toLowerCase() === buyer.city.toLowerCase()
      );
      if (!verifyCity) {
        saleLocationData.push({
          city: {
            name: buyer.city,
            value: 1,
          },
        });
      } else {
        verifyCity.city.value += 1;
      }
    });

    //PAYABLE DATA

    const sellers = await SellersModel.find({});
    let payableSum = 0;
    sellers.forEach((seller) => {
      payableSum += seller.virtual_account.total_balance;
    });

    //SALES DATA , BANK DATA AND CASH IN HAND

    //daily sale and difference from yesterday

    const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");
    const yesterday = moment
      .tz("Asia/Karachi")
      .subtract(1, "day")
      .format("YYYY-MM-DD");

    //Today's total sales
    const [todaySalesResult] = await DailySaleModel.aggregate([
      { $match: { date: today } },
      {
        $facet: {
          totalSale: [
            {
              $group: { _id: null, totalSale: { $sum: "$saleData.totalSale" } },
            },
          ],
          totalCash: [
            {
              $group: { _id: null, totalCash: { $sum: "$saleData.totalCash" } },
            },
          ],
        },
      },
    ]);

    //Yesterday's total sales
    const [yesterdaySalesResult] = await DailySaleModel.aggregate([
      { $match: { date: yesterday } },
      { $group: { _id: null, totalSale: { $sum: "$saleData.totalSale" } } },
    ]);

    const todaySaleData =
      todaySalesResult.totalSale.length > 0
        ? todaySalesResult.totalSale[0].totalSale
        : 0;
    const yesterdaySaleData = yesterdaySalesResult
      ? yesterdaySalesResult.totalSale
      : 0;

    const dailySaleData = {
      today: todaySaleData,
      differenceFromYesterday: todaySaleData - yesterdaySaleData,
      percentage:
        yesterdaySaleData === 0
          ? todaySaleData === 0
            ? 0
            : 100
          : Math.round(
              ((todaySaleData - yesterdaySaleData) / yesterdaySaleData) * 100
            ),
    };

    //monthly and yearly sale and difference from previous month and year
    const currentMonth = moment.tz("Asia/Karachi").format("YYYY-MM");
    const currentyear = moment.tz("Asia/Karachi").format("YYYY");
    const previousYear = moment
      .tz("Asia/Karachi")
      .subtract(1, "year")
      .format("YYYY");
    const previousMonth = moment
      .tz("Asia/Karachi")
      .subtract(1, "month")
      .format("YYYY-MM");
    const currentMonthAndYearSale = await DailySaleModel.aggregate([
      {
        $match: {
          date: { $regex: `^${currentyear}` },
        },
      },
      {
        $facet: {
          yearlyGrossSale: [
            {
              $group: {
                _id: null,
                totalSale: { $sum: "$saleData.totalSale" },
              },
            },
          ],
          yearlyGrossProfit: [
            {
              $group: {
                _id: null,
                totalProfit: { $sum: "$saleData.totalProfit" },
              },
            },
          ],
          monthlyGrossSale: [
            {
              $match: {
                date: { $regex: `^${currentMonth}` },
              },
            },
            {
              $group: {
                _id: null,
                totalSale: { $sum: "$saleData.totalSale" },
              },
            },
          ],
        },
      },
    ]);

    const previousMonthAndYearlysale = await DailySaleModel.aggregate([
      {
        $facet: {
          yearlyGrossSale: [
            {
              $match: {
                date: { $regex: `^${previousYear}` },
              },
            },
            {
              $group: {
                _id: null,
                totalSale: { $sum: "$saleData.totalSale" },
              },
            },
          ],
          yearlyGrossProfit: [
            {
              $match: {
                date: { $regex: `^${previousYear}` },
              },
            },
            {
              $group: {
                _id: null,
                totalProfit: { $sum: "$saleData.totalProfit" },
              },
            },
          ],
          monthlyGrossSale: [
            {
              $match: {
                date: { $regex: `^${previousMonth}` },
              },
            },
            {
              $group: {
                _id: null,
                totalSale: { $sum: "$saleData.totalSale" },
              },
            },
          ],
        },
      },
    ]);

    //monthly sale data

    const currentMonthData =
      currentMonthAndYearSale[0].monthlyGrossSale.length > 0
        ? currentMonthAndYearSale[0].monthlyGrossSale[0].totalSale
        : 0;
    const lastMonthData =
      previousMonthAndYearlysale[0].monthlyGrossSale.length > 0
        ? previousMonthAndYearlysale[0].monthlyGrossSale[0].totalSale
        : 0;

    const monthlySaleData = {
      currentMonthSale: currentMonthData,
      differenceFromLastMonth: currentMonthData - lastMonthData,
      percentage:
        lastMonthData === 0
          ? currentMonthData === 0
            ? 0
            : 100
          : Math.round(
              ((currentMonthData - lastMonthData) / lastMonthData) * 100
            ),
    };

    //yearly sale data

    const currentYearData =
      currentMonthAndYearSale[0].yearlyGrossSale.length > 0
        ? currentMonthAndYearSale[0].yearlyGrossSale[0].totalSale
        : 0;
    const lastYearData =
      previousMonthAndYearlysale[0].yearlyGrossSale.length > 0
        ? previousMonthAndYearlysale[0].yearlyGrossSale[0].totalSale
        : 0;

    const yearlySaleData = {
      currentyearSale: currentYearData,
      differenceFromLastYear: currentYearData - lastYearData,
      percentage:
        lastYearData === 0
          ? currentYearData === 0
            ? 0
            : 100
          : Math.round(((currentYearData - lastYearData) / lastYearData) * 100),
    };

    //yearly gross profit

    const currentYearGrossData =
      currentMonthAndYearSale[0].yearlyGrossProfit.length > 0
        ? currentMonthAndYearSale[0].yearlyGrossProfit[0].totalProfit
        : 0;
    const lastYearGrossData =
      previousMonthAndYearlysale[0].yearlyGrossProfit.length > 0
        ? previousMonthAndYearlysale[0].yearlyGrossProfit[0].totalProfit
        : 0;

    const yearlyGrossProfitData = {
      currentYearGrossProfit: currentYearGrossData,
      differenceFromLastyear: currentYearGrossData - lastYearGrossData,
      percentage:
        lastYearGrossData === 0
          ? currentYearGrossData === 0
            ? 0
            : 100
          : Math.round(
              ((currentYearGrossData - lastYearGrossData) / lastYearGrossData) *
                100
            ),
    };

    //banks data
    const banksDataRaw = await VirtalAccountModal.findOne();

    const plainData = banksDataRaw.toObject();
    let banksData = [];
    for (const key in plainData) {
      if (banksDataRaw.hasOwnProperty(key) && key !== PaymentMethod.CASH) {
        const data = { name: key, value: banksDataRaw[key] };
        banksData.push(data);
      }
    }

    //cash in hand data
    const cashInHandData = todaySalesResult.totalCash[0].totalCash;

    //MOTHLY SALES DATA FOR GRAPH
    const salesForEveryMonth = await DailySaleModel.aggregate([
      {
        $match: {
          date: { $regex: `^${currentyear}` },
        },
      },
      {
        $group: {
          _id: {
            month: { $substr: ["$date", 5, 2] },
          },
          totalSale: { $sum: "$saleData.totalSale" },
        },
      },
      {
        $sort: {
          "_id.month": 1,
        },
      },
      {
        $project: {
          month: "$_id.month",
          totalSale: 1,
          _id: 0,
        },
      },
    ]);

    //TOTAL SUITS DATA
    const projection = "category quantity color stitch_type";
    const totalSuitsData = await SuitsModel.find({}, projection).sort({
      createdAt: -1,
    });

    let dashBoardData = {
      salesBylocation: saleLocationData,
      bankAccountsData: banksData,
      cashInHand: cashInHandData,
      totalSuits: totalSuitsData,
      recieveable: recieveableSum,
      dailySale: dailySaleData,
      monthlysale: monthlySaleData,
      grossSale: yearlySaleData,
      grossProfit: yearlyGrossProfitData,
      monthlyGraphData: salesForEveryMonth,
      payable: payableSum,
    };

    return res.status(200).json(dashBoardData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const sendDashBoardAccessOTP = async (req, res, next) => {
  try {
    const id = req.session.userId;
    if (!id) {
      return res.status(403).send({ message: "Please Login Again" });
    }
    const user = await UserModel.findById({ _id: id });
    if (!user) throw new Error("User not found");
    const g_Otp = Math.floor(1000 + Math.random() * 9000);
    const oldOtpData = await OtpModel.findOne({ userId: user._id });
    if (oldOtpData) {
      const sendNewOtp = await validateOneMinuteExpiry(oldOtpData.timestamp);
      if (!sendNewOtp) throw new Error("Please Try Again After 1 Minute");
    }
    const currentDate = new Date();
    if (oldOtpData) {
      await OtpModel.updateOne(
        { userId: user._id },
        { otp: g_Otp, timestamp: new Date(currentDate.getTime()) }
      );
    } else {
      await OtpModel.create({
        userId: user.id,
        otp: g_Otp,
        timestamp: new Date(currentDate.getTime()),
      });
    }
    await sendEmail({
      email: "offical@nailaarts.com",
      g_Otp,
      email_Type: "Dashboard OTP",
    });

    console.log("g_Otp", g_Otp);

    return res.status(200).json({
      message: "OTP has been sent to your email",
      success: true,
      userId: user._id,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const verifyOtpForDasboardData = async (req, res, next) => {
  try {
    const { otp, userId } = req.body;
    const otpData = await OtpModel.findOne({ otp: otp, userId: userId });
    if (!otpData) {
      throw new Error("Invalid OTP");
    }
    const verifyOtp = await validateOtp(otpData.timestamp);
    if (verifyOtp) {
      throw new Error("OTP Expired");
    }
    const token = jwt.sign({ userId }, process.env.TOEKN_SECRET, {
      expiresIn: 60 * 10,
    });
    res.cookie("D_Token", token, {
      httpOnly: true,
      secure: "auto",
      maxAge: 60 * 10 * 1000,
    });
    res.status(200).json({
      message: "OTP Verified Successfully",
      OtpVerified: true,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getVirtualAccounts = async (req, res, next) => {
  try {
    const data = await VirtalAccountModal.find({}).select(
      "-Transaction_History"
    );
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const makeTransactionInAccounts = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { date, transactionType, payment_Method, amount, note } = req.body;
      const requiredFields = [
        "date",
        "transactionType",
        "payment_Method",
        "amount",
        "note",
      ];
      const missingFields = [];
      requiredFields.forEach((field) => {
        if (!req.body[field]) {
          missingFields.push(field);
        }
      });
      if (missingFields.length > 0) {
        throw new Error(`Missing Fields : ${requiredFields}`);
      }
      //TRANSACTION LOGIC
      if (transactionType === "Deposit") {
        const data = {
          session,
          payment_Method,
          amount,
          transactionType: "Deposit",
          date,
          note,
        };
        await virtualAccountsService.makeTransactionInVirtualAccounts(data);
      } else if (transactionType === "WithDraw") {
        const data = {
          session,
          payment_Method,
          amount,
          transactionType: "WithDraw",
          date,
          note,
        };
        await virtualAccountsService.makeTransactionInVirtualAccounts(data);
      }

      return res
        .status(200)
        .json({ success: true, message: "Transaction Successfull" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const getTransactionsHistory = async (req, res, next) => {
  try {
    const dateFrom = req.query.dateFrom || "";
    const dateTo = req.query.dateTo || "";
    const account = req.query.account || "";
    const transactionType = req.query.transactionType || "";
    const { page, limit } = getPaginationParams(req.query);

    let query = {};

    if (dateFrom && dateTo) {
      query.date = { $gte: dateFrom, $lte: dateTo };
    } else if (dateFrom) {
      query.date = { $eq: dateFrom };
    }
    if (account) {
      query.payment_Method = account;
    }
    if (transactionType) {
      query.transactionType = transactionType;
    }
    const totalDocs = await VA_HistoryModal.countDocuments(query);
    const result = await VA_HistoryModal.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ date: -1 });
    const response = {
      data: result,
      page,
      limit,
      totalRecords: totalDocs,
      totalPages: Math.ceil(totalDocs / limit),
    };
    setMongoose();
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAccountsStats = async (req, res, next) => {
  try {
    const [
      buyersStats,
      sellersStats,
      processStats,
      picturesStats,
      sellerCategoryStats,
      processCategoryStats,
      picturesCategoryStats,
    ] = await Promise.all([
      BuyersModel.aggregate(buildAccountStatsPipeline(true)),
      SellersModel.aggregate(buildAccountStatsPipeline()),
      processBillsModel.aggregate(buildAccountStatsPipeline()),
      PicruresAccountModel.aggregate(buildAccountStatsPipeline()),
      SellersModel.aggregate(
        buildAccountCategoryStatsPipeline("$seller_stock_category")
      ),
      processBillsModel.aggregate(
        buildAccountCategoryStatsPipeline("$process_Category")
      ),
      PicruresAccountModel.aggregate(
        buildAccountCategoryStatsPipeline("Pictures")
      ),
    ]);

    const buyers = normalizeAccountSummary("Buyers", buyersStats[0], true);
    const sellers = {
      ...normalizeAccountSummary("Sellers", sellersStats[0]),
      categoryBreakdown: normalizeCategoryBreakdown(sellerCategoryStats),
    };
    const process = combineAccountSummaries("Process", [
      normalizeAccountSummary("Process Bills", processStats[0]),
      normalizeAccountSummary("Pictures", picturesStats[0]),
    ]);
    process.categoryBreakdown = normalizeCategoryBreakdown([
      ...processCategoryStats,
      ...picturesCategoryStats,
    ]).sort((a, b) => b.totalBalance - a.totalBalance);

    const accountTypes = {
      buyers,
      sellers,
      process,
    };

    setMongoose();
    return res.status(200).json({
      success: true,
      data: accountTypes,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getSalesData = async (req, res, next) => {
  try {
    const date = req.query.date;
    if (!date) {
      throw new CustomError("Please select a valid filter", 404);
    }
    const matchQuery = {
      date: { $regex: `^${date}` },
      bill_type: { $ne: BillType.B_PAIR },
    };

    if (req.user_role !== "superadmin") {
      matchQuery.branchId = req.branch_id.toString();
    }

    const result = await BuyersBillsModel.aggregate([
      {
        $match: matchQuery,
      },
      {
        $unwind: "$profitDataForHistory",
      },
      {
        $group: {
          _id: {
            category: "$profitDataForHistory.category",
            color: "$profitDataForHistory.color",
            d_no: "$profitDataForHistory.d_no",
          },
          totalSale: { $sum: "$profitDataForHistory.quantity_for_return" },
        },
      },
      {
        $project: {
          category: "$_id.category",
          color: "$_id.color",
          d_no: "$_id.d_no",
          totalSale: 1,
          _id: 0,
        },
      },
    ]);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const accountStatusLabels = [
  "Paid",
  "Unpaid",
  "Advance Paid",
  "Partially Paid",
];

const emptyAccountSummary = (label, includePartiallyPaid = false) => ({
  label,
  totalDebit: 0,
  totalCredit: 0,
  totalBalance: 0,
  totalAccounts: 0,
  statuses: accountStatusLabels.reduce((acc, status) => {
    if (includePartiallyPaid || status !== "Partially Paid") {
      acc[status] = 0;
    }
    return acc;
  }, {}),
});

const buildAccountStatsPipeline = (includePartiallyPaid = false) => [
  {
    $group: {
      _id: null,
      totalDebit: { $sum: { $ifNull: ["$virtual_account.total_debit", 0] } },
      totalCredit: { $sum: { $ifNull: ["$virtual_account.total_credit", 0] } },
      totalBalance: { $sum: { $ifNull: ["$virtual_account.total_balance", 0] } },
      totalAccounts: { $sum: 1 },
      paid: {
        $sum: { $cond: [{ $eq: ["$virtual_account.status", "Paid"] }, 1, 0] },
      },
      unpaid: {
        $sum: { $cond: [{ $eq: ["$virtual_account.status", "Unpaid"] }, 1, 0] },
      },
      advancePaid: {
        $sum: {
          $cond: [{ $eq: ["$virtual_account.status", "Advance Paid"] }, 1, 0],
        },
      },
      partiallyPaid: {
        $sum: {
          $cond: [{ $eq: ["$virtual_account.status", "Partially Paid"] }, 1, 0],
        },
      },
    },
  },
  {
    $project: {
      _id: 0,
      totalDebit: 1,
      totalCredit: 1,
      totalBalance: 1,
      totalAccounts: 1,
      statuses: includePartiallyPaid
        ? {
            Paid: "$paid",
            Unpaid: "$unpaid",
            "Advance Paid": "$advancePaid",
            "Partially Paid": "$partiallyPaid",
          }
        : {
            Paid: "$paid",
            Unpaid: "$unpaid",
            "Advance Paid": "$advancePaid",
          },
    },
  },
];

const buildAccountCategoryStatsPipeline = (
  categoryExpression,
  includePartiallyPaid = false
) => [
  {
    $group: {
      _id: categoryExpression,
      totalDebit: { $sum: { $ifNull: ["$virtual_account.total_debit", 0] } },
      totalCredit: { $sum: { $ifNull: ["$virtual_account.total_credit", 0] } },
      totalBalance: { $sum: { $ifNull: ["$virtual_account.total_balance", 0] } },
      totalAccounts: { $sum: 1 },
      paid: {
        $sum: { $cond: [{ $eq: ["$virtual_account.status", "Paid"] }, 1, 0] },
      },
      unpaid: {
        $sum: { $cond: [{ $eq: ["$virtual_account.status", "Unpaid"] }, 1, 0] },
      },
      advancePaid: {
        $sum: {
          $cond: [{ $eq: ["$virtual_account.status", "Advance Paid"] }, 1, 0],
        },
      },
      partiallyPaid: {
        $sum: {
          $cond: [{ $eq: ["$virtual_account.status", "Partially Paid"] }, 1, 0],
        },
      },
    },
  },
  {
    $project: {
      _id: 0,
      category: { $ifNull: ["$_id", "Uncategorized"] },
      totalDebit: 1,
      totalCredit: 1,
      totalBalance: 1,
      totalAccounts: 1,
      statuses: includePartiallyPaid
        ? {
            Paid: "$paid",
            Unpaid: "$unpaid",
            "Advance Paid": "$advancePaid",
            "Partially Paid": "$partiallyPaid",
          }
        : {
            Paid: "$paid",
            Unpaid: "$unpaid",
            "Advance Paid": "$advancePaid",
          },
    },
  },
  {
    $sort: {
      totalBalance: -1,
      category: 1,
    },
  },
];

const normalizeAccountSummary = (label, stats, includePartiallyPaid = false) => ({
  ...emptyAccountSummary(label, includePartiallyPaid),
  ...(stats || {}),
  label,
  statuses: {
    ...emptyAccountSummary(label, includePartiallyPaid).statuses,
    ...(stats?.statuses || {}),
  },
});

const combineAccountSummaries = (label, summaries) => {
  const combined = emptyAccountSummary(label);

  summaries.forEach((summary) => {
    combined.totalDebit += summary.totalDebit || 0;
    combined.totalCredit += summary.totalCredit || 0;
    combined.totalBalance += summary.totalBalance || 0;
    combined.totalAccounts += summary.totalAccounts || 0;

    Object.keys(combined.statuses).forEach((status) => {
      combined.statuses[status] += summary.statuses?.[status] || 0;
    });
  });

  return combined;
};

const normalizeCategoryBreakdown = (items = [], includePartiallyPaid = false) =>
  items.map((item) => ({
    category: item.category,
    totalDebit: item.totalDebit || 0,
    totalCredit: item.totalCredit || 0,
    totalBalance: item.totalBalance || 0,
    totalAccounts: item.totalAccounts || 0,
    statuses: {
      ...emptyAccountSummary("", includePartiallyPaid).statuses,
      ...(item.statuses || {}),
    },
  }));


