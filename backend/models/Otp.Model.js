import mongoose from 'mongoose'
const { Schema } = mongoose

const otpSchema = new Schema({
  userId: {
    type:mongoose.Types.ObjectId,
     required:[true,"Please Provide User Id"]
  },
  otp: {
    type: Number,
    required:[true,"Please Provide Otp"]
  },
  timestamp: {
    type: Date,
    default: Date.now(),
    get:(timestamp)=>timestamp.getTime(),
    set:(timestamp)=>new Date(timestamp)
  }
}, { timestamps: true });

otpSchema.index({ userId: 1 });
otpSchema.index({ userId: 1, otp: 1 });
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

export const OtpModel = mongoose.model('Otp', otpSchema);

