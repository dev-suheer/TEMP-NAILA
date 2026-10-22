import moment from "moment-timezone";
import { BranchModel } from "../models/Branch.Model.js";
import { DailySaleModel } from "../models/DailySaleModel.js";
import { PaymentMethodModel } from "../models/PaymentMethods/PaymentMethodModel.js";
import { getTodayDate } from "../utils/Common.js";

  export const dailySalesJob = async () => {
    try {
      const branchData = await BranchModel.find();
      const today = getTodayDate();
      const yesterday = moment
        .tz("Asia/Karachi")
        .subtract(1, "day")
        .format("YYYY-MM-DD");
      const dailySalePromises = branchData?.map(async (branch) => {
        try {
          const verifyDuplicateSaleData = await DailySaleModel.findOne({
            branchId: branch._id,
            date: today,
          });
          if (verifyDuplicateSaleData) {
            console.error(
              `Daily Sale Already Exists for ${branch.branchName} on ${today}`
            );
            return null;
          }
          const previousDaySale = await DailySaleModel.findOne({
            branchId: branch._id,
            date: yesterday,
          });
          const activeMethods = await PaymentMethodModel.find({
            active: { $ne: false },
          });
          const dynamicMethods = activeMethods.reduce((acc, method) => {
            acc[method.name] = 0;
            return acc;
          }, {});
          return await DailySaleModel.create({
            branchId: branch._id,
            date: today,
            saleData: {
              totalCash: previousDaySale
                ? previousDaySale.saleData.totalCash
                : 0,
              ...dynamicMethods,
            },
          });
        } catch (error) {
          console.error(
            `Failed to process branch ${branch.branchName}: ${error.message}`
          );
          return null;
        }
      });
      await Promise.allSettled(dailySalePromises);
    } catch (error) {
      console.error(`Error in daily sale scheduled task: ${error.message}`);
    }
  };