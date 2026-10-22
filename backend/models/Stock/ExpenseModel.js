import mongoose from "mongoose";
import { PaymentMethod } from "../../enums/PaymentMethod.js";

const expenseSchema = new mongoose.Schema(
  {
    branchId: {
      type: String,
      required: [true, "branchId required"],
    },
    categoryId: {
      type: mongoose.Types.ObjectId,
      ref: "Expense Categories",
    },
    reason: {
      type: String,
      required: [true, "reason required"],
    },
    Date: {
      type: String,
      required: [true, "Date required"],
    },
    rate: {
      type: Number,
      required: [true, "rate required"],
    },
    serial_no: {
      type: Number,
      required: [true, "serial_no required"],
    },
    payment_Method: {
      type: String,
      default: PaymentMethod.CASH,
    },
  },
  { timestamps: true }
);

expenseSchema.index({ branchId: 1, categoryId: 1, createdAt: -1 });
expenseSchema.index({ branchId: 1, createdAt: -1 });

export const ExpenseModel = mongoose.model("Expense", expenseSchema);

const expenseCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "category name required"],
      unique:true
    },
    branches: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Branches",
      },
    ],
  },
  { timestamps: true }
);

expenseCategorySchema.index({ createdAt: -1 });

export const ExpenseCategoriesModel = mongoose.model(
  "Expense Categories",
  expenseCategorySchema
);
