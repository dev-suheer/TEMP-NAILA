import mongoose from "mongoose";

const suitCategoryCodeSchema = new mongoose.Schema(
  {
    category_key: {
      type: String,
      required: [true, "Category key required"],
      unique: true,
    },
    category: {
      type: String,
      required: [true, "Category required"],
    },
    code: {
      type: String,
      required: [true, "Category code required"],
      unique: true,
    },
  },
  { timestamps: true }
);

export const SuitCategoryCodeModel = mongoose.model(
  "Suit Category Code",
  suitCategoryCodeSchema
);
