import mongoose from "mongoose";
import {
  EmployeAttendenceModel,
  EmployeModel,
  EmployeSalaryRecordModel,
} from "../models/EmployModel.js";
import { setMongoose } from "../utils/Mongoose.js";
import moment from "moment-timezone";
import { DailySaleModel } from "../models/DailySaleModel.js";
import { virtualAccountsService } from "../services/VirtualAccountsService.js";
import { cashBookService } from "../services/CashbookService.js";
import {
  CashbookTransactionAccounts,
  CashbookTransactionSource,
  TransactionType,
} from "../enums/cashbookk.enum.js";
import { getPaginationParams, getTodayDate } from "../utils/Common.js";
import { getPublicHolidaysForMonth } from "../utils/PublicHolidays.js";
import { PaymentMethod } from "../enums/PaymentMethod.js";

export const addEmploye = async (req, res, next) => {
  try {
    const {
      name,
      father_Name,
      CNIC,
      phone_number,
      address,
      father_phone_number,
      last_work_place,
      designation,
      salary,
      joininig_date,
    } = req.body;
    const requiredFields = [
      "name",
      "father_Name",
      "CNIC",
      "phone_number",
      "address",
      "father_phone_number",
      "last_work_place",
      "designation",
      "salary",
      "joininig_date",
    ];
    let missingFields = [];
    requiredFields.forEach((field) => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });
    if (missingFields.length > 0)
      throw new Error(`Missing fields ${missingFields}`);
    await EmployeModel.create({
      name,
      father_Name,
      CNIC,
      phone_number,
      address,
      father_phone_number,
      last_work_place,
      designation,
      salary,
      joininig_date,
    });
    return res
      .status(200)
      .json({ success: true, message: "Employe Added Sucessfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const creditDebitBalance = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { id, date, particular, branchId, payment_Method } = req.body;
      if (!id || !date || !particular)
        throw new Error("Missing Requires Fields");

      const credit = parseInt(req.body.credit, 10);
      const debit = parseInt(req.body.debit, 10);
      const today = getTodayDate();
      const employe = await EmployeModel.findById(id).session(session);
      if (!employe) throw new Error("Employe data not found");
      const lastNonSalaryTransaction = employe.financeData
        .slice()
        .reverse()
        .find((transaction) => !transaction.salaryTransaction);

      let newBalance = lastNonSalaryTransaction
        ? lastNonSalaryTransaction.balance
        : 0;

      const futureDate = moment.tz(date, "Asia/Karachi").startOf("day");
      const now = moment.tz("Asia/Karachi").startOf("day");
      const isFutureDate = futureDate.isAfter(now);
      const isPastDate = futureDate.isBefore(now);
      if (isFutureDate) {
        throw new Error("Date cannot be in the future");
      }

      //CREDIT LOGIC
      if (credit >= 0) {
        newBalance += credit;
        employe.financeData.push({
          credit: credit,
          debit: 0,
          balance: newBalance,
          particular: particular,
          date: date,
          payment_Method,
          branchId,
        });
        const financeRecordId =
          employe.financeData[employe.financeData.length - 1]._id;

        //UPDATING VIRTUAL ACCOUNTS
        if (payment_Method !== PaymentMethod.CASH) {
          const data = {
            session,
            payment_Method,
            amount: credit,
            transactionType: TransactionType.DEPOSIT,
            date,
            note: `Credit Transaction for ${employe.name}`,
            sourceId: financeRecordId,
          };
          await virtualAccountsService.makeTransactionInVirtualAccounts(data);
        }
        //PUSH DATA FOR CASH BOOK
        const dataForCashBook = {
          pastTransaction: isPastDate,
          branchId,
          amount: credit,
          tranSactionType: TransactionType.DEPOSIT,
          transactionFrom: CashbookTransactionSource.EMPLOYE,
          category: CashbookTransactionAccounts.EMPLOYE,
          sourceId: financeRecordId,
          partyName: employe.name,
          payment_Method,
          ...(isPastDate && { pastDate: date }),
          session,
        };
        await cashBookService.createCashBookEntry(dataForCashBook);
      }

      //DEBIT LOGIC
      if (debit >= 0) {
        newBalance -= debit;

        //HISTORY DATA
        employe.financeData.push({
          date: date,
          particular: particular,
          balance: newBalance,
          debit: debit,
          credit: 0,
          payment_Method,
          branchId,
        });
        const financeRecordId =
          employe.financeData[employe.financeData.length - 1]._id;

        //UPDATING VIRTUAL ACCOUNTS
        if (payment_Method !== PaymentMethod.CASH) {
          const data = {
            session,
            payment_Method,
            amount: debit,
            transactionType: TransactionType.WITHDRAW,
            date,
            note: `Debit Transaction for ${employe.name}`,
            sourceId: financeRecordId,
          };
          await virtualAccountsService.makeTransactionInVirtualAccounts(data);
        }
        //PUSH DATA FOR CASH BOOK
        const dataForCashBook = {
          pastTransaction: isPastDate,
          branchId,
          amount: debit,
          tranSactionType: TransactionType.WITHDRAW,
          transactionFrom: CashbookTransactionSource.EMPLOYE,
          category: CashbookTransactionAccounts.EMPLOYE,
          sourceId: financeRecordId,
          partyName: employe.name,
          payment_Method,
          ...(isPastDate && { pastDate: date }),
          session,
        };
        await cashBookService.createCashBookEntry(dataForCashBook);
      }

      //UPDATE DAILY SALE
      if (payment_Method === PaymentMethod.CASH) {
        const amountForDailySale =
          credit >= 0 ? credit : debit >= 0 ? -debit : 0;
        if (isPastDate) {
          const targetDate = moment.tz(date, "Asia/Karachi").startOf("day");
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
              `Missing Daily Sale records for: ${missing.join(", ")}`,
            );
          }

          // Prepare bulk operations
          const bulkOps = dailySales.map((saleDoc) => {
            const update = {
              $inc: {
                "saleData.totalCash": amountForDailySale,
              },
            };

            if (debit >= 0) {
              const futureCash = saleDoc.saleData.totalCash - debit;
              if (futureCash < 0) {
                throw new Error(`Not enough cash on ${saleDoc.date}`);
              }
            }

            return {
              updateOne: {
                filter: { _id: saleDoc._id },
                update,
              },
            };
          });

          await DailySaleModel.bulkWrite(bulkOps, { session });
        } else {
          const dailySaleForToday = await DailySaleModel.findOne({
            branchId,
            date: today,
          }).session(session);
          if (!dailySaleForToday) {
            throw new Error("Daily sale record not found for This Date");
          }
          if (payment_Method === PaymentMethod.CASH) {
            dailySaleForToday.totalCash =
              dailySaleForToday.saleData.totalCash += amountForDailySale;
          }
          await dailySaleForToday.save({ session });
        }
      }

      await employe.save({ session });
      return res
        .status(200)
        .json({ success: true, message: "Transaction successfull" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const creditSalaryForSingleEmploye = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const {
        id,
        salary,
        payment_Method,
        over_time,
        branchId,
        leaves,
        month,
        date,
      } = req.body;
      if (!id || !salary || !payment_Method || !branchId || !month || !date)
        throw new Error("Please select all options");
      const employe = await EmployeModel.findById(id).session(session);
      const today = getTodayDate();
      if (!employe) throw new Error("Employe data not found");

      //VERIFY IF SALARY IS CREDITED FOR CURRENT MOTN OR NOT
      const isSalaryPaid = await EmployeSalaryRecordModel.findOne({
        employee_id: id,
        for_month: month,
      }).session(session);
      if (isSalaryPaid) {
        throw new Error(
          `Salary for this employee and period ${month} has already been processed`,
        );
      }

      employe.financeData.push({
        credit: 0,
        debit: salary,
        balance: 0,
        particular: `Salary Credit/${payment_Method}/Overtime:${over_time}/Leaves:${leaves}/Month:${month}`,
        date,
        over_time,
        leaves,
        payment_Method,
        branchId,
        salaryTransaction: true,
      });
      const financeRecordId =
        employe.financeData[employe.financeData.length - 1]._id;
      await employe.save({ session });

      const futureDate = moment.tz(date, "Asia/Karachi").startOf("day");
      const now = moment.tz("Asia/Karachi").startOf("day");
      const isFutureDate = futureDate.isAfter(now);
      const isPastDate = futureDate.isBefore(now);
      if (isFutureDate) {
        throw new Error("Transaction date cannot be in the future");
      }

      //UPDATE DAILY SALE
      if (payment_Method === PaymentMethod.CASH) {
        if (isPastDate) {
          const targetDate = moment.tz(date, "Asia/Karachi").startOf("day");
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
              `Missing Daily Sale records for: ${missing.join(", ")}`,
            );
          }

          // Prepare bulk operations
          const bulkOps = dailySales.map((saleDoc) => {
            const update = {
              $inc: {
                "saleData.totalCash": -salary,
              },
            };

            const futureCash = saleDoc.saleData.totalCash - salary;
            if (futureCash < 0) {
              throw new Error(`Not enough cash on ${saleDoc.date}`);
            }

            return {
              updateOne: {
                filter: { _id: saleDoc._id },
                update,
              },
            };
          });

          await DailySaleModel.bulkWrite(bulkOps, { session });
        } else {
          const dailySaleForToday = await DailySaleModel.findOne({
            branchId,
            date: today,
          }).session(session);
          if (!dailySaleForToday) {
            throw new Error("Daily sale record not found for this date");
          }

          dailySaleForToday.totalCash = dailySaleForToday.saleData.totalCash -=
            salary;

          if (dailySaleForToday.totalCash < 0) {
            throw new Error("Not Enough Total Cash");
          }

          await dailySaleForToday.save({ session });
        }
      }

      //UPDATING VIRTUAL ACCOUNTS
      if (payment_Method !== PaymentMethod.CASH) {
        const data = {
          session,
          payment_Method,
          amount: salary,
          transactionType: TransactionType.WITHDRAW,
          date,
          note: `Salary credit for ${employe.name}`,
          sourceId: financeRecordId,
        };
        await virtualAccountsService.makeTransactionInVirtualAccounts(data);
      }

      //PUSH DATA FOR CASH BOOK
      const dataForCashBook = {
        pastTransaction: isPastDate,
        branchId,
        amount: salary,
        tranSactionType: TransactionType.WITHDRAW,
        transactionFrom: CashbookTransactionSource.EMPLOYE,
        category: CashbookTransactionAccounts.EMPLOYE,
        sourceId: financeRecordId,
        partyName: employe.name,
        payment_Method,
        ...(isPastDate && { pastDate: date }),
        session,
      };

      await EmployeSalaryRecordModel.create({
        employee_id: id,
        for_month: month,
        payment_date: date,
        transaction_id: financeRecordId,
      });
      await cashBookService.createCashBookEntry(dataForCashBook);

      return res
        .status(200)
        .json({ success: true, message: "Salary transaction successfull" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const updateEmploye = async (req, res, next) => {
  try {
    const {
      id,
      name,
      father_Name,
      CNIC,
      phone_number,
      address,
      father_phone_number,
      last_work_place,
      designation,
      salary,
      joininig_date,
      pastEmploye,
    } = req.body;
    if (!id) throw new Error("Employ Id Not Found");
    let updateQuery = {};
    if (name) {
      updateQuery.name = name;
    }
    if (father_Name) {
      updateQuery.father_Name = father_Name;
    }
    if (CNIC) {
      updateQuery.CNIC = CNIC;
    }
    if (phone_number) {
      updateQuery.phone_number = phone_number;
    }
    if (address) {
      updateQuery.address = address;
    }
    if (father_phone_number) {
      updateQuery.father_phone_number = father_phone_number;
    }
    if (last_work_place) {
      updateQuery.last_work_place = last_work_place;
    }
    if (designation) {
      updateQuery.designation = designation;
    }
    if (salary) {
      updateQuery.salary = salary;
    }
    if (joininig_date) {
      updateQuery.joininig_date = joininig_date;
    }
    if (pastEmploye !== undefined) {
      updateQuery.pastEmploye = pastEmploye;
    }
    const updatedEmployee = await EmployeModel.findByIdAndUpdate(
      id,
      updateQuery,
    );
    if (!updatedEmployee) throw new Error("Employee not found");
    return res
      .status(200)
      .json({ success: true, message: "Employe Updated Successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getEmployeDataById = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Employe Not Found");
    const employe = await EmployeModel.findById(id);
    if (!employe) throw new Error("Employe Not Found");
    setMongoose();
    return res.status(200).json(employe);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllActiveEmploye = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    let search = req.query.search || "";

    let query = {
      pastEmploye: false,
    };

    if (search) {
      const regexSearch = new RegExp(`\\b${search}`, "i");
      query.name = regexSearch;
    }

    const [result, total] = await Promise.all([
      EmployeModel.find(query)
        .select(
          "name father_Name CNIC phone_number address father_phone_number last_work_place designation salary joininig_date financeData",
        )
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      EmployeModel.countDocuments(query),
    ]);

    const getFinancials = (data) => {
      if (data.length === 0) {
        return {
          balance: 0,
          advance: 0,
        };
      }
       const lastNonsalaryDocument =
          data.findLast((doc) => !doc.salaryTransaction);
        const { balance } = lastNonsalaryDocument;
        return {
          balance: balance,
          advance: balance < 0 ? Math.abs(balance) : 0,
        };
    };

    const employData = result.map((record) => {
      const { balance, advance } = getFinancials(record.financeData || []);
      return {
        id: record._id,
        name: record.name,
        father_Name: record.father_Name,
        CNIC: record.CNIC,
        phone_number: record.phone_number,
        address: record.address,
        father_phone_number: record.father_phone_number,
        last_work_place: record.last_work_place,
        designation: record.designation,
        salary: record.salary,
        joininig_date: record.joininig_date,
        balance: balance,
        advance: advance,
      };
    });

    const response = {
      totalPages: Math.ceil(total / limit),
      page,
      limit,
      totalEmploys: total,
      totalRecords: total,
      employData,
    };
    setMongoose();
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllPastEmploye = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    let search = req.query.search || "";

    let query = {
      pastEmploye: true,
    };

    if (search) {
      const regexSearch = new RegExp(`\\b${search}`, "i");
      query.name = regexSearch;
    }

    const [result, total] = await Promise.all([
      EmployeModel.find(query)
        .select(
          "name father_Name CNIC phone_number address father_phone_number last_work_place designation salary joininig_date financeData",
        )
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      EmployeModel.countDocuments(query),
    ]);

    const getFinancials = (data) => {
      if (data.length === 0) {
        return {
          balance: 0,
          advance: 0,
        };
      }
       const lastNonsalaryDocument =
          data.findLast((doc) => !doc.salaryTransaction);
        const { balance } = lastNonsalaryDocument;
        return {
          balance: balance,
          advance: balance < 0 ? Math.abs(balance) : 0,
        };
    };

    const employData = result.map((record) => {
      const { balance, advance } = getFinancials(record.financeData || []);
      return {
        id: record._id,
        name: record.name,
        father_Name: record.father_Name,
        CNIC: record.CNIC,
        phone_number: record.phone_number,
        address: record.address,
        father_phone_number: record.father_phone_number,
        last_work_place: record.last_work_place,
        designation: record.designation,
        salary: record.salary,
        joininig_date: record.joininig_date,
        balance: balance,
        advance: advance,
      };
    });

    const response = {
      totalPages: Math.ceil(total / limit),
      page,
      limit,
      totalEmploys: total,
      totalRecords: total,
      employData,
    };
    setMongoose();
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateOvertime = async (req, res, next) => {
  try {
    const { over_time, employeeId, note } = req.body;
    if (!over_time || !employeeId) throw new Error("Missing Data Error");
    const employeData = await EmployeModel.findById(employeeId);
    const currentMonth = moment.tz("Asia/Karachi").month() + 1;
    const today = moment.tz("Asia/karachi").format("YYYY-MM-DD");

    employeData.overtime_Data[currentMonth] += over_time;

    //ADD OVERTIME HISTORY
    const O_H_D = {
      date: today,
      time: over_time,
      note: note,
    };
    employeData.over_time_history.push(O_H_D);
    await employeData.save();
    return res.status(200).json({ success: true, message: "Success" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const reverseSalary = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { id, transactionId, amount, payment_Method, branchId } = req.body;
      if (!id || !transactionId || !amount || !branchId || !payment_Method)
        throw new Error("Missing fields");
      const employe = await EmployeModel.findById(id).session(session);
      if (!employe) throw new Error("Employe not found");
      const transaction = employe.financeData.find(
        (item) => item._id.toString() === transactionId,
      );
      if (!transaction || !transaction.salaryTransaction) {
        throw new Error("Unable to delete this transaction");
      }
      const today = getTodayDate();

      //ADD IN PAYMENT METHID
      if (payment_Method === PaymentMethod.CASH) {
        await DailySaleModel.updateMany(
          {
            branchId,
            date: {
              $gte: transaction.date,
              $lte: today,
            },
          },
          {
            $inc: {
              "saleData.totalCash": amount,
            },
          },
        );
      }

      //UPDATING VIRTUAL ACCOUNTS
      if (payment_Method !== PaymentMethod.CASH) {
        const data = {
          session,
          payment_Method,
          amount,
          transactionType: TransactionType.DEPOSIT,
          date: today,
          note: `Salary Reversed for ${employe.name}`,
          sourceId: transactionId,
          isDelete: true,
        };
        await virtualAccountsService.makeTransactionInVirtualAccounts(data);
      }

      //DELETE CASH BOOK ENTRY
      const dataForCashBook = {
        id: transactionId,
        session,
      };
      await cashBookService.deleteEntry(dataForCashBook);

      //MARKING TRANSACTION AS DELETED
      await EmployeSalaryRecordModel.findOneAndDelete({
        employee_id: id,
        transaction_id: transactionId,
      });
      employe.financeData = employe.financeData.filter(
        (item) => item?._id?.toString() !== transactionId,
      );

      await employe.save({ session });

      return res
        .status(200)
        .json({ success: true, message: "Salary reverse successfull" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const deleteCreditDebitEntry = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { employeId, recordId } = req.params;
      if (!employeId || !recordId) throw new Error("Record id is required");

      const today = getTodayDate();
      const employe = await EmployeModel.findById(employeId).session(session);
      if (!employe) throw new Error("Employe data not found");
      const recordData = employe.financeData.find(
        (record) => record._id?.toString() === recordId,
      );
      const payment_Method = recordData.payment_Method;
      let credit = null;
      let debit = null;

      if (recordData.credit > 0) {
        credit = parseInt(recordData.credit, 10);
      } else if (recordData.debit > 0) {
        debit = parseInt(recordData.debit, 10);
      }

      const lastNonSalaryTransaction = employe.financeData
        .slice()
        .reverse()
        .find((transaction) => !transaction.salaryTransaction);

      let newBalance = lastNonSalaryTransaction
        ? lastNonSalaryTransaction.balance
        : 0;

      //CREDIT LOGIC
      if (credit > 0) {
        newBalance -= credit;

        //UPDATING VIRTUAL ACCOUNTS
        if (payment_Method !== PaymentMethod.CASH) {
          const data = {
            session,
            payment_Method,
            amount: credit,
            transactionType: TransactionType.WITHDRAW,
            date: today,
            note: `Credit transaction deleted for ${employe.name}`,
            isDelete: true,
            sourceId: recordId,
          };
          await virtualAccountsService.makeTransactionInVirtualAccounts(data);
        }
      }

      //DEBIT LOGIC
      if (debit > 0) {
        newBalance += debit;
        //UPDATING VIRTUAL ACCOUNTS
        if (payment_Method !== PaymentMethod.CASH) {
          const data = {
            session,
            payment_Method,
            amount: debit,
            transactionType: TransactionType.DEPOSIT,
            date: today,
            note: `Debit transaction deleted for ${employe.name}`,
            sourceId: recordId,
            isDelete: true,
          };
          await virtualAccountsService.makeTransactionInVirtualAccounts(data);
        }
      }

      //DELETE CASH BOOK ENTRY
      const dataForCashBook = {
        id: recordId,
        session,
      };
      await cashBookService.deleteEntry(dataForCashBook);

      //UPDATE DAILY SALE
      if (payment_Method === PaymentMethod.CASH) {
        const amountForDailySale = credit > 0 ? -credit : debit > 0 ? debit : 0;

        const targetDate = moment
          .tz(recordData.date, "Asia/Karachi")
          .startOf("day");
        const dateList = [];

        const current = moment(targetDate);
        while (current.isSameOrBefore(today)) {
          dateList.push(current.format("YYYY-MM-DD"));
          current.add(1, "day");
        }

        const dailySales = await DailySaleModel.find({
          branchId: recordData.branchId,
          date: { $in: dateList },
        }).session(session);

        if (dailySales.length !== dateList.length) {
          const foundDates = dailySales.map((d) => d.date);
          const missing = dateList.filter((d) => !foundDates.includes(d));
          throw new Error(
            `Missing Daily Sale records for: ${missing.join(", ")}`,
          );
        }

        // Prepare bulk operations
        const bulkOps = dailySales.map((saleDoc) => {
          const update = {
            $inc: {
              "saleData.totalCash": amountForDailySale,
            },
          };
          if (credit >= 0) {
            const futureCash = saleDoc.saleData.totalCash - credit;
            if (futureCash < 0) {
              throw new Error(`Not enough cash on ${saleDoc.date}`);
            }
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
      employe.financeData = employe.financeData.filter(
        (record) => record._id?.toString() !== recordId,
      );
      await employe.save({ session });
      return res
        .status(200)
        .json({ success: true, message: "Transaction deleted successfully" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const updateAttendanceData = async (req, res) => {
  try {
    const {
      employee_id,
      date,
      status,
      check_in,
      check_out,
      is_weekly_holiday,
      is_public_holiday,
      overtime_hours,
      note,
    } = req.body;
    if (!employee_id) {
      throw new Error("Employee id is required");
    }
    let calculatedOvertimeHours = Number(overtime_hours) || 0;
    if (status === "present") {
      await EmployeAttendenceModel.findOneAndUpdate(
        {
          employee_id,
          date,
        },
        {
          $set: {
            status: "present",
            check_in,
            check_out,
            overtime_hours: calculatedOvertimeHours,
            is_weekly_holiday,
            is_public_holiday,
            note,
          },
        },
        { upsert: true, new: true, runValidators: true },
      );
    } else {
      await EmployeAttendenceModel.findOneAndUpdate(
        {
          employee_id,
          date,
        },
        {
          $set: {
            status: status,
            check_in: null,
            check_out: null,
            overtime_hours: 0,
            note,
          },
        },
        { upsert: true, new: true, runValidators: true },
      );
    }

    return res
      .status(200)
      .json({ success: true, message: "Attendance data updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBulkAttendanceData = async (req, res) => {
  try {
    const { records } = req.body;
    if (!records || !records.length) {
      throw new Error("Attendance records are required");
    }

    const bulkOps = records.map((record) => {
      const {
        employee_id,
        date,
        status,
        check_in,
        check_out,
        is_weekly_holiday,
        is_public_holiday,
        overtime_hours,
        note,
      } = record;

      if (!employee_id) {
        throw new Error("Employee id is required");
      }
      if (!date) {
        throw new Error("Date is required");
      }
      if (!["present", "absent", "leave"].includes(status)) {
        throw new Error("Valid attendance status is required");
      }

      const isPresent = status === "present";
      return {
        updateOne: {
          filter: {
            employee_id,
            date
          },
          update: {
            $set: {
              status,
              check_in: isPresent ? check_in : null,
              check_out: isPresent ? check_out : null,
              overtime_hours: isPresent ? Number(overtime_hours) || 0 : 0,
              is_weekly_holiday,
              is_public_holiday,
              note: note || null,
            },
          },
          upsert: true,
        },
      };
    });

    await EmployeAttendenceModel.bulkWrite(bulkOps, { ordered: false });

    return res
      .status(200)
      .json({ success: true, message: "Attendance updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAttendencedata = async (req, res) => {
  try {
    const month = req.query.month;
    if (!month || !moment(month, "YYYY-MM", true).isValid()) {
      throw new Error("Please select a valid month");
    }
const startOfMonth = moment.tz(month, "YYYY-MM", "Asia/Karachi").startOf("month").toDate();
const endOfMonth = moment.tz(month, "YYYY-MM", "Asia/Karachi").endOf("month").toDate();
    const [employees, publicHolidays] = await Promise.all([
      EmployeModel.find({ pastEmploye: false })
        .select("name designation")
        .populate({
          path: "attendanceRecords",
          match: {
            date: {
              $gte: startOfMonth,
              $lte: endOfMonth,
            },
          },
          select:
            "date status check_in check_out overtime_hours is_weekly_holiday is_public_holiday note",
        }),
      getPublicHolidaysForMonth(month),
    ]);
    const data = employees.map((employee) => {
      const employeeData = employee;
      const recordsByDate = new Map(
        (employeeData.attendanceRecords || []).map((record) => [
          moment(record.date).tz("Asia/Karachi").format("YYYY-MM-DD"),
          record,
        ]),
      );

      for (const holiday of publicHolidays) {
        const existingRecord = recordsByDate.get(holiday.date);

        if (existingRecord) {
          continue;
        }

        const holidayRecord = {
          date: holiday.date,
          status: "leave",
          check_in: null,
          check_out: null,
          overtime_hours: 0,
          is_weekly_holiday: false,
          is_public_holiday: false,
          public_holiday_name: holiday.name,
          note: null,
          is_system_generated: true,
        };

        employeeData.attendanceRecords.push(holidayRecord);
        recordsByDate.set(holiday.date, holidayRecord);
      }

      employeeData.attendanceRecords.sort(
        (a, b) => moment(a.date).valueOf() - moment(b.date).valueOf(),
      );

      return employeeData;
    });
    setMongoose();
    const response = {
      data,
      publicHolidays,
    };
    return res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const calculateSalary = async (req, res) => {
  try {
    const { month, employee_id } = req.body;
    if (!month || !employee_id) {
      throw new Error("Month and employee id is required");
    }
    const isInvalidMonth = moment(month).isAfter();
    if(isInvalidMonth){
      throw new Error("Invalid month selection")
    } 
    const isSalaryPaid = await EmployeSalaryRecordModel.findOne({
      employee_id,
      for_month: month,
    });
    if (isSalaryPaid) {
      throw new Error(
        `Salary for this employee and period ${month} has already been processed`,
      );
    }
const startOfMonth = moment.tz(month, "YYYY-MM", "Asia/Karachi").startOf("month").toDate();
const endOfMonth = moment.tz(month, "YYYY-MM", "Asia/Karachi").endOf("month").toDate();
    const daysInMonth = moment(month).daysInMonth();
    const attendanceRecords = await EmployeAttendenceModel.find({
      employee_id,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }).populate({
      path: "employee_id",
      select: "salary",
    });

    const publicHolidaysInMonth = await getPublicHolidaysForMonth(month);

    const publicHolidayDates = new Set(
      publicHolidaysInMonth.map((holiday) => holiday.date)
    );

    const attendanceDates = new Set(
      attendanceRecords.map((record) => moment(record.date).tz("Asia/Karachi").format("YYYY-MM-DD"))
    );

    const missingAttendanceDates = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = moment(month, "YYYY-MM").date(day);
      const dateKey = date.format("YYYY-MM-DD");

      const isSunday = date.day() === 0;
      const isPublicHoliday = publicHolidayDates.has(dateKey);

      if (!isSunday && !isPublicHoliday && !attendanceDates.has(dateKey)) {
        missingAttendanceDates.push(dateKey);
      }
    }

    const baseSalary = attendanceRecords[0]?.employee_id?.salary || 0;
    const perDaySalary = baseSalary / daysInMonth;
    let weeklyHolidayWorked = 0;
    let publicHolidayWorked = 0;
    let absentDays = 0;
    let leavesDays = 0;
    let overtimeHours = 0;

    attendanceRecords.forEach((record) => {
      const {status} = record;
      if (status === "present") {
        if (record.is_public_holiday) {
          publicHolidayWorked++;
        } else if (record.is_weekly_holiday) {
          weeklyHolidayWorked++;
        } 

        overtimeHours += record.overtime_hours;
        
      } else if (status === "leave" && !record.is_public_holiday && !record.is_weekly_holiday) {
          leavesDays++;
      } else if(status === "absent"){
          absentDays++;
      };
    });


    const deduction = absentDays * perDaySalary;
    const extraWeeklyPay = weeklyHolidayWorked * (perDaySalary * 2);
    const extraPublicPay = publicHolidayWorked * (perDaySalary * 2);
    const overtimePay = (overtimeHours / 12) * perDaySalary;

    const total = Math.round(baseSalary - deduction + extraWeeklyPay + extraPublicPay + overtimePay);

    const response = {
      totalSalary: total,
      overTime: overtimeHours,
      absents: absentDays,
      leaves: leavesDays,
      weeklyHolidayWorked: weeklyHolidayWorked,
      publicHolidaysWorked: publicHolidayWorked,
      missingAttendanceDates: missingAttendanceDates
    };

    return res.status(200).json(response)
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
