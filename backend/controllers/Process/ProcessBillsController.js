import mongoose from "mongoose";
import { processBillsModel } from "../../models/Process/ProcessBillsModel.js";
import { setMongoose } from "../../utils/Mongoose.js";
import generatePDF from "../../utils/GeneratePdf.js";
import { EmbroideryModel } from "../../models/Process/EmbroideryModel.js";
import { CalenderModel } from "../../models/Process/CalenderModel.js";
import { CuttingModel } from "../../models/Process/CuttingModel.js";
import { StoneModel } from "../../models/Process/StoneModel.js";
import { StitchingModel } from "../../models/Process/StitchingModel.js";
import moment from "moment-timezone";
import { verifyrequiredparams } from "../../middleware/Common.js";
import CustomError from "../../config/errors/CustomError.js";
import { PicruresAccountModel } from "../../models/Process/PicturesModel.js";
import { calculateAccountBalance } from "../../utils/accounting.js";
import { BuyersModel } from "../../models/BuyersModel.js";
import { SellersModel } from "../../models/sellers/SellersModel.js";
import { buildDateRangeQuery, getBusinessDateObject, getPaginationParams } from "../../utils/Common.js";
import { getActiveNextSteps } from "../../utils/ProcessQuantity.js";

const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");

export const generateProcessBill = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const {
        process_Category,
        serial_No,
        partyName,
        design_no,
        rate,
        per_suit,
        r_quantity,
        T_Recieved_Suit,
        Embroidery_id,
        Calender_id,
        Cutting_id,
        Stone_id,
        Stitching_id,
        Manual_No,
        additionalExpenditure,
        embroidery_Id,
        date,
      } = req.body;

      // Validate required fields
      if (
        !process_Category ||
        !serial_No || 
        !partyName ||
        !design_no ||
        !Manual_No ||
        !embroidery_Id
      ) {
        throw new Error("Required fields are missing");
      }
      if (process_Category === "Embroidery" && !T_Recieved_Suit) {
        throw new Error("Required fields are missing");
      }
      if (process_Category !== "Embroidery" && !r_quantity) {
        throw new Error("Required fields are missing");
      }

      //AMOUNT TO PAY IN THE BILL
      let amount = 0;
      if (process_Category === "Embroidery") {
        amount = Math.round(per_suit * T_Recieved_Suit);
      } else {
        amount = Math.round(rate * r_quantity);
      }

      if (amount <= 0) throw new Error("Invalid Balance Amount");

      //CHECK IF THE ACCOUNT DATA EXISTS
      const oldAccountData = await processBillsModel
        .findOne({
          process_Category: process_Category,
          partyName: partyName,
        })
        .session(session);

      const updateProcessCategory = async (category) => {
        switch (true) {
          case category === "Embroidery":
            const embData = await EmbroideryModel.findById(
              Embroidery_id
            ).session(session);
            if (embData.bill_generated === true) {
              throw new Error("Bill has already been generated");
            } else {
              embData.bill_generated = true;
              if (additionalExpenditure > 0) {
                embData.embAdditionalExpenditure = parseInt(
                  additionalExpenditure
                );
              }
              await embData.save({ session });
            }
            break;
          case category === "Calender":
            const calenderData = await CalenderModel.findById(
              Calender_id
            ).session(session);
            if (calenderData.bill_generated === true) {
              throw new Error("Bill has already been generated");
            } else {
              calenderData.bill_generated = true;
              if (additionalExpenditure > 0) {
                calenderData.additionalExpenditure = additionalExpenditure;
              }
              await calenderData.save({ session });
            }
            break;
          case category === "Cutting":
            const cuttingData = await CuttingModel.findById(Cutting_id).session(
              session
            );
            if (cuttingData.bill_generated === true) {
              throw new Error("Bill has already been generated");
            } else {
              cuttingData.bill_generated = true;
              if (additionalExpenditure > 0) {
                cuttingData.additionalExpenditure = additionalExpenditure;
              }
              await cuttingData.save({ session });
            }
            break;
          case category === "Stone":
            const stoneData = await StoneModel.findById(Stone_id).session(
              session
            );
            if (stoneData.bill_generated === true) {
              throw new Error("Bill has already been generated");
            } else {
              stoneData.bill_generated = true;
              if (additionalExpenditure > 0) {
                stoneData.additionalExpenditure = additionalExpenditure;
              }
              await stoneData.save({ session });
            }
            break;
          case category === "Stitching":
            const stitchingData = await StitchingModel.findById(
              Stitching_id
            ).session(session);
            if (stitchingData.bill_generated === true) {
              throw new Error("Bill has already been generated");
            } else {
              stitchingData.bill_generated = true;
              if (additionalExpenditure > 0) {
                stitchingData.additionalExpenditure = additionalExpenditure;
              }
              await stitchingData.save({ session });
            }
            break;
          default:
            throw new Error("Invalid process category");
            break;
        }
      };

      const billDate = date?.split('T')[0] || today;
      const billCreatedAt = getBusinessDateObject(billDate);

      // IF ACCOUNT DOES NOT EXIST, CREATE A NEW ONE
      if (!oldAccountData) {
        //DATA FOR VIRTUAL ACCOUNT
        const total_credit = amount;
        const total_balance = amount;

        const virtualAccountData = {
          total_credit,
          total_balance,
        };

        //DATA FOR CREDIT DEBIT HISTORY

        const processIds = {
          Embroidery: Embroidery_id,
          Calender: Calender_id,
          Cutting: Cutting_id,
          Stone: Stone_id,
          Stitching: Stitching_id,
        };

        const filrerdId = processIds[process_Category];

        if (!filrerdId) {
          throw new Error("Invalid Process Category");
        }

        const credit_debit_history_details = [
          {
            date: billDate,
            particular: `S.N:${serial_No}/M.N:${Manual_No}/D.N:${design_no}`,
            credit: amount.toFixed(0),
            balance: amount.toFixed(0),
            orderId: filrerdId,
          },
        ];

        await processBillsModel.create(
          [
            {
              process_Category,
              design_no,
              date: billDate,
              createdAt: billCreatedAt,
              Manual_No,
              serial_No,
              partyName,
              credit_debit_history: credit_debit_history_details,
              virtual_account: virtualAccountData,
            },
          ],
          { session }
        );

        //UPATING BILL GENERATED VALUE
        await updateProcessCategory(process_Category);
      }
      //UPDATE THE VIRUAL ACCOUNT AND PUSH CREDIT DEBIT + ORDER HISTORY
      else {
        //DATA FOR VIRTUAL ACCOUNT

        const {new_total_debit,new_total_credit,new_total_balance,new_status} = calculateAccountBalance({amount,oldAccountData,credit:true});
   

        //Creating Virtual Account Data
        const virtualAccountData = {
          total_debit: new_total_debit,
          total_credit: new_total_credit,
          total_balance: new_total_balance,
          status: new_status,
        };

        //DATA FOR CREDIT DEBIT HISTORY
        const processIds = {
          Embroidery: Embroidery_id,
          Calender: Calender_id,
          Cutting: Cutting_id,
          Stone: Stone_id,
          Stitching: Stitching_id,
        };

        const filrerdId = processIds[process_Category];

        if (!filrerdId) {
          throw new Error("Invalid Process Category");
        }

        const credit_debit_history_details = {
          date: billDate,
          particular: `S.N:${serial_No}/M.N:${Manual_No}/D.N:${design_no}`,
          credit: amount,
          balance: new_total_balance,
          orderId: filrerdId,
        };

        //SAVING THE OLD ACCOUNT DATA
        (oldAccountData.design_no = design_no),
          (oldAccountData.date = billDate),
          (oldAccountData.Manual_No = Manual_No),
          (oldAccountData.serial_No = serial_No),
          (oldAccountData.virtual_account = virtualAccountData),
          oldAccountData.credit_debit_history.push(
            credit_debit_history_details
          );

        await oldAccountData.save({ session });

        //UPATING BILL GENERATED VALUE

        await updateProcessCategory(process_Category);
      }

      //UPDATE MAIN EMBROIDERY AdditionalExpenditure
      const mainEmbroidery = await EmbroideryModel.findById(
        embroidery_Id
      ).session(session);
      mainEmbroidery.additionalExpenditure += parseInt(additionalExpenditure);
      await mainEmbroidery.save({ session });

      return res.status(201).json({
        success: true,
        message: "Process bill generated successfully",
      });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const getProcessillById = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Process Id Required");
    const ProcessBill = await processBillsModel.findById(id);
    if (!ProcessBill) throw new Error("Process Bill Not Found");
    setMongoose();
    return res.status(200).json(ProcessBill);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllProcessBills = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    let name = req.query.name || "";
    let category = req.query.category || "";
    let dateFrom = req.query.dateFrom || "";
    let dateTo = req.query.dateTo || "";
    let status = req.query.status || "";

    let query = {};

    if (category) {
      query.process_Category = category;
    }

    if (name) {
      query.partyName = name;
    }

    if (status) {
      query["virtual_account.status"] = status;
    }

    const dateRangeQuery = buildDateRangeQuery(dateFrom, dateTo);
    if (dateRangeQuery) {
      query.date = dateRangeQuery;
    }

    const namesQuery = { ...query };
    delete namesQuery.partyName;
    delete namesQuery.date;

    const [partyNames, totalProcessBills, processBills] = await Promise.all([
      processBillsModel.distinct("partyName", namesQuery),
      processBillsModel.countDocuments(query),
      processBillsModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ "virtual_account.status": -1, createdAt: -1 }),
    ]);

    const response = {
      processBills,
      partyNames,
      page,
      limit,
      totalProcessBills,
      totalRecords: totalProcessBills,
      totalPages: Math.ceil(totalProcessBills / limit),
    };

    setMongoose();

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const generateGatePassPdfFunction = async (req, res, next) => {
  try {
    const { data, category } = req.body;
    let pdfData = {};

    switch (true) {
      case category === "Embroidery":
        const extractEmbroideryDetails = (items) => {
          return (
            items &&
            items.map((item) => {
              const { quantity_in_no, color } = item;
              return { quantity_in_no, color };
            })
          );
        };

        let extractedShirtData = [];
        let extractedDuppataData = [];
        let extractedTrouserData = [];

        extractedShirtData = extractEmbroideryDetails(data.shirt);
        extractedDuppataData = extractEmbroideryDetails(data.duppata);
        extractedTrouserData = extractEmbroideryDetails(data.trouser);

        pdfData = {
          category: category,
          partyName: data.partyName,
          serial_No: data.serial_No,
          date: new Date(data.date).toISOString().split("T")[0],
          design_no: data.design_no,
          shirtData:
            extractedShirtData && extractedShirtData.length > 0
              ? extractedShirtData
              : undefined,
          dupattaData:
            extractedDuppataData && extractedDuppataData.length > 0
              ? extractedDuppataData
              : undefined,
          trouserData:
            extractedTrouserData && extractedTrouserData.length > 0
              ? extractedTrouserData
              : undefined,
        };

        break;

      case category === "Calender" || category === "Cutting":
        pdfData = {
          category: category,
          partyName: data.partyName,
          serial_No: data.serial_No,
          date: new Date(data.date).toISOString().split("T")[0],
          design_no: data.design_no,
          T_Quantity: data.T_Quantity,
        };
        break;

      case category === "Stone":
        const extractCategoryDetails = (items) => {
          return (
            items &&
            items.map((item) => {
              const { category, color, quantity } = item;
              return { category, color, quantity };
            })
          );
        };
        let extractedData = [];
        extractedData = extractCategoryDetails(data.category_quantity);

        pdfData = {
          category: category,
          partyName: data.partyName,
          serial_No: data.serial_No,
          date: new Date(data.date).toISOString().split("T")[0],
          design_no: data.design_no,
          T_Quantity: data.T_Quantity,
          categoryData: extractedData,
        };
        break;
      case category === "Stitching":
        const extractStitchingDetails = (items) => {
          return (
            items &&
            items.map((item) => {
              const { quantity_in_no, color, category } = item;
              return { quantity_in_no, color, category };
            })
          );
        };

        let extractedSuitDataForStitching = [];
        let extractedDuppataDataForStitching = [];

        extractedSuitDataForStitching = extractStitchingDetails(
          data.suits_category
        );
        extractedDuppataDataForStitching = extractStitchingDetails(
          data.dupatta_category
        );

        pdfData = {
          category: category,
          partyName: data.partyName,
          serial_No: data.serial_No,
          date: new Date(data.date).toISOString().split("T")[0],
          design_no: data.design_no,
          T_Quantity: data.Quantity,
          suitData: extractedSuitDataForStitching,
          dupattaData: extractedDuppataDataForStitching,
        };

      default:
        break;
    }

    pdfData = Object.fromEntries(
      Object.entries(pdfData).filter(([_, v]) => v !== undefined)
    );

    const pdfBuffer = await generatePDF(pdfData);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pdfData.partyName}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.status(200).end(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteBillAndProcessOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { id, process_Category } = req.body;
      await verifyrequiredparams(req.body, ["id", "process_Category"]);

      const calculateAmountToDeduct = (rate, suit) => {
        return Math.round(rate * suit);
      };

      //GETTING ORDER DATA AND ADD STOCK BACK USED
      let orderData;
      let amountToDeduct = 0;
      switch (true) {
        case process_Category === "Embroidery":
          const embData = await EmbroideryModel.findById(id).session(session);
          if (embData) {
            const trueSteps = await getActiveNextSteps({
              embroidery: embData,
              session,
            });

            if (trueSteps.length > 0) {
              throw new CustomError(
                `Cannot Delete Embroidery While These Are Found ${trueSteps}`,
                400
              );
            }
            orderData = embData;
            orderData.bill_generated = false;
            if (orderData.embAdditionalExpenditure > 0) {
              orderData.additionalExpenditure -=
                orderData.embAdditionalExpenditure;
              orderData.embAdditionalExpenditure = 0;
            }
            amountToDeduct = calculateAmountToDeduct(
              orderData.per_suit,
              orderData.T_Recieved_Suit
            );
          }
          break;
        case process_Category === "Calender":
          const calenderData = await CalenderModel.findById(id).session(
            session
          );
          if (calenderData) {
            orderData = calenderData;
            orderData.bill_generated = false;
            amountToDeduct = calculateAmountToDeduct(
              orderData.rate,
              orderData.r_quantity
            );
          }
          break;
        case process_Category === "Cutting":
          const cuttingData = await CuttingModel.findById(id).session(session);
          if (cuttingData) {
            orderData = cuttingData;
            orderData.bill_generated = false;
            amountToDeduct = calculateAmountToDeduct(
              orderData.rate,
              orderData.r_quantity
            );
          }
          break;
        case process_Category === "Stone":
          const stoneData = await StoneModel.findById(id).session(session);
          if (stoneData) {
            orderData = stoneData;
            orderData.bill_generated = false;
            amountToDeduct = calculateAmountToDeduct(
              orderData.rate,
              orderData.r_quantity
            );
          }
          break;
        case process_Category === "Stitching":
          const stitchingData = await StitchingModel.findById(id).session(
            session
          );
          if (stitchingData.bill_generated === true) {
            orderData = stitchingData;
            orderData.bill_generated = false;
            amountToDeduct = calculateAmountToDeduct(
              orderData.rate,
              orderData.r_quantity
            );
          }
          break;
        default:
          "";
          break;
      }
      if (!orderData) throw new CustomError("Order Data not found", 404);

      //GETTING ACCOUNT DATA
      const oldAccountData = await processBillsModel
        .findOne({
          partyName: orderData.partyName,
          process_Category: process_Category,
        })
        .session(session);

      //DATA FOR VIRTUAL ACCOUNT
        const {new_total_debit,new_total_credit,new_total_balance,new_status} = calculateAccountBalance({amount:amountToDeduct,oldAccountData,credit:true,add:false});

      //Creating Virtual Account Data
      const virtualAccountData = {
        total_credit: new_total_credit,
        total_debit: new_total_debit,
        total_balance: new_total_balance,
        status: new_status,
      };

      (oldAccountData.virtual_account = virtualAccountData),
        (oldAccountData.credit_debit_history =
          oldAccountData.credit_debit_history.filter(
            (item) => item.orderId !== id
          ));

      if (
        process_Category !== "Embroidery" &&
        orderData.additionalExpenditure > 0
      ) {
        const embData = await EmbroideryModel.findById(
          orderData.embroidery_Id
        ).session(session);
        embData.additionalExpenditure -= orderData.additionalExpenditure;
        orderData.additionalExpenditure = 0;
        await embData.save({ session });
      }

      await Promise.all([
        oldAccountData.save({ session }),
        orderData.save({ session }),
      ]);

      res.status(200).json({
        success: true,
        message: "Order Bill deleted successfully",
      });
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

export const markAsPaid = async (req, res, next) => {
  try {
    const { id, category } = req.body;
    await verifyrequiredparams(req.body, ["id", "category"]);
    let accountData = {};
    if (category === "Process") {
      accountData = await processBillsModel.findById(id);
    } else if (category === "Pictures") {
      accountData = await PicruresAccountModel.findById(id);
    } else {
      throw new Error("Need to Work On Category yet");
    }
    if (!accountData) throw new CustomError("Account not found", 404);

    //UPDATING ACCOUNT STATUS
    accountData.virtual_account.status = "Paid";

    const historydata = {
      date: today,
      particular: `Account marked as paid`,
      credit: accountData.virtual_account.total_credit,
      balance: 0,
      orderId: "",
      debit: accountData.virtual_account.total_debit,
    };

    //UPDATING ACC BALANCE
    accountData.virtual_account.total_balance = 0;
    //UPDATING CREDIT DEBIT HISTORY
    accountData.credit_debit_history.push(historydata);
    await accountData.save();
    res.status(200).json({ success: true, message: "Account marked as paid" });
  } catch (error) {
    next(error);
  }
};

export const applyDiscountOnProcessAccount = async (req, res, next) => {
  try {
    const { id, category, amount } = req.body;
    await verifyrequiredparams(req.body, ["id", "category", "amount"]);
    const numericAmount = Number(amount);
    let accountData = {};

    if (category === "Process") {
      accountData = await processBillsModel.findById(id);
    } else if (category === "Pictures") {
      accountData = await PicruresAccountModel.findById(id);
    } else {
      throw new Error("Invalid category");
    }

    if (!accountData) throw new CustomError("Account not found", 404);

    if (accountData.virtual_account.total_balance < 0) {
      throw new CustomError("Invalid Discount Entry", 500);
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
      date: today,
      particular: `Discount Entry`,
      credit: 0,
      balance: new_total_balance,
      orderId: "",
      debit: amount,
    };

     (accountData.virtual_account = virtualAccountData),
      accountData.credit_debit_history.push(historydata);

      await accountData.save();

    return res.status(200).json({ success: true, message: "Success" });
  } catch (error) {
    next(error);
  }
};

export const claimProcessAccount = async (req, res, next) => {
  try {
    const { id, category, amount, note, claimCategory } = req.body;
    await verifyrequiredparams(req.body, [
      "id",
      "category",
      "amount",
      "note",
      "claimCategory",
    ]);
    let oldAccountData = {};

    if (category === "Process") {
      oldAccountData = await processBillsModel.findById(id);
    } else if (category === "Pictures") {
      oldAccountData = await PicruresAccountModel.findById(id);
    } else {
      throw new Error("Invalid Category");
    }

    if (!oldAccountData) throw new CustomError("Account not found", 404);

    if (claimCategory === "Calim In") {
      //UPDATING ACCOUNT STATUS

      //DATA FOR VIRTUAL ACCOUNT
      const {new_total_debit,new_total_credit,new_total_balance,new_status} = calculateAccountBalance({amount,oldAccountData,credit:true});

       const credit_debit_history_details = {
        date: today,
        particular: note,
        credit: amount,
        balance: new_total_balance,
        orderId: "claim_entry",
        debit: 0,
      };


      //Creating Virtual Account Data
      const virtualAccountData = {
        total_debit: new_total_debit,
        total_credit: new_total_credit,
        total_balance: new_total_balance,
        status: new_status,
      };

      (oldAccountData.virtual_account = virtualAccountData),
        oldAccountData.credit_debit_history.push(credit_debit_history_details);

      await oldAccountData.save();
    } else if (claimCategory === "Claim Out") {
      //UPDATING ACCOUNT STATUS

      //DATA FOR VIRTUAL ACCOUNT
      const {new_total_debit,new_total_credit,new_total_balance,new_status} = calculateAccountBalance({amount,oldAccountData,credit:false});

      const credit_debit_history_details = {
        date: today,
        particular: note,
        credit: 0,
        balance: new_total_balance,
        orderId: "claim_entry",
        debit: amount,
      };

      //Creating Virtual Account Data
      const virtualAccountData = {
        total_debit: new_total_debit,
        total_credit: new_total_credit,
        total_balance: new_total_balance,
        status: new_status,
      };

      (oldAccountData.virtual_account = virtualAccountData),
        oldAccountData.credit_debit_history.push(credit_debit_history_details);

      await oldAccountData.save();
    }

    res.status(200).json({ success: true, message: "Success" });
  } catch (error) {
    next(error);
  }
};

export const deleteClaimProcessAccount = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { id, category, transactionId } = req.body;
      await verifyrequiredparams(req.body, ["id", "category", "transactionId"]);

      let accountData = {};

      if (category === "Process") {
        accountData = await processBillsModel.findById(id).session(session);
      } else if (category === "Pictures") {
        accountData = await PicruresAccountModel.findById(id).session(session);
      } else {
        throw new Error("Invalid Category");
      }

      if (!accountData) throw new CustomError("Account not found", 404);

      const claimEntry = accountData.credit_debit_history.find(
        (item) => item._id?.toString() === transactionId);
      if (!claimEntry) throw new CustomError("Claim entry not found", 404);

      const creditAmount = Number(claimEntry.credit || 0);
      const debitAmount = Number(claimEntry.debit || 0);
      const balanceData =
        creditAmount > 0
          ? calculateAccountBalance({
              amount: creditAmount,
              oldAccountData: accountData,
              credit: true,
              add: false
            })
          : calculateAccountBalance({
              amount: -debitAmount,
              oldAccountData: accountData,
              credit: false,
            });

      accountData.virtual_account = {
        total_debit: balanceData.new_total_debit,
        total_credit: balanceData.new_total_credit,
        total_balance: balanceData.new_total_balance,
        status: balanceData.new_status,
      };
      accountData.credit_debit_history =
        accountData.credit_debit_history.filter(
          (item) => item._id?.toString() !== transactionId
        );

      await accountData.save({ session });

      res.status(200).json({
        success: true,
        message: "Claim entry deleted successfully",
      });
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

export const temporaryAcoountUpdate = async (req, res, next) => {
  try {
    const { accountId, totalDebit, totalCredit, totalBalance, category } =
      req.body;
    let accountData = null;
    let new_status = ""; 
    if (category === "process") {
      accountData = await processBillsModel.findById(accountId);

      switch (true) {
        case totalBalance === 0:
          new_status = "Paid";
          break;
        case totalBalance > 0:
          new_status = "Unpaid";
          break;
        case totalBalance < 0:
          new_status = "Advance Paid";
          break;
        default:
          throw new Error(
            "Wrong account balance calculation. Invalid account status"
          );
      }
    } else if (category === "buyers") {
      accountData = await BuyersModel.findById(accountId);

      switch (true) {
        case totalBalance === 0:
          new_status = "Paid";
          break;
        case totalCredit === 0:
          new_status = "Unpaid";
        case totalBalance > 0:
          new_status = "Partially Paid";
          break;
        case totalBalance < 0:
          new_status = "Advance Paid";
          break;
        default:
          throw new Error(
            "Wrong account balance calculation. Invalid account status"
          );
      }
    } else if(category === "sellers") {
      accountData = await SellersModel.findById(accountId);

      switch (true) {
        case totalBalance === 0:
          new_status = "Paid";
          break;
        case totalBalance > 0:
          new_status = "Unpaid";
          break;
        case totalBalance < 0:
          new_status = "Advance Paid";
          break;
        default:
          throw new Error(
            "Wrong account balance calculation. Invalid account status"
          );
      }
    } 
    else throw new CustomError("Invalid category", 400);

    const updateVirtualAccountData = {
      total_debit:totalDebit,
      total_credit:totalCredit,
      total_balance:totalBalance,
      status: new_status,
    };

    accountData.virtual_account = updateVirtualAccountData;
    await accountData.save();
    return res.status(200).json({ success:true, message: "Account updated successfully" });
  } catch (error) {
    next(error);
  }
};
