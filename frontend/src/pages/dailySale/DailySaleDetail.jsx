import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {  useParams } from "react-router-dom";
import {
  BranchCashOutAsync,
  getDailySaleByIdAsync,
} from "../../features/DailySaleSlice";
import { PiHandDeposit } from "react-icons/pi";
import { MdHistory } from "react-icons/md";
import { getBranchCashoutHistoryAsync } from "../../features/ShopSlice";
import moment from 'moment-timezone'
import Pagination from "../../Component/Common/Pagination";
import { DEFAULT_PAGE_LIMIT, PAYMENT_METHODS, formatReadableDate } from "../../Utils/Common";
import PageLoader from "../../Component/Loader/PageLoader";
import ThemedSelect from "../../Component/Common/select/ThemedSelect";
import ButtonSpinner from "../../Component/Common/button/ButtonSpinner";

const DailySaleDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [cashOutModal, setCashOutModal] = useState("");
  const { user } = useSelector((state) => state.auth);
  const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");
  const { loading, DailySaleById, cashOutLoading } = useSelector(
    (state) => state.DailySale
  );
  const { PaymentData } = useSelector((state) => state.PaymentMethods);
  const { BranchcashOutHistory, historyLoading } = useSelector(
    (state) => state.Shop
  );
  const limit = BranchcashOutHistory?.limit || DEFAULT_PAGE_LIMIT;

  const [formData, setFormData] = useState({
    amount: "",
    payment_Method: "",
    date:""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "amount" ? parseInt(value) : value,
    }));
  };

  useEffect(() => {
    if (id) {
      dispatch(getDailySaleByIdAsync({ id }));
    }
  }, [dispatch, id]);

  const openModal = (type) => {
    setCashOutModal(type);
    setFormData({
      amount: DailySaleById?.saleData?.totalCash,
      payment_Method: "",
      date:today
    });
    document.body.style.overflow = "hidden";
    if ((type === "Cash Out History")) {
      dispatch(
        getBranchCashoutHistoryAsync({
          page: 1,
          limit,
        })
      );
    }
  };

  const closeModal = () => {
    setCashOutModal("");
    setFormData({
      amount: DailySaleById?.saleData?.totalCash,
      payment_Method: "",
    });
    document.body.style.overflow = "auto";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      amount: formData.amount,
      payment_Method: formData.payment_Method,
      branchId: user?.user?.branchId,
      date:formData.date
    };

    dispatch(BranchCashOutAsync(data)).then((res) => {
      if (res.payload.success === true) {
        closeModal();
        dispatch(getDailySaleByIdAsync({ id }));
        setFormData({
          amount: DailySaleById?.saleData?.totalCash,
          payment_Method: "",
          date:today
        });
      }
    });
  };
  const page = Number(BranchcashOutHistory?.page);

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 rounded-lg">
        {loading ? (
          <PageLoader />
        ) : (
          <div className="content">
            {/* HEADER */}
            <div className="header pt-3 pb-4 w-full border-b">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-medium text-center">
                Daily Sale ({formatReadableDate(DailySaleById?.date)})
              </h2>
            </div>

            {/* ALL ENTRIES */}
            <div className="data px-6 pt-12 w-full">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-x-12">
                {(() => {
                  const filteredEntries = Object.entries(
                    DailySaleById?.saleData || {}
                  ).filter(
                    ([key]) =>
                      ![PAYMENT_METHODS.CASH, "totalCash", "totalProfit", "id"].includes(
                        key
                      )
                  );
                  const half = Math.ceil(filteredEntries.length / 2);
                  const leftEntries = filteredEntries.slice(0, half);
                  const rightEntries = filteredEntries.slice(half);

                  return (
                    <>
                      {/* LEFT SIDE */}
                      <div className="left w-full">
                        {leftEntries.map(([key, value], index) => (
                          <div
                            key={index}
                            className="flex justify-center items-center gap-4 mb-3"
                          >
                            <div className="title w-full text-md font-medium">
                              {key}
                            </div>
                            <input
                              className="border border-gray-200 text-sm rounded-md"
                              type="number"
                              value={value}
                              readOnly
                            />
                          </div>
                        ))}
                      </div>

                      {/* RIGHT SIDE */}
                      <div className="right w-full">
                        {rightEntries.map(([key, value], index) => (
                          <div
                            key={index}
                            className="flex justify-center items-center gap-4 mb-3"
                          >
                            <div className="title w-full text-md font-medium">
                              {key}
                            </div>
                            <input
                              className="border border-gray-200 text-sm rounded-md"
                              type="number"
                              value={value}
                              readOnly
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* MAIN DATA */}
            <div className="data px-6 pt-12 w-full">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-x-12">
                {/* -------- LEFT -------- */}
                <div className="left w-full">
                  <div className="flex justify-center items-center gap-4 mb-3">
                    <div className="title w-full text-md font-medium">
                      Cash Sale:
                    </div>
                    <input
                      className="border border-gray-200 text-sm rounded-md"
                      type="number"
                      value={DailySaleById?.saleData?.[PAYMENT_METHODS.CASH]}
                    />
                  </div>
                  <div className="flex justify-center items-center gap-4 mb-3">
                    <div className="title w-full text-md font-medium">
                      Total Profit:
                    </div>
                    <input
                      className="border border-gray-200 text-sm rounded-md"
                      type="number"
                      value={DailySaleById?.saleData?.totalProfit}
                    />
                  </div>
                </div>

                {/* -------- RIGHT -------- */}
                <div className="right w-full">
                  <div className="flex justify-center items-center gap-4 mb-3">
                    <div className="title w-full text-md font-medium">
                      Total Cash:
                    </div>
                    <input
                      className="border border-gray-200 text-sm rounded-md"
                      type="number"
                      value={DailySaleById?.saleData?.totalCash}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      {user?.user?.role === "user" && (
        <div className="flex gap-2">
          <button
            className="px-4 py-2.5 ml-6 mt-3 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
            onClick={() => openModal("Cash Out")}
          >
            <div className="flex items-center gap-2">
              <PiHandDeposit />
              Cash Out
            </div>
          </button>
          <button
            className="px-4 flex items gap-2 py-2.5 ml-6 mt-3 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
            onClick={() => openModal("Cash Out History")}
          >
            <MdHistory size={20} />
            Cash Out History
          </button>
        </div>
      )}

      {/* BRANCH CASHOUT MODAL */}
      {cashOutModal === "Cash Out" && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 w-96 max-w-3xl max-h-full bg-white rounded-md shadow dark:bg-gray-700">
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Branch Cash Out Details
              </h3>
              <button
                onClick={closeModal}
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

            <div className="p-4 md:p-5">
              <form className="space-y-4" onSubmit={handleSubmit}>

                 <input
                    type="date"
                    name="date"
                    id="date"
                    onChange={handleChange}
                    required
                    value={formData.date}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  />
              
                  <input
                    type="number"
                    placeholder="Amount"
                    name="amount"
                    id="amount"
                    onChange={handleChange}
                    required
                    value={formData.amount}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  />
                

                <ThemedSelect className="w-full"
                  id="payment-method"
                  name="payment_Method"
                  value={formData?.payment_Method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_Method: e.target.value,
                    })
                  }
                >
                  <option value="" disabled>
                    Payment Method
                  </option>
                  {PaymentData?.map((item) => (
                    <option value={item.value} key={item.value}>
                      {item.label}
                    </option>
                  ))}
                </ThemedSelect>

                <div className="flex justify-center pt-2">
                  <button
                    disabled={cashOutLoading}
                    type="submit"
                    className={`inline-flex items-center justify-center gap-2 rounded ${
                      cashOutLoading && "cursor-not-allowed"
                    } border border-gray-600 bg-gray-600 dark:bg-gray-500 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring`}
                  >
                    {cashOutLoading && <ButtonSpinner />}
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* BRANCH CASHOUT HISTORY MODAL */}
      {cashOutModal === "Cash Out History" && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
            {/* ------------- HEADER ------------- */}
            <div className="flex items-center justify-between p-2 md:p-2 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Branch Cash Out History
              </h3>
              {/*   CLOSE BUTTON */}
              <button
                onClick={closeModal}
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
              {/* TABLE */}
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                  <tr>
                    <th className=" px-6 py-3 text-center" scope="col">
                      Date
                    </th>
                    <th className=" px-6 py-3 text-center" scope="col">
                      Amount
                    </th>
                    <th className=" px-6 py-3 text-center" scope="col">
                      Payment Method
                    </th>                
                  </tr>
                </thead>
              </table>
              <div className="h-[60vh] scrollable-content overflow-y-auto">
                {historyLoading ? (
                  <div className="min-h-screen flex justify-center items-center">
                    <div
                      className="animate-spin inline-block w-9 h-9 border-[3px] border-current border-t-transparent text-gray-700 dark:text-gray-100 rounded-full "
                      role="status"
                      aria-label="loading"
                    >
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <table className="w-full  text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <tbody>
                      {BranchcashOutHistory?.data?.length > 0 ? (
                        BranchcashOutHistory?.data?.map((data, index) => (
                          <tr
                            key={index}
                            className="bg-white border-b text-sm font-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          >
                            <td className=" px-6 py-3 text-center" scope="row">
                              {formatReadableDate(data?.date)}
                            </td>
                            <td className=" px-6 py-3 text-center">
                              {data?.amount}
                            </td>
                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-center text-xs md:text-sm">
                              {data?.payment_Method}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="w-full flex justify-center items-center">
                          <td className="text-xl mt-3">No Data Available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <Pagination
              currentPage={page}
              totalPages={BranchcashOutHistory?.totalPages}
              totalRecords={BranchcashOutHistory?.totalRecords}
              pageSize={limit}
              syncUrl={false}
              onPageChange={(nextPage) =>
                dispatch(getBranchCashoutHistoryAsync({ page: nextPage, limit }))
              }
              onPageSizeChange={(nextLimit) =>
                dispatch(
                  getBranchCashoutHistoryAsync({ page: 1, limit: nextLimit }),
                )
              }
            />
          </div>
        </div>
      )}
    </>
  );
};

export default DailySaleDetail;
