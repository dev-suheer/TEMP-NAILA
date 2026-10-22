import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    branchName: {
      type: String,
      required: true,
      unique: true,
    }
  },
  { timestamps: true }
);

export const BranchModel = mongoose.model("Branch", branchSchema);
