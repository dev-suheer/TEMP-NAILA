export const calculateBuyerAccountBalance = ({
  paid,
  total,
  oldAccountData,
  deleteBill = false,
  isCashOut = false
}) => {
  let total_credit = 0;
  let total_debit = 0;
  let total_balance = 0;

  if (!deleteBill && !isCashOut) {
    total_credit = oldAccountData.total_credit + paid;
    total_debit = oldAccountData.total_debit + total;
    total_balance = total_debit - total_credit;
  } else if (isCashOut) {
    total_credit = oldAccountData.total_credit;
    total_debit = oldAccountData.total_debit + paid;
    total_balance = total_debit - total_credit;
  }  else if (deleteBill) {
    total_credit = oldAccountData.total_credit - paid;
    total_debit = oldAccountData.total_debit - total;
    total_balance = total_debit - total_credit;
  }

  let new_status = "";
  switch (true) {
    case total_balance === 0:
      new_status = "Paid";
      break;
    case total_credit === 0:
      new_status = "Unpaid";
    case total_balance > 0:
      new_status = "Partially Paid";
      break;
    case total_balance < 0:
      new_status = "Advance Paid";
      break;
    default:
      throw new Error(
        "Wrong account balance calculation. Invalid account status"
      );
  }

  return {
    total_debit,
    total_credit,
    total_balance,
    status:new_status,
  };
};
