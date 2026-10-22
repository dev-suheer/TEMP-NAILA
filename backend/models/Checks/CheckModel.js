import mongoose from "mongoose";

const checkSchema = new mongoose.Schema(
  {
    buyerId: {
      type: String,
      required: [true, "BuyerId value required"],
    },
    checkDetails: [
      {
        checkNumber: {
          type: String,
          required: [true, "Check Number value required"],
        },
        checkAmount: {
          type: Number,
          required: [true, "Check Amount value required"],
        },
        date: {
          type: String,
          required: [true, "Date value required"],
        },
        note: {
          type: String,
          required: [true, "Note value required"],
        },
        paid:{
            type:Boolean,
            default:false
        },
        updated:{
            type:Boolean,
            default:false
        },
        newCheck:{
          type: Boolean,
          default:true
        }
      },
    ],
  },
  { timestamps: true }
);

checkSchema.index({ buyerId: 1 });

export const CheckModel = mongoose.model("Checks", checkSchema);
