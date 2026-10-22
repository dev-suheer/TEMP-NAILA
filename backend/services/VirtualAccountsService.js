

import CustomError from "../config/errors/CustomError.js";
import { verifyrequiredparams } from "../middleware/Common.js";
import { VA_HistoryModal, VirtalAccountModal } from "../models/DashboardData/VirtalAccountsModal.js";



 class virtualAccountsTransactionService {

  async makeTransactionInVirtualAccounts(data) {
        try {
            let {session,payment_Method,amount,transactionType,date,note,isDelete=false,sourceId=null} = data;
            if (transactionType === "WithDraw") {
                amount = -amount;
            }            
            await verifyrequiredparams(data,['session','payment_Method','amount','transactionType','date','note'])
            let virtualAccounts = await VirtalAccountModal.find({}).session(session);
                   await VirtalAccountModal.findOneAndUpdate(
                    { _id: virtualAccounts[0]._id },
                    {
                      $inc: {
                        [payment_Method]: amount,
                      },
                    },
                    {
                      new: true, 
                      session, 
                    }
                  );
          
                  //ADDING STATEMENT HISTORY
                  const new_balance = virtualAccounts[0][payment_Method] + amount;

                  if (transactionType === "WithDraw" && new_balance < 0){
                    throw new CustomError("Not Enough Cash In Payment Method",400)
                };

                if(!isDelete) {
                 const historyData = {
                    date,
                    transactionType: transactionType,
                    payment_Method,
                    new_balance,
                    amount: amount,
                    note,
                    sourceId
                  };
                  await VA_HistoryModal.create([historyData], { session });
                }

                if(isDelete) {
                  await VA_HistoryModal.findOneAndDelete({sourceId}).session(session)
                }
          
 
            
        } catch (error) {
            throw error;
        }
    }

};

export const virtualAccountsService = new virtualAccountsTransactionService();
