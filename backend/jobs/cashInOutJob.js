import { BranchModel } from "../models/Branch.Model.js";
import { CashInOutModel } from "../models/CashInOutModel.js";
import { getTodayDate } from "../utils/Common.js";


  export const cashInOutJob = async () => {
    try {
      const branchData = await BranchModel.find({});
      const today = getTodayDate();
      const dailyCashInOutPromises = branchData?.map(async (branch) => {
        try {
          const verifyDuplicateData = await CashInOutModel.findOne({
            branchId: branch._id,
            date: today,
          });
          if (verifyDuplicateData) {
            console.error(
              `Cash In Out Already Exists for ${branch.branchName} on ${today}`
            );
            return null;
          }
          return await CashInOutModel.create({
            branchId: branch._id,
            date: today,
            todayCashIn: 0,
            todayCashOut: 0,
          });
        } catch (error) {
          console.error(
            `Failed to process branch ${branch.branchName}: ${error.message}`
          );
          return null;
        }
      });
      await Promise.allSettled(dailyCashInOutPromises);
    } catch (error) {
      console.error(`Error in cash in-out scheduled task: ${error.message}`);
    }
  };