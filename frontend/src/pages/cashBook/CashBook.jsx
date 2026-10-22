import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteCashBookEntryAsync, getAllCashBookEntriesAsync } from "../../features/CashBookSlice";
import { CiSearch } from "react-icons/ci";
import { GrPowerReset } from "react-icons/gr";
import Icon from "../../Component/Common/Icons";
import { formatReadableDate, getTodayDate } from "../../Utils/Common";
import { Roles } from "../../constants/Roles";
import DeleteModal from "../../Component/Modal/DeleteModal";
import ThemedSelect from "../../Component/Common/select/ThemedSelect";

const CashBook = () => {
  const dispatch = useDispatch();
  const { loading, cashBookData, deleteLoading } = useSelector((state) => state.CashBook);
  const { PaymentData } = useSelector((state) => state.PaymentMethods);
  const { role } = useSelector((state) => state.auth);
  const { Branches } = useSelector((state) => state.InStock);
  const [toDelete, setToDelete] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);

  const today = getTodayDate();

  const [filters, setFilters] = useState({
    dateFrom: today,
    dateTo: "",
    transactionType: "",
    account: "",
    branchId:""
  });

  useEffect(() => {
    dispatch(getAllCashBookEntriesAsync(filters));
  }, [dispatch]);

  const handleChangeFilters = (e) => {
    const { name, value } = e.target;
    setFilters((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFiltersSearch = () => {
    dispatch(getAllCashBookEntriesAsync(filters));
  };

  const handleResetFilters = () => {
    const updatedFilters = {
      dateFrom: today,
      dateTo: "",
      transactionType: "",
      payment_Method: "",
      account: "",
      branchId:""
    };
  
    setFilters(updatedFilters);
    dispatch(getAllCashBookEntriesAsync(updatedFilters));
  };

    const openDeleteModal = (id) => {
      setDeleteModal(true);
      setToDelete(id);
      document.body.style.overflow = "hidden";
    };
    
    const closeDeleteModal = () => {
      setDeleteModal(false);
      setToDelete(null);
      document.body.style.overflow = "auto";
    };
  
    const handleDeleteRecord = () => {
      dispatch(deleteCashBookEntryAsync(toDelete)).then((res) => {
        console.log('res', res)
        if(res.payload.success){
        closeDeleteModal();
        dispatch(getAllCashBookEntriesAsync(filters));
        }
      })
    }



  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[80vh] rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Cash Book
          </h1>

          {/* SEARCH FILTERS */}
          <div className="flex items-center gap-3 justify-center mb-2">
            {/* DATES*/}

            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                From
              </span>
              <input
                type="date"
                name="dateFrom"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block pl-14 p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                value={filters.dateFrom}
                onChange={handleChangeFilters}
              />
            </div>

            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                To
              </span>
              <input
                type="date"
                name="dateTo"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block pl-14 p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                value={filters.dateTo}
                onChange={handleChangeFilters}
              />
            </div>

            {/* ACCOUNT */}
            <ThemedSelect className="min-w-[11rem]"
              id="account"
              name="account"
              value={filters.account}
              onChange={handleChangeFilters}
            >
              <option value="" disabled>
                Select Account
              </option>
              {PaymentData?.map((item) => (
                <option value={item.value} key={item.value}>
                  {item.label}
                </option>
              ))}
            </ThemedSelect>



            {role === Roles.SUPER_ADMIN ? (
                   
                      <ThemedSelect className="w-full"
                        id="branchId"
                        name='branchId'
                        value={filters.branchId}
                        onChange={handleChangeFilters}
                      >
                        <option value="">Select Branch</option>
                        {Branches?.map((data) => (
                          <option key={data.id} value={data.id}>
                            {data.branchName}
                          </option>
                        ))}
                      </ThemedSelect>

                  ) : null}


            {/* TRANSACTION TYPE */}
            <ThemedSelect className="min-w-[11rem]"
              id="transactionType"
              name="transactionType"
              value={filters.transactionType}
              onChange={handleChangeFilters}
            >
              <option value="" disabled>
                Transaction Type
              </option>
              <option value="Deposit">Deposit</option>
              <option value="WithDraw">WithDraw</option>
            </ThemedSelect>
            {/* SEARCH BUTTON */}
            <button
              onClick={handleFiltersSearch}
              type="button"
              className="flex items-center gap-2  bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
            >
              <CiSearch size={20} className="cursor-pointer" />
              Search
            </button>
            {/* RESET BUTTON */}
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2  bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
            >
              <GrPowerReset size={20} className="cursor-pointer" />
              Reset
            </button>
          </div>
        </div>

        {/* -------------- TABLE -------------- */}

        <>
          <div className="relative overflow-x-auto mt-5 ">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-center font-medium text-xs md:text-sm" scope="col">
                    Time
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-center font-medium text-xs md:text-sm" scope="col">
                    Date
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-center font-medium text-xs md:text-sm" scope="col">
                    Branch
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-center font-medium text-xs md:text-sm" scope="col">
                    Name
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-center font-medium text-xs md:text-sm" scope="col">
                    Transaction From
                  </th>
                  <th
                    className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 font-medium text-center text-xs md:text-sm"
                    scope="col"
                  >
                    Transaction Type
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-center font-medium text-xs md:text-sm" scope="col">
                    Payment Method
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-center font-medium text-xs md:text-sm" scope="col">
                    Amount
                  </th>
                   <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-center font-medium text-xs md:text-sm">
                    Action
                  </th>
                </tr>
              </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7">
                        <div className="flex justify-center items-center py-10">
                          <div
                            className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100 rounded-full"
                            role="status"
                            aria-label="loading"
                          >
                            <span className="sr-only">Loading...</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : cashBookData && cashBookData?.length > 0 ? (
                    cashBookData?.map((data, index) => (
                      <tr
                        key={index}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center lg:py-4 text-xs md:text-sm">
                          {data.transactionTime}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center lg:py-4 text-xs md:text-sm">
                          {[data?.currentDate, data?.pastDate]
                            .filter(Boolean)
                            .map(formatReadableDate)
                            .join(" ") || "--"}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center lg:py-4 text-xs md:text-sm">
                          {data?.branchId?.branchName}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center lg:py-4 text-xs md:text-sm">
                          {data.partyName}
                        </td>
                        <td className="px-6  text-center py-4">
                          {data?.transactionFrom}
                        </td>
                        <td
                          className={`px-6 text-center py-4 ${
                            data.tranSactionType === "Deposit"
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {data.tranSactionType}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center lg:py-4 text-xs md:text-sm">
                          {data.payment_Method}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center lg:py-4 text-xs md:text-sm">{data.amount}</td>

                         <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 text-center lg:py-4 text-xs md:text-sm">
                           {data?.canDelete ? <Icon name="delete" onClick={() => openDeleteModal(data._id)} size={22} className="cursor-pointer"/> : "-"}
                        </td> 
                      </tr>
                    ))
                  ) : (
                    <tr className="w-full flex justify-center items-center">
                      <td className="text-xl mt-3">
                        No Data Available.
                      </td>
                    </tr>
                  )}
                </tbody>
            
            </table>
          </div>
        </>
      </section>

       {deleteModal && <DeleteModal
      onClose={closeDeleteModal}
      onConfirm={handleDeleteRecord}
      message={"Are you sure want to delete this cash book transaction ?"}
      title={"Delete Transaction"}
      Loading={deleteLoading}
      />}
    </>
  );
};

export default CashBook;
