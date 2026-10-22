import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  createTransactionAsync,
  getDataForOtherBranchAsync,
  getDataForSuperAdminAsync,
  getTransactionHIstoryAsync,
} from "../../features/DashboardSlice";
import { useEffect, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { PiHandDeposit, PiHandWithdraw } from "react-icons/pi";
import { FaHistory } from "react-icons/fa";
import SendOTP from "./SendOTP";
import { CiSearch } from "react-icons/ci";
import moment from "moment-timezone";
import { GrPowerReset } from "react-icons/gr";
import SuitSalesGraph from "./SuitSalesGraph";
import Pagination from "../../Component/Common/Pagination";
import { DEFAULT_PAGE_LIMIT, PAYMENT_METHODS, formatReadableDate } from "../../Utils/Common";
import PageLoader from "../../Component/Loader/PageLoader";
import ThemedSelect from "../../Component/Common/select/ThemedSelect";
import ButtonSpinner from "../../Component/Common/button/ButtonSpinner";

const DashboardStats = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { PaymentData } = useSelector((state) => state.PaymentMethods);
  const { user } = useSelector((state) => state.auth);
  const { loading, DashboardData, transactionLoading, TransactionsHistory } =
    useSelector((state) => state.dashboard);
  const [hasError, setHasError] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");

  const [transactionType, setTransactionType] = useState("");
  const [transactionModal, setTransactionModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);


  const [formData, setFormData] = useState({
    date: today,
    transactionType: "",
    payment_Method: "",
    amount: "",
    note: "",
  });

  useEffect(() => {
    if (user?.user?.role === "superadmin") {
      dispatch(getDataForSuperAdminAsync()).then((res) => {
        if (res?.error) {
          setHasError(true);
          localStorage.removeItem("dashboardAccessTime");
        }
        setDataLoading(false);
      });
    } else {
      dispatch(getDataForOtherBranchAsync()).then((res) => {
        if (res?.error) {
          setHasError(true);
          localStorage.removeItem("dashboardAccessTime");
        }
        setDataLoading(false);
      });
    }
  }, [user]);

  useEffect(() => {
    const updateTime = () => {
      const endTime = localStorage.getItem("dashboardAccessTime");
      if (endTime) {
        const now = new Date().getTime();
        const timeLeft = Math.max(endTime - now, 0);
        if (timeLeft === 0) {
          localStorage.removeItem("dashboardAccessTime");
          setHasError(true);
        }
      }
    };
    const interval = setInterval(updateTime, 60000);
    updateTime();
    return () => clearInterval(interval);
  }, []);

  ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
  );

  const getMonthlySalesData = (monthlyGraphData) => {
    const salesData = Array(12).fill(0);
    monthlyGraphData.forEach(({ totalSale, month }) => {
      const monthIndex = parseInt(month, 10) - 1;
      salesData[monthIndex] = totalSale;
    });

    return salesData;
  };

  const barChartData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Monthly Sale",
        data: getMonthlySalesData(DashboardData?.monthlyGraphData || []),
        backgroundColor: "#CCCCCC",
        borderColor: "#434343",
        borderWidth: 2,
        borderRadius: 5,
      },
    ],
  };

  const handleShowSuits = () => {
    navigate(`/dashboard/suits`);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const validateValue = (value) => {
    return value === undefined || value === null || isNaN(value) || value === ""
      ? ""
      : parseInt(value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "amount" ? validateValue(value) : value,
      transactionType: transactionType,
    }));
  };

  const opemTransactionMOdal = (transactionValue) => {
    setTransactionType(transactionValue);
    setTransactionModal(true);
  };

  const closeTransactionMOdal = () => {
    setTransactionType("");
    setTransactionModal(false);
  };

  const openConfirmationModal = () => {
    setConfirmationModal(true);
  };

  const closeConfirmationModal = () => {
    setConfirmationModal(false);
  };

  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    transactionType: "",
    account: "",
  });

  const openHistoryModal = () => {
    setHistoryModal(true);
    document.body.style.overflow = "hidden";
    const data = {
      page: 1,
      limit: DEFAULT_PAGE_LIMIT,
      filters,
    };
    dispatch(getTransactionHIstoryAsync(data));
  };

  const closeHistoryModal = () => {
    document.body.style.overflow = "auto";
    setHistoryModal(false);
    setDate("");
  };

  const handleTransaction = (e) => {
    e.preventDefault();
    setConfirmationModal(false);
    dispatch(createTransactionAsync(formData)).then((res) => {
      if (res.payload.success === true) {
        dispatch(getDataForSuperAdminAsync()).then((res) => {
          if (res?.error) {
            setHasError(true);
            localStorage.removeItem("dashboardAccessTime");
          }
          setDataLoading(false);
        });
        closeTransactionMOdal();
        setTransactionType("");
        resetFormData();
      }
    });
  };

  const resetFormData = () => {
    setFormData({
      date: today,
      transactionType: "",
      payment_method: "",
      amount: "",
      note: "",
    });
  };

  const page = TransactionsHistory?.page;
  const limit = TransactionsHistory?.limit || DEFAULT_PAGE_LIMIT;

  const handleChangeFilters = (e) => {
    const { name, value } = e.target;
    setFilters((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFiltersSearch = () => {
    dispatch(getTransactionHIstoryAsync({ page: 1, limit, filters }));
  };

  const handleResetFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      transactionType: "",
      payment_Method: "",
      account: "",
    });
    dispatch(getTransactionHIstoryAsync({ page: 1, limit, filters }));
  };

  if (hasError) {
    return <SendOTP />;
  }

  const filterdPaymentAccounts = PaymentData.filter(
    (item) => item.label !== PAYMENT_METHODS.CASH,
  );

  return (
    <>
      {dataLoading || loading ? (
        <PageLoader />
      ) : (
        <section className="bg-white dark:bg-gray-900 mt-7 mb-0 mx-6 px-2 pt-6 pb-16 min-h-screen rounded-lg">
          {/* ------------ FIRST STATS BAR ------------*/}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:grid-cols-2 xl:grid-cols-4 lg:gap-3">
            {/* FIRST BOX */}
            <div className="h-40 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-700 flex justify-between items-center">
              <div className="stat_data">
                <h3 className="text-gray-900 dark:text-gray-100 mt-1.5 text-md font-normal">
                  Daily Sale
                </h3>
                <h2 className="text-gray-900 dark:text-gray-100 mt-1.5 mb-2 text-2xl font-semibold">
                  {DashboardData?.dailySale?.today}
                </h2>
                <span
                  className={`text-gray-900 ${
                    DashboardData?.dailySale?.differenceFromYesterday >= 0
                      ? "bg-green-200"
                      : "bg-red-200"
                  } px-3 py-1 rounded-lg`}
                >
                  {DashboardData?.dailySale?.differenceFromYesterday >= 0
                    ? `+${DashboardData?.dailySale?.differenceFromYesterday}`
                    : DashboardData?.dailySale?.differenceFromYesterday}
                </span>
              </div>

              <div className="size-28">
                <CircularProgressbar
                  value={Math.abs(DashboardData?.dailySale?.percentage)}
                  text={`${DashboardData?.dailySale?.percentage}%`}
                  styles={buildStyles({
                    rotation: 1,
                    strokeLinecap: "butt",
                    textSize: "20px",
                    pathTransitionDuration: 0.5,
                    pathColor:
                      DashboardData?.dailySale?.percentage >= 0
                        ? "#31C48D"
                        : "#F60002",
                    textColor:
                      DashboardData?.dailySale?.percentage >= 0
                        ? "#31C48D"
                        : "#F60002",
                    trailColor: "#d6d6d6",
                    backgroundColor: "#3e98c7",
                  })}
                />
              </div>
            </div>

            {/* SECOND BOX */}
            <div className="h-40 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-700 flex justify-between items-center">
              <div className="stat_data">
                <h3 className="text-gray-900 dark:text-gray-100 mt-1.5 text-md font-normal">
                  Monthly Sale
                </h3>
                <h2 className="text-gray-900 dark:text-gray-100 mt-1.5 mb-2 text-2xl font-semibold">
                  {DashboardData?.monthlysale?.currentMonthSale}
                </h2>
                <span
                  className={`text-gray-900 ${
                    DashboardData?.monthlysale?.differenceFromLastMonth >= 0
                      ? "bg-green-200"
                      : "bg-red-200"
                  } px-3 py-1 rounded-lg`}
                >
                  {DashboardData?.monthlysale?.differenceFromLastMonth > 0
                    ? "+" + DashboardData?.monthlysale?.differenceFromLastMonth
                    : DashboardData?.monthlysale?.differenceFromLastMonth}
                </span>
              </div>

              <div className="size-28">
                <CircularProgressbar
                  value={Math.abs(DashboardData?.monthlysale?.percentage)}
                  text={`${DashboardData?.monthlysale?.percentage}%`}
                  styles={buildStyles({
                    // Rotation of path and trail, in number of turns (0-1)
                    rotation: 1,
                    strokeLinecap: "butt",
                    textSize: "20px",
                    pathTransitionDuration: 0.5,
                    pathColor:
                      DashboardData?.monthlysale?.percentage >= 0
                        ? "#31C48D"
                        : "#F60002",
                    textColor:
                      DashboardData?.monthlysale?.percentage >= 0
                        ? "#31C48D"
                        : "#F60002",
                    trailColor: "#d6d6d6",
                    backgroundColor: "#3e98c7",
                  })}
                />
              </div>
            </div>

            {/* THIRD BOX */}
            <div className="h-40 px-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-700 flex justify-between items-center">
              <div className="stat_data">
                <h3 className="text-gray-900 dark:text-gray-100 mt-1.5 text-md font-normal">
                  Gross Sale
                </h3>
                <h2 className="text-gray-900 dark:text-gray-100 mt-1.5 mb-2 text-2xl font-semibold">
                  {DashboardData?.grossSale?.currentyearSale}
                </h2>
                <span
                  className={`text-gray-900 ${
                    DashboardData?.grossSale?.differenceFromLastYear >= 0
                      ? "bg-green-200"
                      : "bg-red-200"
                  } px-3 py-1 rounded-lg`}
                >
                  {DashboardData?.grossSale?.differenceFromLastYear > 0
                    ? "+" + DashboardData?.grossSale?.differenceFromLastYear
                    : DashboardData?.grossSale?.differenceFromLastYear}
                </span>
              </div>

              <div className="size-28">
                <CircularProgressbar
                  value={Math.abs(DashboardData?.grossSale?.percentage)}
                  text={`${DashboardData?.grossSale?.percentage}%`}
                  styles={buildStyles({
                    // Rotation of path and trail, in number of turns (0-1)
                    rotation: 1,
                    strokeLinecap: "butt",
                    textSize: "20px",
                    pathTransitionDuration: 0.5,
                    pathColor:
                      DashboardData?.grossSale?.percentage >= 0
                        ? "#31C48D"
                        : "#F60002",
                    textColor:
                      DashboardData?.grossSale?.percentage >= 0
                        ? "#31C48D"
                        : "#F60002",
                    trailColor: "#d6d6d6",
                    backgroundColor: "#3e98c7",
                  })}
                />
              </div>
            </div>

            {/* FORTH BOX */}
            <div className="h-40 px-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-700 flex justify-between items-center">
              <div className="stat_data">
                <h3 className="text-gray-900 dark:text-gray-100 mt-1.5 text-md font-normal">
                  Gross Profit
                </h3>
                <h2 className="text-gray-900 dark:text-gray-100 mt-1.5 mb-2 text-2xl font-semibold">
                  {DashboardData?.grossProfit?.currentYearGrossProfit}
                </h2>
                <span
                  className={`text-gray-900 ${
                    DashboardData?.grossProfit?.differenceFromLastyear >= 0
                      ? "bg-green-200"
                      : "bg-red-200"
                  } px-3 py-1 rounded-lg`}
                >
                  {DashboardData?.grossProfit?.differenceFromLastyear > 0
                    ? "+" + DashboardData?.grossProfit?.differenceFromLastyear
                    : DashboardData?.grossProfit?.differenceFromLastyear}
                </span>
              </div>

              <div className="size-28">
                <CircularProgressbar
                  value={Math.abs(DashboardData?.grossProfit?.percentage)}
                  text={`${DashboardData?.grossProfit?.percentage}%`}
                  styles={buildStyles({
                    // Rotation of path and trail, in number of turns (0-1)
                    rotation: 1,
                    strokeLinecap: "butt",
                    textSize: "20px",
                    pathTransitionDuration: 0.5,
                    pathColor:
                      DashboardData?.grossProfit?.percentage >= 0
                        ? "#31C48D"
                        : "#F60002",
                    textColor:
                      DashboardData?.grossProfit?.percentage >= 0
                        ? "#31C48D"
                        : "#F60002",
                    trailColor: "#d6d6d6",
                    backgroundColor: "#3e98c7",
                  })}
                />
              </div>
            </div>
          </div>

          {/* ------------ SECOND STATS BAR ------------*/}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-4">
            <div className="rounded-lg md:col-span-1 lg:col-span-4 xl:col-span-3">
              {/* BAR CHARTS */}
              <div className="h-[22rem] rounded-lg text-gray-900 dark:text-gray-100 border border-gray-400 dark:border-gray-700 w-full p-4">
                <Bar
                  data={barChartData}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>

              {/* TOTAL SUITES && ACCOUNTS */}
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-4 rounded-lg">
                {/* TOTAL SUITE */}
                <div className="rounded-lg lg:col-span-3">
                  <div className="min-h-72 px-3 py-4 text-gray-900 dark:text-gray-200 rounded-lg border border-gray-400 dark:border-gray-700">
                    <h2 className="text-lg font-medium mb-3">Total Suits</h2>
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                      <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                        <tr>
                          <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                            Category
                          </th>
                          <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                            Colors
                          </th>
                          <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                            Type
                          </th>
                          <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {DashboardData &&
                        DashboardData?.totalSuits?.length > 0 ? (
                          DashboardData?.totalSuits
                            ?.slice(0, 4)
                            .map((data, index) => (
                              <tr
                                key={index}
                                onClick={handleShowSuits}
                                className="bg-white border-b cursor-pointer text-md font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                              >
                                <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">{data.category}</td>
                                <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">{data.color}</td>
                                <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">{data.stitch_type}</td>
                                <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">{data.quantity}</td>
                              </tr>
                            ))
                        ) : (
                          <tr className="w-full flex justify-center items-center">
                            <td className="text-xl mt-3">No Data Available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {/* BUTTON */}
                    {DashboardData?.totalSuits?.length > 0 ? (
                      <div className="button w-full flex justify-center items-center mt-3">
                        <Link
                          to="/dashboard/suits"
                          onClick={() => window.scrollTo(0, 0)}
                          className="bg-gray-300 px-6 py-1 rounded-md"
                        >
                          View All
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* ACCOUNTS DETAILS */}
                <div className="lg:col-span-1">
                  <div className="mb-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-700 flex justify-start items-center">
                    <div className="stat_data pl-4">
                      <h3 className="text-gray-900 dark:text-gray-100 text-lg font-medium">
                        Cash In Hand
                      </h3>
                      <h3 className="mt-1 text-gray-900 dark:text-gray-100">
                        <span className="text-xl font-semibold mr-2">
                          Rs {DashboardData?.cashInHand}
                        </span>
                      </h3>
                    </div>
                  </div>
                  <div className="mb-3 py-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-green-400 dark:border-green-700 flex justify-start items-center">
                    <div className="stat_data pl-4">
                      <h3 className="text-gray-900 dark:text-gray-100 text-lg font-medium">
                        Receivable
                      </h3>
                      <h3 className="mt-1 text-gray-900 dark:text-gray-100">
                        <span className="text-xl font-semibold mr-2">
                          Rs {DashboardData?.recieveable}
                        </span>
                      </h3>
                    </div>
                  </div>
                  {user?.user?.role === "superadmin" ? (
                    <div className="mb-3 py-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-red-400 dark:border-gray-700 flex justify-start items-center">
                      <div className="stat_data pl-4">
                        <h3 className="text-gray-900 dark:text-gray-100 text-lg font-medium">
                          Payable
                        </h3>
                        <h3 className="mt-1 text-gray-900 dark:text-gray-100">
                          <span className="text-xl font-semibold mr-2">
                            Rs {DashboardData?.payable}
                          </span>
                        </h3>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div>
              {/* SALES BY LOCATION */}
              <div className="h-[22rem] mb-5 px-4 pt-5 lg:col-span-4 xl:col-span-1 pb-5 text-gray-900 dark:text-gray-200 rounded-lg border border-gray-400 dark:border-gray-700">
                <div className="sticky top-0 bg-white dark:bg-gray-800 px-4 py-2 border-b border-gray-400 dark:border-gray-700 z-10">
                  <h2 className="font-medium text-lg">Sales By Locations</h2>
                </div>
                <div className="scrollable-content auto h-[calc(22rem-4.4rem)]">
                  {" "}
                  {DashboardData?.salesBylocation?.map((data, index) => (
                    <div
                      key={index}
                      className="my-4 px-3 city flex justify-between items-center border-b"
                    >
                      <span>{data?.city?.name}</span>
                      <span className="font-semibold">{data?.city?.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BANK ACCOUNT */}
              <div className=" px-4 pt-2 lg:col-span-4 xl:col-span-1 pb-2 text-gray-900 dark:text-gray-200 rounded-lg border border-gray-400 dark:border-gray-700">
                <div className="flex flex-col justify-between h-full">
                  <div className="scrollable-content max-h-[17.5rem] pr-2">
                    <div className="flex justify-between items-center">
                      <h2 className="mb-1 font-medium text-lg">
                        Bank Accounts
                      </h2>
                      {user?.user?.role === "superadmin" && (
                        <FaHistory
                          className="cursor-pointer"
                          onClick={openHistoryModal}
                          size={18}
                        />
                      )}
                    </div>
                    {DashboardData?.bankAccountsData &&
                      DashboardData?.bankAccountsData.map((account, index) => (
                        <div
                          key={index}
                          className="my-3 flex justify-between items-center border-b"
                        >
                          <span className="text-sm">{account.name}</span>
                          <span className="text-sm font-semibold">
                            {account.value}
                          </span>
                        </div>
                      ))}
                  </div>

                  {user?.user?.role === "superadmin" && (
                    <div className="flex justify-evenly items-center mt-2">
                      <button onClick={(e) => opemTransactionMOdal("Deposit")}>
                        <PiHandDeposit size={32} className="text-green-500 " />
                      </button>
                      <button onClick={() => opemTransactionMOdal("WithDraw")}>
                        <PiHandWithdraw size={32} className="text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg p-2 text-gray-900 dark:text-gray-100 border border-gray-400 dark:border-gray-700 grid grid-cols-4 gap-4 col-span-4">
              <SuitSalesGraph />
            </div>
          </div>
        </section>
      )}
      {/* TRANSACTION MODAL */}
      {transactionModal && !confirmationModal && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 w-[95%] max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
            {/* ------------- HEADER ------------- */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Transaction Details
              </h3>
              <button
                onClick={closeTransactionMOdal}
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
              <form onSubmit={openConfirmationModal}>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-x-4">
                  {/* AMOUNT */}
                  <div>
                    <input
                      name="amount"
                      type="text"
                      inputMode="numeric"
                      placeholder="Amount"
                      value={formData.amount}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* DATE */}
                  <div>
                    <input
                      name="date"
                      type="date"
                      placeholder="Date"
                      value={today}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                      readOnly
                    />
                  </div>

                  {/* payment_Method */}
                  <div className="col-span-2">
                    <ThemedSelect className="w-full"
                      name="payment_Method"
                      value={formData.payment_Method}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>
                        Payment Method
                      </option>
                      {filterdPaymentAccounts?.map((item) => (
                        <option value={item.value} key={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </ThemedSelect>
                  </div>

                  {/* NOtE */}
                  <div className="col-span-2">
                    <input
                      name="note"
                      type="text"
                      inputMode="text"
                      placeholder="Write Note"
                      value={formData.note}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-center mt-6">
                  {transactionLoading ? (
                    <button
                      disabled
                      type="button"
                      className="text-white cursor-not-allowed border-gray-600 bg-gray-300 focus:ring-0 focus:outline-none font-medium rounded text-sm px-5 py-3 text-center mr-2  inline-flex items-center gap-2"
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
      )}
      {/* CONFIRMATION MODAL */}
      {confirmationModal && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 w-[95%] max-w-lg bg-white rounded-md shadow dark:bg-gray-700">
            <div className="flex items-center justify-center p-4 border-b dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {transactionType === "Deposit" ? (
                  <span className="text-green-500 flex items-center justify-center gap-4">
                    Deposit <PiHandDeposit size={32} />
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center justify-center gap-4">
                    Withdraw <PiHandWithdraw size={32} />
                  </span>
                )}
              </h3>
            </div>
            <div className="p-4">
              <p className="text-gray-700 text-center dark:text-gray-300">
                Are You Sure Want To Make a Transaction of{" "}
                <span className="font-semibold">{formData.amount}</span> ?
              </p>
            </div>
            <div className="flex justify-center p-2">
              <button
                onClick={closeConfirmationModal}
                className="px-4 py-2 text-sm rounded bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white mr-2"
              >
                Cancel
              </button>

              <button
                onClick={handleTransaction}
                className="px-4 py-2.5 text-sm rounded bg-green-500 dark:bg-gray-200 text-white dark:text-gray-800"
              >
                Confirm
              </button>
            </div>

            <div className="button_box absolute top-6 right-6">
              <button
                onClick={closeConfirmationModal}
                className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
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
          </div>
        </div>
      )}
      {/* HISTORY MODALS */}
      {historyModal && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 max-w-7xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
            {/* ------------- HEADER ------------- */}
            <div className="flex items-center justify-between p-2 md:p-2 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Accounts Statement
              </h3>
              {/*   CLOSE BUTTON */}
              <button
                onClick={closeHistoryModal}
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
              {/* SEARCH FILTERS */}
              <div className="flex items-center gap-3 justify-center mb-4">
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
                  {filterdPaymentAccounts?.map((item) => (
                    <option value={item.value} key={item.value}>
                      {item.label}
                    </option>
                  ))}
                </ThemedSelect>
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
              <div className="h-[40vh] scrollable-content overflow-y-auto">
                {transactionLoading ? (
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
                  <table className="w-full table-fixed text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="sticky top-0 z-10 text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                      <tr>
                        <th className="w-[15%] px-4 py-3 text-center" scope="col">
                          Date
                        </th>
                        <th className="w-[15%] px-4 py-3 text-center" scope="col">
                          Transaction Type
                        </th>
                        <th className="w-[11%] px-4 py-3 text-center" scope="col">
                          Amount
                        </th>
                        <th className="w-[18%] px-4 py-3 text-center" scope="col">
                          Payment Method
                        </th>
                        <th className="w-[14%] px-4 py-3 text-center" scope="col">
                          New Balance
                        </th>
                        <th className="w-[27%] px-4 py-3 text-center" scope="col">
                          Note
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {TransactionsHistory &&
                      TransactionsHistory?.data?.length > 0 ? (
                        TransactionsHistory?.data?.map((data, index) => (
                          <tr
                            key={index}
                            className="bg-white border-b text-sm font-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          >
                            <td className="px-4 py-3 text-center" scope="row">
                              {formatReadableDate(data.date)}
                            </td>
                            <td
                              className={`px-4 py-3 text-center ${
                                data?.transactionType === "Deposit"
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {data?.transactionType}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {data?.amount}
                            </td>
                            <td className="px-4 py-3 text-center text-xs md:text-sm break-words">
                              {data?.payment_Method}
                            </td>
                            <td className="px-4 py-3 text-center text-xs md:text-sm">
                              {data?.new_balance}
                            </td>
                            <td className="px-4 py-3 text-xs text-center whitespace-normal break-words">
                              {data?.note}
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
             className="
               !mt-4 !w-full !min-w-0 !max-w-none
               !flex-nowrap !gap-2
               [&>div:first-child]:!min-w-fit
               [&>div:first-child]:!whitespace-nowrap
               [&>div:nth-child(2)]:!flex-none
               [&>div:nth-child(2)]:!flex-nowrap
               [&>div:nth-child(3)]:!min-w-fit
               [&>div:nth-child(3)]:!flex-nowrap
             "
              currentPage={page}
              totalPages={TransactionsHistory?.totalPages}
              totalRecords={TransactionsHistory?.totalRecords}
              pageSize={limit}
              syncUrl={false}
              onPageChange={(nextPage) =>
                dispatch(
                  getTransactionHIstoryAsync({
                    page: nextPage,
                    limit,
                    filters,
                  }),
                )
              }
              onPageSizeChange={(nextLimit) =>
                dispatch(
                  getTransactionHIstoryAsync({
                    page: 1,
                    limit: nextLimit,
                    filters,
                  }),
                )
              }
            />
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardStats;
