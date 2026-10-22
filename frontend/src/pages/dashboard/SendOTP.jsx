import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  IoBarChartOutline,
  IoCashOutline,
  IoLockClosedOutline,
  IoReceiptOutline,
  IoStorefrontOutline,
} from "react-icons/io5";
import "../../auth/auth.css";
import { sendDashBoardAccessOTPAsync } from "../../features/DashboardSlice";
import ButtonSpinner from "../../Component/Common/button/ButtonSpinner";

const previewStats = [
  {
    label: "Daily Sale",
    value: "Rs 284,500",
    change: "+12.4%",
    icon: IoReceiptOutline,
  },
  {
    label: "Monthly Sale",
    value: "Rs 7.8M",
    change: "+8.1%",
    icon: IoBarChartOutline,
  },
  {
    label: "Stock Value",
    value: "18,420",
    change: "+340",
    icon: IoStorefrontOutline,
  },
  {
    label: "Cash Balance",
    value: "Rs 1.2M",
    change: "+5.6%",
    icon: IoCashOutline,
  },
];

const SendOTP = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { otpLoading } = useSelector((state) => state.dashboard);
 
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(sendDashBoardAccessOTPAsync()).then(() => {
        const endTime = new Date().getTime() + 1 * 60 * 1000; 
        localStorage.setItem('dashboardTimer',endTime)
         navigate("/dashboard/verifyOtp");
    });
  };

  return (
    <section className="relative mt-7 mb-0 mx-2 min-h-[70vh] overflow-hidden rounded-lg border border-gray-200 bg-white px-2 py-6 dark:border-gray-600 dark:bg-gray-900 md:mx-4 md:px-4 lg:mx-6 lg:px-5">
      <div className="pointer-events-none select-none blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-4 md:pt-6">
          <div>
            <h1 className="text-xl font-medium text-gray-800 dark:text-gray-200 md:text-2xl lg:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Sales, stock, cash, and business performance
            </p>
          </div>
          <div className="h-10 w-44 rounded-md border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800" />
        </div>

        <p className="mt-5 h-px w-full bg-gray-300"></p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {previewStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="flex h-40 items-center justify-between rounded-lg border border-gray-400 bg-white px-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <div>
                  <h3 className="text-md font-normal text-gray-900 dark:text-gray-100">
                    {stat.label}
                  </h3>
                  <h2 className="mb-2 mt-1.5 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </h2>
                  <span className="rounded-lg bg-green-200 px-3 py-1 text-gray-900">
                    {stat.change}
                  </span>
                </div>

                <div className="flex size-20 items-center justify-center rounded-full border-8 border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-300">
                  <Icon size={28} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="h-[22rem] rounded-lg border border-gray-400 p-4 dark:border-gray-700 lg:col-span-3">
            <div className="flex h-full items-end gap-3">
              {[42, 68, 48, 74, 56, 88, 64, 92, 70, 84, 62, 78].map(
                (height, index) => (
                  <div
                    key={index}
                    className="flex flex-1 items-end rounded-t-md bg-gray-200 dark:bg-gray-700"
                    style={{ height: `${height}%` }}
                  />
                ),
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-400 p-4 dark:border-gray-700">
            <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              Accounts
            </h2>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-700"
                >
                  <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-14 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-white/55 px-4 backdrop-blur-[2px] dark:bg-gray-900/55">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center shadow-xl dark:border-gray-700 dark:bg-gray-800 sm:p-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
            <IoLockClosedOutline size={26} />
          </div>

          <h2 className="mt-5 text-2xl font-semibold text-gray-900 dark:text-white">
            Dashboard Locked
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-gray-500 dark:text-gray-300">
            Verify access to view sales, cash, stock, and analytics.
          </p>

          {otpLoading ? (
            <button
              disabled
              type="button"
              className="mt-6 flex h-10 w-full cursor-not-allowed items-center gap-2 justify-center rounded-md bg-green-300 px-5 text-center text-sm font-medium text-white focus:outline-none"
            >
              <ButtonSpinner />
              Send OTP
            </button>
          ) : (
            <button
              type="submit"
              onClick={handleSubmit}
              className="mt-6 h-10 w-full rounded-md bg-[#6CD572] px-5 text-center text-sm font-medium text-white hover:bg-green-400 focus:outline-none"
            >
              Send OTP
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default SendOTP;
