import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  applyClaimAccountAsync,
  deleteClaimAccountAsync,
  deletePicturesBillOrderAsync,
  deleteProcessBillAndOrderAsync,
  GetPicturesBillByIdAsync,
  GetProcessBillByIdAsync,
  temporaryAccountUpdateAsync,
} from "../../features/ProcessBillSlice";
import { FaEye } from "react-icons/fa";
import DeleteModal from "../../Component/Modal/DeleteModal";

import PicturesOrder from "./Modals/PicturesOrder";
import { CiLogin } from "react-icons/ci";
import { CiLogout } from "react-icons/ci";
import Icon from "../../Component/Common/Icons";
import Chip from "../../Component/Common/Chip";
import AccountFilters, {
  emptyAccountFilters,
  FilteredAccountTotals,
} from "../../Component/AccountFilters/Accountfilters";
import { formatReadableDate, getDateOnlyTime } from "../../Utils/Common";
import PageLoader from "../../Component/Loader/PageLoader";
import ButtonSpinner from "../../Component/Common/button/ButtonSpinner";

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

const ProcessDetails = () => {
  const dispatch = useDispatch();
  const { id, category } = useParams();
  const [deleteModal, setDeleteModal] = useState(false);
  const [processClaimModal, setprocessClaimModal] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [selectedDeleteType, setSelectedDeleteType] = useState("order");
  const [picturesOrderModal, setpicturesOrderModal] = useState(false);
  const { loading, ProcessBillsDetails, deleteLoadings, discountLoading, accountUpdateLoading } =
    useSelector((state) => state.ProcessBill);

    //TEMPORAY
    const [isEditMode, setIsEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState({
      accountId: "",
      totalDebit: "",
      totalCredit: "",
      totalBalance: "",
      category: "process",
    });
    const [filters, setFilters] = useState(emptyAccountFilters);
    const [appliedFilters, setAppliedFilters] = useState(emptyAccountFilters);

    useEffect(() => {
  if (accountUpdateLoading) {
    document.body.style.cursor = "wait";
  } else {
    document.body.style.cursor = "default";
  }

  return () => {
    document.body.style.cursor = "default";
  };
}, [accountUpdateLoading]);

//

  useEffect(() => {
    if (id && category === "Pictures") {
      dispatch(GetPicturesBillByIdAsync({ id }));
    } else if (id) {
      dispatch(GetProcessBillByIdAsync({ id }));
    }
  }, [dispatch, id]);

  const openDeleteModal = (id, type = "order") => {
    setDeleteModal(true);
    setSelectedId(id);
    setSelectedDeleteType(type);
  };

  const closedeleteModal = () => {
    setDeleteModal(false);
    setSelectedId("");
    setSelectedDeleteType("order");
  };

  const handleDelete = () => {
    if (selectedDeleteType === "claim") {
      const modelCategory = category === "Pictures" ? "Pictures" : "Process";
      dispatch(
        deleteClaimAccountAsync({
          id,
          category: modelCategory,
          transactionId: selectedId,
        })
      ).then((res) => {
        if (res.payload?.success === true) {
          if (category === "Pictures") {
            dispatch(GetPicturesBillByIdAsync({ id }));
          } else {
            dispatch(GetProcessBillByIdAsync({ id }));
          }
          closedeleteModal();
        }
      });
      return;
    }

    if (category === "Pictures") {
      dispatch(deletePicturesBillOrderAsync({ id: selectedId })).then((res) => {
        if (res.payload.success === true) {
          dispatch(GetPicturesBillByIdAsync({ id }));
          closedeleteModal();
        }
      });
    } else {
      dispatch(
        deleteProcessBillAndOrderAsync({
          id: selectedId,
          process_Category: category,
        })
      ).then((res) => {
        if (res.payload.success === true) {
          dispatch(GetProcessBillByIdAsync({ id }));
          closedeleteModal();
        }
      });
    }
  };


  const viewPicturesOrderData = (value) => {
    setpicturesOrderModal(true);
    setSelectedId(value);
  };

  const hidePicturesOrderData = () => {
    setpicturesOrderModal(false);
  };

  let category_path = "";
  switch (true) {
    case category === "Embroidery":
      category_path = "embroidery-details";
      break;
    case category === "Calender":
      category_path = "calendar-details";
      break;
    case category === "Cutting":
      category_path = "cutting-details";
      break;
    case category === "Stone":
      category_path = "stones-details";
      break;
    case category === "Stitching":
      category_path = "stitching-details";
      break;
  }


  const closeDiscountModal = () => {
    setprocessClaimModal(false);
    setClaimData({
      claimAmount: "",
      claimReason: "",
    });
  };

  const [claimData, setClaimData] = useState({
    claimAmount: "",
    claimReason: "",
    claimCategory: "",
  });

  const openClaimProcessModal = (category) => {
    setprocessClaimModal(true);
    setClaimData((prev) => ({
      ...prev,
      claimCategory: category,
    }));
  };

  const handleClaimDataChange = (e) => {
    const { name, value } = e.target;
    setClaimData((prev) => ({
      ...prev,
      [name]: name === "claimAmount" ? parseInt(value) : value,
    }));
  };

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    const modelCategory = category === "Pictures" ? "Pictures" : "Process";
    const data = {
      id: id,
      amount: claimData.claimAmount,
      category: modelCategory,
      note: claimData.claimReason,
      claimCategory: claimData.claimCategory,
    };
    dispatch(applyClaimAccountAsync(data)).then((res) => {
      if (res.payload.success === true) {
        if (category === "Pictures") {
          dispatch(GetPicturesBillByIdAsync({ id }));
        } else {
          dispatch(GetProcessBillByIdAsync({ id }));
        }
      }
      closeDiscountModal();
    });
  };

  const handleAccountUpdate = () => {
    const updatedData = {
      ...editFormData,
      accountId:ProcessBillsDetails.id
    };
    dispatch(temporaryAccountUpdateAsync(updatedData)).then((res) => {
     if(res.payload.success) {
         if (id && category === "Pictures") {
      dispatch(GetPicturesBillByIdAsync({ id }));
    } else if (id) {
      dispatch(GetProcessBillByIdAsync({ id }));
    }
    setIsEditMode(false);
    setEditFormData({
      accountId: "",
      totalDebit: "",
      totalCredit: "",
      totalBalance: "",
      category: "process",
    })
     }
    })
  }

  const transactions = ProcessBillsDetails?.credit_debit_history || [];
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
      
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-5 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[70vh] rounded-lg">
        {/* PROCESS DETAILS */}
        <div className="px-2 py-2 mb-3 grid border-2 mx-auto max-w-3xl text-center rounded-lg grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-4 text-gray-900 dark:text-gray-100">
          <div className="box">
            <h3 className="pb-1 font-medium">Party Name</h3>
            <h3>{ProcessBillsDetails?.partyName}</h3>
                <div className="flex items-center justify-center gap-4">
                                 {!isEditMode && <Icon name="edit" className="cursor-pointer" size={20} onClick={() => setIsEditMode(true)}/>}

               {isEditMode && <Icon name="cross" className="cursor-pointer" size={20} onClick={() => setIsEditMode(false)}/>}
               {isEditMode && <Icon name="tick" className="cursor-pointer" size={20} onClick={handleAccountUpdate}/>}
               </div>
          </div>
         {isEditMode ? 
         
     <>
      <div className="box relative">
        <h3 className="pb-1 font-medium flex items-center justify-center gap-2">
          Total Debit
        </h3>
        <input
          type="number"
          placeholder="Enter debit"
          className="w-full px-2 py-1 border rounded"
          onChange={(e) =>
    setEditFormData((prev) => ({
      ...prev,
      totalDebit: e.target.value,
    }))
  }
        />
      </div>

      <div className="box relative">
        <h3 className="pb-1 font-medium flex items-center justify-center gap-2">
          Total Credit
        </h3>
        <input
          type="number"
          placeholder="Enter credit"
          className="w-full px-2 py-1 border rounded"
          onChange={(e) =>
    setEditFormData((prev) => ({
      ...prev,
      totalCredit: e.target.value,
    }))
  }
        />
      </div>

      <div className="box relative">
        <h3 className="pb-1 font-medium flex items-center justify-center gap-2">
          Total Balance
        </h3>
        <input
          type="number"
          placeholder="Enter balance"
          className="w-full px-2 py-1 border rounded"
         onChange={(e) =>
    setEditFormData((prev) => ({
      ...prev,
      totalBalance: e.target.value,
    }))
  }
        />
      </div>
    </>
         
         
         : <> <div className="box">
            <h3 className="pb-1 font-medium text-red-500">Total Debit</h3>
            <h3 className="font-medium text-red-500">
              {ProcessBillsDetails?.virtual_account?.total_debit === null || ProcessBillsDetails?.virtual_account?.total_debit === undefined
                ? "0"
                : ProcessBillsDetails?.virtual_account?.total_debit}
            </h3>
          </div>
          <div className="box">
            <h3 className="pb-1 font-medium">Total Credit</h3>
            <h3>
              {ProcessBillsDetails?.virtual_account?.total_credit === null || ProcessBillsDetails?.virtual_account?.total_credit === undefined
                ? "0"
                : ProcessBillsDetails?.virtual_account?.total_credit}
            </h3>
          </div>
          <div className="box">
            <h3 className="pb-1 font-medium">Total Balance</h3>
            <h3>
              {ProcessBillsDetails?.virtual_account?.total_balance === null
                ? "0"
                : ProcessBillsDetails?.virtual_account?.total_balance}
            </h3>
          </div> </>}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-center">
          <div className="flex flex-wrap items-center gap-3">
 
            <button
              onClick={() => openClaimProcessModal("Calim In")}
              className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
            >
              <div className="flex items-center justify-center gap-2">
                <CiLogout />
                Claim Out
              </div>
            </button>
            <button
              onClick={() => openClaimProcessModal("Claim Out")}
              className="px-4 py-2.5 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
            >
              <div className="flex items-center justify-center gap-2">
                <CiLogin />
                Claim In
              </div>
            </button>
          </div>

          <div className="ml-auto flex flex-wrap justify-end gap-3">
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
                  <th className="w-[280px] px-2 py-2 md:w-[300px] md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Date
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Particular
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Credit
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Debit
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Balance
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm font-medium" scope="col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions?.length > 0 ? (
                  filteredTransactions?.map((data, index) => {
                      const isClaimEntry = data.orderId === "claim_entry";
                      const isPenaltyEntry = data.orderId === "b_pair_penalty";

                      return (
                        <tr
                          key={index}
                          className="border-b bg-white text-md font-semibold text-black dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        >
                          <th
                            className="w-[280px] px-2 py-2 md:w-[300px] md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium whitespace-nowrap dark:text-white text-xs md:text-sm"
                            scope="row"
                          >
                            <div className="flex items-center gap-2">
                              <span>{formatReadableDate(data.date)}</span>
                              {isClaimEntry && (
                                <Chip variant="danger">Claim Entry</Chip>
                              )}
                              {isPenaltyEntry && (
                                <Chip variant="warning">B-Pair Penalty</Chip>
                              )}
                            </div>
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
                        {data.orderId && data.orderId !== "" && !isPenaltyEntry ? (
                          <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4 flex items-center  gap-3">
                            {isClaimEntry ? (
                              <button
                                onClick={() =>
                                  openDeleteModal(data?.id || data?._id, "claim")
                                }
                              >
                                <Icon
                                  name="delete"
                                  size={20}
                                  className="cursor-pointer"
                                />
                              </button>
                            ) : (
                              <>
                                {category === "Pictures" ? (
                                  <button
                                    onClick={() =>
                                      viewPicturesOrderData(data?.orderId)
                                    }
                                  >
                                    <FaEye size={20} className="cursor-pointer" />
                                  </button>
                                ) : (
                                  <Link
                                    to={`/dashboard/${category_path}/${data.orderId}`}
                                  >
                                    <FaEye size={20} className="cursor-pointer" />
                                  </Link>
                                )}

                                <button
                                  onClick={() => openDeleteModal(data.orderId)}
                                >
                                  <Icon
                                    name="delete"
                                    size={20}
                                    className="cursor-pointer"
                                  />
                                </button>
                              </>
                            )}
                          </td>
                        ) : (
                          <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">--</td>
                        )}
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
        )}
      </section>

      {deleteModal && (
        <DeleteModal
          title={
            selectedDeleteType === "claim"
              ? "Delete Claim Entry"
              : "Delete Bill And Order"
          }
          message={
            selectedDeleteType === "claim"
              ? "Are you sure want to delete this Claim Entry ?"
              : "Are you sure want to delete this Bill and Order ?"
          }
          onClose={closedeleteModal}
          Loading={deleteLoadings}
          onConfirm={handleDelete}
        />
      )}

      {picturesOrderModal && (
        <PicturesOrder id={selectedId} closeModal={hidePicturesOrderData} />
      )}


      {processClaimModal && (
        <>
          <div
            aria-hidden="true"
            className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-gray-800 bg-opacity-50"
          >
            <div className="relative py-4 px-3 w-[95%] max-w-sm max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
              {/* ------------- HEADER ------------- */}
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Claim Entry details
                </h3>
                <button
                  onClick={closeDiscountModal}
                  className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 14 14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>

              {/* ------------- BODY ------------- */}
              <div className="p-4 md:p-5">
                <form onSubmit={handleClaimSubmit}>
                  <div className="grid grid-cols-1 lg:gap-4">
                    {/* Claim AMount */}
                    <input
                      name="claimAmount"
                      type="number"
                      placeholder="Claim Amount"
                      value={claimData.claimAmount}
                      onChange={handleClaimDataChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />

                    {/* Claim Reason */}
                    <input
                      name="claimReason"
                      type="text"
                      placeholder="Claim Reason"
                      value={claimData.claimReason}
                      onChange={handleClaimDataChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  <div className="flex justify-center mt-6">
                    {discountLoading ? (
                      <button
                        disabled
                        type="button"
                        className="text-white cursor-not-allowed border-gray-600 bg-gray-600  focus:ring-0 focus:outline-none font-medium rounded text-sm px-5 py-2.5 text-center mr-2  inline-flex items-center gap-2"
                      >
                        <ButtonSpinner />
                        Submit
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="inline-block rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring-0 active:text-indgrayigo-500"
                      >
                        Submit
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ProcessDetails;
