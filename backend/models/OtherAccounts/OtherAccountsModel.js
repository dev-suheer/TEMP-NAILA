import mongoose from "mongoose";

const OtherAccountsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name Value is required"],
    },
    city: {
      type: String,
      required: [true, "City value is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone value is required"],
    },
    total_balance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

OtherAccountsSchema.index({ createdAt: -1 });

export const OtherAccountsModel = mongoose.model(
  "OtherAccounts",
  OtherAccountsSchema
);

//OTHER ACCOUNT TRANSACTION DETAILS

const TransactionDetailsSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Types.ObjectId,
      required: [true, "Account ID is required"],
      ref: "OtherAccounts",
    },
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
    },
    debit: {
      type: Number,
      default: 0,
    },
    credit: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      required: [true, "Balance value is required"],
    },
    payment_Method: {
      type: String,
      default: "",
    },
    branchId: {
      type: mongoose.Types.ObjectId,
      required: [true, "Branch Id is required"],
    },
  },
  { timestamps: true }
);

TransactionDetailsSchema.index({ accountId: 1, date: -1 });

export const OtherAccountsTransactionModel = mongoose.model(
  "OtherAccountsTransactions",
  TransactionDetailsSchema
);
