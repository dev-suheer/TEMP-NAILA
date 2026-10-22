

export const calculateAccountBalance = ({ amount, oldAccountData, credit, add=true }) => {
  let new_total_credit = 0;
  let new_total_debit = 0;
  let new_total_balance = 0;

  if(credit) {
    if(add) {
      new_total_credit = oldAccountData.virtual_account.total_credit + amount;
      } else {
      new_total_credit = oldAccountData.virtual_account.total_credit - amount;
      }
   new_total_debit = oldAccountData.virtual_account.total_debit;
   new_total_balance = new_total_credit - new_total_debit;

  } else {
   new_total_credit = oldAccountData.virtual_account.total_credit;   
   new_total_debit = oldAccountData.virtual_account.total_debit + amount;
   new_total_balance = new_total_credit - new_total_debit;

  }



  let new_status = "";
  switch (true) {
    case new_total_balance === 0:
      new_status = "Paid";
      break;
    case new_total_balance > 0:
      new_status = "Unpaid";
      break;
    case new_total_balance < 0:
      new_status = "Advance Paid";
      break;
    default:
      throw new Error(
        "Wrong account balance calculation. Invalid account status"
      );
  }

  return {
    new_total_debit,
    new_total_credit,
    new_total_balance,
    new_status,
  };
};
