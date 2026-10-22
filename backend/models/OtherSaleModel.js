import mongoose from "mongoose";

const otherSaleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount value is required"],
    },
    serialNumber: {
      type: Number,
      required: [true, "Serial Number is required"],
    },
    city: {
      type: String,
      required: [true, "City value is required"],
    },
    cargo: {
      type: String,
      required: [true, "Cargo value is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone value is required"],
    },
    date: {
      type: String,
      required: [true, "Date value is required"],
    },
    bill_by: {
      type: String,
      required: [true, "billBy value is required"],
    },
    payment_Method: {
      type: String,
      required: [true, "paymentMethod value is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity value is required"],
    },
    note: {
      type: String,
      required: [true, "Note value is required"],
    },
  },
  { timestamps: true }
);

otherSaleSchema.index({ createdAt: -1 });
otherSaleSchema.index({ name: 1, createdAt: -1 });

export const OtherSaleBillModel = mongoose.model("OtherSales", otherSaleSchema);
