import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    transactionType: {
      type: String,
      required: [true, "Transaction Type is required"],
      enum: ["Deposit", "WithDraw"],
    },
    payment_Method: {
      type: String,
      required: [true, "Payment Method is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount Value is required"],
    },
    new_balance: {
      type: Number,
      required: [true, "New balance Value is required"],
    },
    note: {
      type: String,
      required: [true, "Note is required"],
    },
    sourceId: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true },
);

historySchema.index({ date: -1, payment_Method: 1, transactionType: 1, createdAt: -1 });
historySchema.index({ date: -1 });

export const VA_HistoryModal = mongoose.model(
  "V.A Transactions",
  historySchema
);

const AccountsSchema = new mongoose.Schema({ }, { strict: false });


export const VirtalAccountModal = mongoose.model(
  "Virtual Accounts",
  AccountsSchema
);
