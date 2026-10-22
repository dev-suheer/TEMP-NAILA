
import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Payment Method Name'],
        unique:true
    },
    active:{
        type:Boolean,
        default:true
    }
},
{timestamps:true}
);

paymentMethodSchema.index({ active: 1, createdAt: -1 });

export const PaymentMethodModel = mongoose.model("PaymentMethods", paymentMethodSchema);
