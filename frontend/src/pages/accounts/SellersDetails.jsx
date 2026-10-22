import { useDispatch, useSelector } from 'react-redux';
import {
  applySellerDiscountAsync,
  GetSellerByIdAsync,
} from '../../features/SellerSlice';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Icon from '../../Component/Common/Icons';
import { temporaryAccountUpdateAsync } from '../../features/ProcessBillSlice';
import { Button } from '../../Component/Common/button/Button';
import { MdOutlineDiscount } from 'react-icons/md';
import AccountFilters, {
  emptyAccountFilters,
  FilteredAccountTotals,
} from '../../Component/AccountFilters/Accountfilters';
import AccountDiscountModal from './AccountDiscountModal';
import { formatReadableDate, getDateOnlyTime } from '../../Utils/Common';
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

      if (firstDate === null && secondDate === null) {
        return b.index - a.index;
      }

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


const SellersDetails = () => {
    const { id } = useParams();
    const dispatch = useDispatch();

    const [sellerEditFormData, setEditFormData] = useState({
        accountId: "",
        totalDebit: "",
        totalCredit: "",
        totalBalance: "",
        category: "buyers",
      });
    const [isSellerEditMode, setIsSellerEditMode] = useState(false);
    const [discountModal, setDiscountModal] = useState(false);
    const [discountFormData, setDiscountFormData] = useState({
        amount: "",
        reason: "",
      });
    const [filters, setFilters] = useState(emptyAccountFilters);
    const [appliedFilters, setAppliedFilters] = useState(emptyAccountFilters);

      const onSellerNumberChange = (key,value) => {
      setEditFormData((prev) => ({ ...prev, [key]: value }))
      }

    const { loading, SellerById, discountLoading } = useSelector((state) => state.Seller);

    useEffect(() => {
        if (id) {
            dispatch(GetSellerByIdAsync({ id }));
        }
    }, [dispatch, id]);

      const handleAccountUpdate = () => {
      const updatedData = {
        accountId: id,
        totalDebit: Number(sellerEditFormData.totalDebit || 0),
        totalCredit: Number(sellerEditFormData.totalCredit || 0),
        totalBalance: Number(sellerEditFormData.totalBalance || 0),
        category: "sellers"
      };

        dispatch(temporaryAccountUpdateAsync(updatedData)).then((res) => {
          if (res.payload.success) {
            dispatch(GetSellerByIdAsync({ id }));
            setIsSellerEditMode(false);
            setEditFormData({
              accountId: "",
              totalDebit: "",
              totalCredit: "",
              totalBalance: "",
              category: "sellers",
            });
          }
        });
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

    const handleApplyDiscount = (e) => {
      e.preventDefault();
      dispatch(
        applySellerDiscountAsync({
          id,
          amount: Number(discountFormData.amount),
          reason: discountFormData.reason,
        }),
      ).then((res) => {
        if (res.payload?.success) {
          dispatch(GetSellerByIdAsync({ id }));
          closeDiscountModal();
        }
      });
    };

    const transactions = SellerById?.credit_debit_history || [];
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


    return (
        <>
            <section className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg'>
                {/* BUYER DETAILS */}
<div className="px-2 py-2 mb-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 items-center text-center gap-4 lg:grid-cols-6 lg:gap-4 text-gray-900 dark:text-gray-100">
  <div className="box">
    <h3 className="pb-1 font-medium">Title</h3>
    <h3>{SellerById?.name}</h3>
  </div>

  <div className="box">
    <h3 className="pb-1 font-medium">Phone Number</h3>
    <h3>{SellerById?.phone}</h3>
  </div>

  {/* Total Debit */}
  <div className="box">
    <h3 className="pb-1 font-medium text-red-500">Total Debit</h3>

    {!isSellerEditMode ? (
      <h3 className="font-medium text-red-500">
        {SellerById?.virtual_account?.total_debit === null || SellerById?.virtual_account?.total_debit === undefined
          ? "0"
          : SellerById?.virtual_account?.total_debit}
      </h3>
    ) : (
      <input
        type="text"
        placeholder="Enter debit"
        value={sellerEditFormData.totalDebit}
        onChange={(e) => onSellerNumberChange("totalDebit", e.target.value)}
        className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
      />
    )}
  </div>

  {/* Total Credit */}
  <div className="box">
    <h3 className="pb-1 font-medium">Total Credit</h3>

    {!isSellerEditMode ? (
      <h3>
        {SellerById?.virtual_account?.total_credit === null || SellerById?.virtual_account?.total_credit === undefined
          ? "0"
          : SellerById?.virtual_account?.total_credit}
      </h3>
    ) : (
      <input
        type="text"
        placeholder="Enter credit"
        value={sellerEditFormData.totalCredit}
        onChange={(e) => onSellerNumberChange("totalCredit", e.target.value)}
        className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
      />
    )}
  </div>

  {/* Total Balance + icons */}
  <div className="box">
    <div className="flex items-center justify-center gap-2">
      <h3 className="pb-1 font-medium">Total Balance</h3>

      {!isSellerEditMode ? (
        <button
          type="button"
          onClick={() => setIsSellerEditMode(true)}
          title="Edit credit/debit/balance"
        >
          <Icon name="edit" className="cursor-pointer" />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleAccountUpdate} title="Submit">
            <Icon name="tick" className="cursor-pointer" />
          </button>

          <button
            type="button"
            onClick={() => setIsSellerEditMode(false)}
            title="Cancel"
          >
            <Icon name="cross" className="cursor-pointer" />
          </button>
        </div>
      )}
    </div>

    {!isSellerEditMode ? (
      <h3>
        {SellerById?.virtual_account?.total_balance === null
          ? "0"
          : SellerById?.virtual_account?.total_balance}
      </h3>
    ) : (
      <input
        type="text"
        placeholder="Enter balance"
        value={sellerEditFormData.totalBalance}
        onChange={(e) => onSellerNumberChange("totalBalance", e.target.value)}
        className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
      />
    )}
  </div>
</div>
              <div className='flex items-center justify-between'>
             
    <Button onClick={openDiscountModal} disabled={SellerById?.virtual_account?.status === "Paid"} className="mt-2" size="lg">
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
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions?.length > 0 ? (
                                    filteredTransactions?.map((data, index) => (
                                        <tr key={index} className={` border-b text-md font-semibold "bg-white text-black"`}>
                                            <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm"
                                                scope="row"
                                            >
                                                <p>{formatReadableDate(data.date)}</p>
                                            </th>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                                                {data.particular}
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                                                {data.credit === 0 || data.credit === null ? "-" : data.credit}
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                                                {data.debit === 0 || data.debit === null ? "-" : data.debit}
                                            </td>
                                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">
                                                {data.balance === 0 || data.balance === null ? "-" : data.balance}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="w-full flex justify-center items-center">
                                        <td className='text-xl mt-3'>No Data Available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div >
                )}
                <AccountDiscountModal
                  isOpen={discountModal}
                  onClose={closeDiscountModal}
                  onSubmit={handleApplyDiscount}
                  formData={discountFormData}
                  onChange={handleDiscountFormChange}
                  loading={discountLoading}
                />
            </section >
        </>
    );
}

export default SellersDetails;
