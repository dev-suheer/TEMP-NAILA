import mongoose from "mongoose";

const previousDataSchema = new mongoose.Schema({
  serial_No: {
    type: Number,
    required: [true, "serial_No number required"],
  },
  name: {
    type: String,
    required: [true, "Name required"],
  },
  date: {
    type: Date,
    required: [true, "R_date required"],
  },
  quantity: {
    type: String,
    required: [true, "quantity required"],
  },
    bill_id: {
      type: mongoose.Types.ObjectId,
      default: null
    }
});

const accessoriesUsedDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name required"],
  },
  date: {
    type: Date,
    required: [true, "R_date required"],
  },
  quantityRemoved: {
    type: Number,
    required: [true, "Recently required"],
  },
  note: {
    type: String
  },
});

const accessoriesSchema = new mongoose.Schema(
  {
    serial_No: {
      type: Number,
      required: [true, "serial_No number required"],
    },
    name: {
      type: String,
      required: [true, "Name required"],
    },
    r_Date: {
      type: Date,
      required: [true, "R_date required"],
    },
    totalQuantity: {
      type: Number,
      required: [true, "Quantity required"],
    },
    recently: {
      type: Number,
      required: [true, "Recently required"],
    },
    all_Records: [previousDataSchema],
    accessoriesUsed_Records:[accessoriesUsedDataSchema]
  },
  { timestamps: true }
);

accessoriesSchema.index({ name: 1, createdAt: -1 });
accessoriesSchema.index({ serial_No: 1 });
accessoriesSchema.index({ createdAt: -1 });

export const AccssoriesModel = mongoose.model("Accessories", accessoriesSchema);
