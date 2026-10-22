

import mongoose from "mongoose";

const branchCashOutSchema = new mongoose.Schema(
  {
    branchId:{
        type: mongoose.Types.ObjectId,
        required : [true,"BranchId is required"],
    },
    amount : {
        type : Number,
        required : [true,"Amount is required"],
    },
    payment_Method: {
        type: String,
        required: [true, "Payment method is required"],
    },
    date: {
        type:String,
        required : [true,"Date is required"],
    }
  },
  { timestamps: true }
);

branchCashOutSchema.index({ branchId: 1, createdAt: -1 });

export const BranchCashOutHistoryModel = mongoose.model("Branch CashOut History", branchCashOutSchema);
