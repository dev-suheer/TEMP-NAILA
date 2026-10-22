import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import {
  IoCashOutline,
  IoPeopleOutline,
  IoStatsChartOutline,
  IoWalletOutline,
} from "react-icons/io5";
import { getAccountsStatsAsync } from "../../features/DashboardSlice";
import Loading from "../../Component/Loader/Loading";
import ButtonSpinner from "../../Component/Common/button/ButtonSpinner";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  maximumFractionDigits: 0,
});

const formatAmount = (value) => currencyFormatter.format(Number(value) || 0);

const statusColors = {
  Paid: "#10B981",
  Unpaid: "#EF4444",
  "Advance Paid": "#3B82F6",
  "Partially Paid": "#F59E0B",
};

const financialColors = ["#EF4444", "#111827", "#059669"];

const buildFinancialChartData = (account) => ({
  labels: ["Debit", "Credit", "Balance"],
  datasets: [
    {
      label: account?.label || "Account",
      data: [
        account?.totalDebit || 0,
        account?.totalCredit || 0,
        account?.totalBalance || 0,
      ],
      backgroundColor: financialColors,
      borderRadius: 8,
      borderSkipped: false,
      maxBarThickness: 46,
    },
  ],
});

const buildStatusChartData = (statuses = {}) => {
  const labels = Object.keys(statuses);

  return {
    labels,
    datasets: [
      {
        data: labels.map((label) => statuses[label] || 0),
        backgroundColor: labels.map((label) => statusColors[label] || "#6B7280"),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context) => `${context.label}: ${formatAmount(context.raw)}`,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#4B5563",
        font: {
          family: "Poppins",
        },
      },
    },
    y: {
      grid: {
        color: "#E5E7EB",
      },
      ticks: {
        color: "#6B7280",
        callback: (value) => formatAmount(value),
        font: {
          family: "Poppins",
        },
      },
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "68%",
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        padding: 14,
        color: "#374151",
        font: {
          family: "Poppins",
          size: 12,
        },
      },
    },
  },
};

const HeaderMetric = ({ label, value, icon: Icon, colorClass }) => (
  <div className="flex min-w-[135px] items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${colorClass}`}
    >
      <Icon className="text-base" />
    </span>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-300">
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  </div>
);

const StatusPill = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700">
    <div className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: statusColors[label] || "#6B7280" }}
      />
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {label}
      </span>
    </div>
    <span className="text-sm font-semibold text-gray-900 dark:text-white">
      {value || 0}
    </span>
  </div>
);

const CategoryBreakdown = ({ items = [] }) => {
  if (!items.length) return null;

  const statusLabels = Object.keys(items[0]?.statuses || {});

  return (
    <div className="mt-5 rounded-lg border border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          By Category
        </h3>
        <span className="text-xs font-medium text-gray-500">
          {items.length} categories
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-300">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">Category</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">Parties</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">Debit</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">Credit</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">Balance</th>
              {statusLabels.map((status) => (
                <th key={status} className="whitespace-nowrap px-4 py-3 text-right">
                  {status}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((item) => (
              <tr key={item.category} className="text-gray-700 dark:text-gray-200">
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900 dark:text-white">
                  {item.category}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                  {formatAmount(item.totalAccounts)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-[#ff4d4d]">
                  {formatAmount(item.totalDebit)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                  {formatAmount(item.totalCredit)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-[#009970]">
                  {formatAmount(item.totalBalance)}
                </td>
                {statusLabels.map((status) => (
                  <td key={status} className="whitespace-nowrap px-4 py-3 text-right">
                    <span className="inline-flex items-center justify-end gap-2 font-semibold">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: statusColors[status] || "#6B7280",
                        }}
                      />
                      {formatAmount(item.statuses?.[status])}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AccountSection = ({ account }) => {
  const statuses = account?.statuses || {};
  const statusValues = Object.values(statuses);
  const hasStatusData = statusValues.some((value) => Number(value) > 0);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {account?.label}
          </h2>
        </div>

        <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-4">
          <HeaderMetric
            label="Debit"
            value={formatAmount(account?.totalDebit)}
            icon={IoCashOutline}
            colorClass="bg-red-50 text-[#ff4d4d] dark:bg-red-950/30"
          />
          <HeaderMetric
            label="Credit"
            value={formatAmount(account?.totalCredit)}
            icon={IoWalletOutline}
            colorClass="bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
          />
          <HeaderMetric
            label="Balance"
            value={formatAmount(account?.totalBalance)}
            icon={IoStatsChartOutline}
            colorClass="bg-emerald-50 text-[#009970] dark:bg-emerald-950/30"
          />
          <HeaderMetric
            label="Parties"
            value={formatAmount(account?.totalAccounts)}
            icon={IoPeopleOutline}
            colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/30"
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <div className="h-72 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
          <Bar data={buildFinancialChartData(account)} options={chartOptions} />
        </div>

        <div className="grid gap-4 md:grid-cols-[210px_minmax(0,1fr)] xl:grid-cols-1">
          <div className="relative h-56 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
            {hasStatusData ? (
              <Doughnut
                data={buildStatusChartData(statuses)}
                options={doughnutOptions}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-medium text-gray-400">
                No status data
              </div>
            )}
          </div>
          <div className="grid content-start gap-2">
            {Object.entries(statuses).map(([label, value]) => (
              <StatusPill key={label} label={label} value={value} />
            ))}
          </div>
        </div>
      </div>

      <CategoryBreakdown items={account?.categoryBreakdown || []} />
    </section>
  );
};

const AccountsDashboard = () => {
  const dispatch = useDispatch();
  const { AccountsStats, accountsStatsLoading } = useSelector(
    (state) => state.dashboard
  );

  useEffect(() => {
    dispatch(getAccountsStatsAsync());
  }, [dispatch]);

  const accountSections = [
    AccountsStats?.data?.buyers,
    AccountsStats?.data?.sellers,
    AccountsStats?.data?.process,
  ].filter(Boolean);

  return (
    <div className="mt-7 mb-0 min-h-[80vh] rounded-lg border border-gray-200 bg-white px-5 py-6 shadow-sm dark:border-gray-600 dark:bg-gray-800 md:mx-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white">
            Accounts Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            Credit, debit, balance, and payment status by account type.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(getAccountsStatsAsync())}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
          disabled={accountsStatsLoading}
        >
          {accountsStatsLoading && <ButtonSpinner />}
          Refresh
        </button>
      </div>

      {accountsStatsLoading && !AccountsStats ? (
        <div className="flex min-h-[360px] items-center justify-center">
          <Loading/>
        </div>
      ) : (
        <>
          <div className="grid gap-5">
            {accountSections.map((account) => (
              <AccountSection key={account.label} account={account} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AccountsDashboard;
