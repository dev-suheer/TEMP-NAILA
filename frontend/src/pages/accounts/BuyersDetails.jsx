import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  applyBuyerDiscountAsync,
  getBuyerBillDetailsAsync,
  getBuyerByIdAsync,
  markAsPaidAsync,
} from "../../features/BuyerSlice";
import ConfirmationModal from "../../Component/Modal/ConfirmationModal";
import { temporaryAccountUpdateAsync } from "../../features/ProcessBillSlice";
import Icon from "../../Component/Common/Icons";
import { Button } from "../../Component/Common/button/Button";
import { MdOutlineDiscount } from "react-icons/md";
import AccountFilters, {
  emptyAccountFilters,
  FilteredAccountTotals,
} from "../../Component/AccountFilters/Accountfilters";
import AccountDiscountModal from "./AccountDiscountModal";
import { formatReadableDate, getDateOnlyTime } from "../../Utils/Common";
import { FaEye } from "react-icons/fa";
import { BuyerBillDetailsModal } from "../../Component/Modal/BuyerBillDetailsModal";
import PageLoader from "../../Component/Loader/PageLoader";

const hasDateFilters = (filters) => Boolean(filters.dateFrom || filters.dateTo);

const getDateRange = ({ dateFrom, dateTo }) => {
  const from = getDateOnlyTime(dateFrom);
  const to = getDateOnlyTime(dateTo);

  if (from && to) {
    return {
      from: Math.min(from, to),
      to: Math.max(from, to),
    };
  }

  if (from || to) {
    const date = from || to;
    return { from: date, to: date };
  }

  return null;
};

const filterTransactionsByDate = (transactions = [], filters) => {
  const range = getDateRange(filters);
  if (!range) return transactions;

  return transactions.filter((transaction) => {
    const transactionDate = getDateOnlyTime(transaction.date);
    return (
      transactionDate !== null &&
      transactionDate >= range.from &&
      transactionDate <= range.to
    );
  });
};

const sortTransactionsByDate = (transactions = []) =>
  transactions
    .map((transaction, index) => ({ transaction, index }))
    .sort((a, b) => {
      const firstDate = getDateOnlyTime(a.transaction.date);
      const secondDate = getDateOnlyTime(b.transaction.date);

      if (firstDate === null && secondDate === null) return b.index - a.index;
      if (firstDate === null) return 1;
      if (secondDate === null) return -1;

      const dateDiff = secondDate - firstDate;

      if (dateDiff !== 0) return dateDiff;

      return b.index - a.index;
    })
    .map(({ transaction }) => transaction);

const calculateTransactionTotals = (transactions = []) =>
  transactions.reduce(
    (totals, transaction) => ({
      debit: totals.debit + Number(transaction.debit || 0),
      credit: totals.credit + Number(transaction.credit || 0),
    }),
    { debit: 0, credit: 0 },
  );



const getTransactionBillDetailsPayload = (transaction) => {
  const particular = transaction?.particular || "";
  const isBillTransaction = /^Bill No\s+/i.test(particular);
  const isReturnBillTransaction = /return.*bill/i.test(particular);

  if (!isBillTransaction && !isReturnBillTransaction) return null;

  return {
    billId : transaction?.bill_id ?  transaction.bill_id  : {},
  };
};






const BuyersDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const {
    loading,
    BuyerById,
    BuyerBillDetails,
    buyerBillDetailsLoading,
    markAsPaidLoading,
    discountLoading,
  } = useSelector((state) => state.Buyer);
  const [openCModal, setCModal] = useState(false);
  const [discountModal, setDiscountModal] = useState(false);
  const [billDetailsModal, setBillDetailsModal] = useState(false);
  const [discountFormData, setDiscountFormData] = useState({
    amount: "",
    reason: "",
  });
  const [editFormData, setEditFormData] = useState({
    accountId: "",
    totalDebit: "",
    totalCredit: "",
    totalBalance: "",
    category: "buyers",
  });
  const [isEditMode, setIsEditMode] = useState(false)
  const [filters, setFilters] = useState(emptyAccountFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyAccountFilters);

  useEffect(() => {
    if (id) {
      dispatch(getBuyerByIdAsync({ id }));
    }
  }, [dispatch, id]);

 
  const closeConfirmationModal = () => {
    setCModal(false);
  };

  const openDiscountModal = () => {
    setDiscountModal(true);
  };

  const closeDiscountModal = () => {
    setDiscountModal(false);
    setDiscountFormData({
      amount: "",
      reason: "",
    });
  };

  const handleDiscountFormChange = (e) => {
    const { name, value } = e.target;
    setDiscountFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const UpdateAccount = () => {
    dispatch(markAsPaidAsync({ id })).then((res) => {
      if (res.payload.success === true) {
        dispatch(getBuyerByIdAsync({ id }));
        closeConfirmationModal();
      }
    });
  };

  const onNumberChange = (key,value) => {
      setEditFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleAccountUpdate = () => {
     const updatedData = {
    accountId: id,
    totalDebit: Number(editFormData.totalDebit || 0),
    totalCredit: Number(editFormData.totalCredit || 0),
    totalBalance: Number(editFormData.totalBalance || 0),
    category: "buyers"
  };
    dispatch(temporaryAccountUpdateAsync(updatedData)).then((res) => {
      if (res.payload.success) {
        dispatch(getBuyerByIdAsync({ id }));
        setIsEditMode(false);
        setEditFormData({
          accountId: "",
          totalDebit: "",
          totalCredit: "",
          totalBalance: "",
          category: "buyers",
        });
      }
    });
  };

  const handleApplyDiscount = (e) => {
    e.preventDefault();
    dispatch(
      applyBuyerDiscountAsync({
        id,
        amount: Number(discountFormData.amount),
        reason: discountFormData.reason,
      }),
    ).then((res) => {
      if (res.payload?.success) {
        dispatch(getBuyerByIdAsync({ id }));
        closeDiscountModal();
      }
    });
  };

  const transactions = BuyerById?.credit_debit_history || [];
  const filteredTransactions = sortTransactionsByDate(
    filterTransactionsByDate(transactions, appliedFilters),
  );
  const filteredTotals = calculateTransactionTotals(filteredTransactions);
  const isFilterApplied = hasDateFilters(appliedFilters);

  const handleFiltersSearch = () => {
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setFilters(emptyAccountFilters);
    setAppliedFilters(emptyAccountFilters);
  };

  const openBillDetailsModal = (transaction) => {
    const payload = getTransactionBillDetailsPayload(transaction, id);
    if (!payload) return;

    setBillDetailsModal(true);
    dispatch(getBuyerBillDetailsAsync(payload));
  };

  const closeBillDetailsModal = () => {
    setBillDetailsModal(false);
  };

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg">
        {/* BUYER DETAILS */}
        <div className="px-2 py-2 mb-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:grid-cols-6 lg:gap-4 text-gray-900 dark:text-gray-100">
          <div className="box">
            <h3 className="pb-1 font-medium">Title</h3>
            <h3>{BuyerById?.name}</h3>
          </div>

          <div className="box">
            <h3 className="pb-1 font-medium">Phone Number</h3>
            <h3>{BuyerById?.phone}</h3>
          </div>

          <div className="box">
            <h3 className="pb-1 font-medium">Location</h3>
            <h3>{BuyerById?.city}</h3>
          </div>

          {/* Total Debit */}
          <div className="box">
            <h3 className="pb-1 font-medium text-red-500">Total Debit</h3>

            {!isEditMode ? (
              <h3 className="font-medium text-red-500">
                {BuyerById?.virtual_account?.total_debit ?? 0}
              </h3>
            ) : (
              <input
                type="text"
                placeholder="Enter debit"
                value={editFormData.totalDebit}
                onChange={(e) => onNumberChange("totalDebit", e.target.value)}
                className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
              />
            )}
          </div>

          {/* Total Credit */}
          <div className="box">
            <h3 className="pb-1 font-medium">Total Credit</h3>

            {!isEditMode ? (
              <h3>{BuyerById?.virtual_account?.total_credit ?? 0}</h3>
            ) : (
              <input
                type="text"
                placeholder="Enter credit"
                value={editFormData.totalCredit}
                onChange={(e) => onNumberChange("totalCredit", e.target.value)}
                className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
              />
            )}
          </div>

          {/* Total Balance + icons */}
          <div className="box">
            <div className="flex items-center gap-2">
              <h3 className="pb-1 font-medium">Total Balance</h3>

              {!isEditMode ? (
                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  title="Edit credit/debit/balance"
                >
                  <Icon name="edit" className="cursor-pointer" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAccountUpdate}
                    title="Submit"
                  >
                    <Icon name="tick" className="cursor-pointer" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    title="Cancel"
                  >
                    <Icon name="cross" className="cursor-pointer" />
                  </button>
                </div>
              )}
            </div>

            {!isEditMode ? (
              <h3>{BuyerById?.virtual_account?.total_balance}</h3>
            ) : (
              <input
                type="text"
                placeholder="Enter balance"
                value={editFormData.totalBalance}
                onChange={(e) => onNumberChange("totalBalance", e.target.value)}
                className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
              />
            )}
          </div>

        </div>

        <div className="flex items-center justify-between">
          <Button
            onClick={openDiscountModal}
            className=""
            disabled={BuyerById?.virtual_account?.status === "Paid"}
            size="lg"
          >
            <span className="flex items-center gap-2">
              <MdOutlineDiscount />
              Discount
            </span>
          </Button>

          <div className="mb-4 flex flex-wrap justify-end gap-3">
            <FilteredAccountTotals
              show={isFilterApplied}
              debit={filteredTotals.debit}
              credit={filteredTotals.credit}
              count={filteredTransactions.length}
            />
            <AccountFilters
              filters={filters}
              onChange={setFilters}
              onSearch={handleFiltersSearch}
              onReset={handleResetFilters}
            />
          </div>
        </div>

        {/* -------------- TABLE -------------- */}
        {loading ? (
          <PageLoader />
        ) : (
          <>
            <div className="relative overflow-x-auto mt-5 ">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                  <tr>
                    <th
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium"
                      scope="col"
                    >
                      Date
                    </th>
                    <th
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium"
                      scope="col"
                    >
                      Particular
                    </th>
                    <th
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium"
                      scope="col"
                    >
                      Credit
                    </th>
                    <th
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium"
                      scope="col"
                    >
                      Debit
                    </th>
                    <th
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium"
                      scope="col"
                    >
                      Balance
                    </th>
                    <th
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium"
                      scope="col"
                    >
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions?.length > 0 ? (
                    filteredTransactions?.map((data, index) => {
                      const detailsPayload = getTransactionBillDetailsPayload(data, id);

                      return (
                        <tr
                          key={index}
                          className={` ${
                            data.particular === "Account Marked As Paid"
                              ? "bg-red-500 dark:bg-red-500 text-white"
                              : "bg-white dark:bg-gray-800"
                          } border-b text-md font-semibold  dark:border-gray-700 dark:text-white`}
                        >
                          <th
                            className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium whitespace-nowrap text-xs md:text-sm"
                            scope="row"
                          >
                            <p>{formatReadableDate(data.date)}</p>
                          </th>
                          <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                            {data.particular}
                          </td>
                          <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                            {data.credit === 0 || data.credit === null
                              ? "-"
                              : data.credit}
                          </td>
                          <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                            {data.debit === 0 || data.debit === null
                              ? "-"
                              : data.debit}
                          </td>
                          <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                            {data.balance === 0 || data.balance === null
                              ? "-"
                            : data.balance}
                          </td>
                          <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                            {detailsPayload ? (
                              <button
                                type="button"
                                onClick={() => openBillDetailsModal(data)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                                title="View bill details"
                              >
                                <FaEye size={18} className="cursor-pointer" />
                              </button>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="w-full flex justify-center items-center">
                      <td className="text-xl mt-3">No Data Available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
        {openCModal && (
          <ConfirmationModal
            onClose={closeConfirmationModal}
            onConfirm={UpdateAccount}
            message={"Are You Sure Want To Mark This Account As Paid."}
            title={"Mark Account As Paid"}
            updateStitchingLoading={markAsPaidLoading}
          />
        )}
        <AccountDiscountModal
          isOpen={discountModal}
          onClose={closeDiscountModal}
          onSubmit={handleApplyDiscount}
          formData={discountFormData}
          onChange={handleDiscountFormChange}
          loading={discountLoading}
        />
        <BuyerBillDetailsModal
          isOpen={billDetailsModal}
          onClose={closeBillDetailsModal}
          loading={buyerBillDetailsLoading}
          details={BuyerBillDetails}
        />
      </section>
    </>
  );
};

export default BuyersDetails;
