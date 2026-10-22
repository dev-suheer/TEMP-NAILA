import { useEffect, useState } from "react";
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
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoCubeOutline,
  IoRefreshOutline,
  IoStatsChartOutline,
} from "react-icons/io5";
import { CiSearch } from "react-icons/ci";
import { GrPowerReset } from "react-icons/gr";
import { getProcessAnalyticsAsync } from "../../features/DashboardSlice";
import ButtonSpinner from "../../Component/Common/button/ButtonSpinner";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

const numberFormatter = new Intl.NumberFormat("en-PK", {
  maximumFractionDigits: 2,
});

const formatNumber = (value) => numberFormatter.format(Number(value) || 0);

const statusColors = {
  Pending: "#F59E0B",
  Completed: "#10B981",
};

const processCategories = [
  "Embroidery",
  "Calender",
  "Cutting",
  "Stones",
  "Stitching",
];

const compactChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#4B5563", font: { family: "Poppins" } },
    },
    y: {
      grid: { color: "#E5E7EB" },
      ticks: { color: "#6B7280", font: { family: "Poppins" } },
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
        usePointStyle: true,
        boxWidth: 8,
        padding: 14,
        color: "#374151",
        font: { family: "Poppins", size: 12 },
      },
    },
  },
};

const buildQuantityChartData = (section) => ({
  labels: [section.sentLabel, section.receivedLabel],
  datasets: [
    {
      label: section.unit,
      data: [section.sent || 0, section.received || 0],
      backgroundColor: ["#111827", "#009970"],
      borderRadius: 8,
      borderSkipped: false,
      maxBarThickness: 48,
    },
  ],
});

const buildStatusChartData = (statuses = {}) => {
  const labels = Object.keys(statuses);

  return {
    labels,
    datasets: [
      {
        data: labels.map((status) => statuses[status] || 0),
        backgroundColor: labels.map((status) => statusColors[status] || "#6B7280"),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };
};

const Metric = ({ label, value, icon: Icon, colorClass, suffix = "" }) => (
  <div className="flex min-w-[132px] items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${colorClass}`}>
      <Icon className="text-base" />
    </span>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-300">
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
        {formatNumber(value)} {suffix}
      </p>
    </div>
  </div>
);

const StatusPill = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700">
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

const PartyBreakdown = ({ section }) => {
  const parties = section.parties || [];
  const showMeters = section.label === "Embroidery";

  if (!parties.length) {
    return (
      <div className="mt-5 rounded-lg border border-gray-100 p-8 text-center text-sm font-medium text-gray-400 dark:border-gray-800">
        No party data for the selected filters
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-lg border border-gray-100 dark:border-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Party Breakdown
          </h3>
         
        </div>
        <span className="rounded-md bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
          {parties.length} parties
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-300">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">Party Name</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">Records</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">
                {section.sentLabel}
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right">
                {section.receivedLabel}
              </th>
              {showMeters && (
                <>
                  <th className="whitespace-nowrap px-4 py-3 text-right">
                    Sent Meters
                  </th>
                
                </>
              )}
              <th className="whitespace-nowrap px-4 py-3 text-right">
                Pending
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right">
                Completed
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right">
                Bills Generated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {parties.map((party) => (
              <tr
                key={party.partyName}
                className="text-gray-700 dark:text-gray-200"
              >
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900 dark:text-white">
                  {party.partyName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                  {formatNumber(party.records)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                  {formatNumber(party.sent)} {section.unit}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-[#009970]">
                  {formatNumber(party.received)} {section.unit}
                </td>
                {showMeters && (
                  <>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                      {formatNumber(party.sentMeters)} m
                    </td>
                   
                  </>
                )}
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <span className="inline-flex min-w-8 justify-center rounded-md bg-amber-50 px-2 py-1 font-semibold text-amber-600 dark:bg-amber-950/30">
                    {formatNumber(party.pending)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <span className="inline-flex min-w-8 justify-center rounded-md bg-emerald-50 px-2 py-1 font-semibold text-[#009970] dark:bg-emerald-950/30">
                    {formatNumber(party.completed)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <span className="inline-flex min-w-8 justify-center rounded-md bg-gray-100 px-2 py-1 font-semibold text-gray-900 dark:bg-gray-800 dark:text-white">
                    {formatNumber(party.billsGenerated)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ProcessSection = ({ section }) => {
  const isEmbroidery = section.label === "Embroidery";
  const hasStatuses = Object.values(section.statuses || {}).some(
    (value) => Number(value) > 0
  );

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {section.label}
        </h2>

        <div
          className={`grid w-full gap-2 sm:grid-cols-2 xl:w-auto ${
            isEmbroidery ? "xl:grid-cols-5" : "xl:grid-cols-4"
          }`}
        >
          <Metric
            label="Records"
            value={section.totalRecords}
            icon={IoStatsChartOutline}
            colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/30"
          />
          <Metric
            label={section.sentLabel}
            value={section.sent}
            suffix={section.unit}
            icon={IoCubeOutline}
            colorClass="bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
          />
          <Metric
            label={section.receivedLabel}
            value={section.received}
            suffix={section.unit}
            icon={IoCheckmarkCircleOutline}
            colorClass="bg-emerald-50 text-[#009970] dark:bg-emerald-950/30"
          />
          {isEmbroidery ? (
            <>
             <Metric
              label="Sent Meters"
              value={section.sentMeters}
              icon={IoCubeOutline}
              colorClass="bg-orange-50 text-orange-600 dark:bg-orange-950/30"
            />
            <Metric
              label="Packed"
              value={section.packedCompleted}
              icon={IoCubeOutline}
              colorClass="bg-orange-50 text-orange-600 dark:bg-orange-950/30"
            />
            </>
          ) : (
            <Metric
              label="Pending"
              value={section.statuses?.Pending}
              icon={IoCalendarOutline}
              colorClass="bg-amber-50 text-amber-600 dark:bg-amber-950/30"
            />
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
        <div className="h-64 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
          <Bar data={buildQuantityChartData(section)} options={compactChartOptions} />
        </div>

        <div className="grid gap-4 md:grid-cols-[210px_minmax(0,1fr)] xl:grid-cols-1">
          <div className="h-56 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
            {hasStatuses ? (
              <Doughnut
                data={buildStatusChartData(section.statuses)}
                options={doughnutOptions}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-medium text-gray-400">
                No status data
              </div>
            )}
          </div>
          <div className="grid content-start gap-2">
            {Object.entries(section.statuses || {}).map(([status, value]) => (
              <StatusPill key={status} label={status} value={value} />
            ))}
          </div>
        </div>
      </div>

      <PartyBreakdown section={section} />
    </section>
  );
};

const ProcessAnalytics = () => {
  const dispatch = useDispatch();
  const { ProcessAnalytics: analyticsData, processAnalyticsLoading } =
    useSelector((state) => state.dashboard);
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "" });
  const [selectedCategory, setSelectedCategory] = useState("Embroidery");

  useEffect(() => {
    dispatch(getProcessAnalyticsAsync({ ...filters, category: selectedCategory }));
  }, [dispatch]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    dispatch(getProcessAnalyticsAsync({ ...filters, category: selectedCategory }));
  };

  const handleReset = () => {
    const resetFilters = { dateFrom: "", dateTo: "" };
    setFilters(resetFilters);
    dispatch(
      getProcessAnalyticsAsync({ ...resetFilters, category: selectedCategory })
    );
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    dispatch(getProcessAnalyticsAsync({ ...filters, category }));
  };

  return (
    <div className="mt-7 mb-0 min-h-[80vh] rounded-lg border border-gray-200 bg-white px-5 py-6 shadow-sm dark:border-gray-600 dark:bg-gray-800 md:mx-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white">
            Process Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            Sent, received, and status overview for each process step.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleChange}
            className="h-10 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 outline-none focus:border-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleChange}
            className="h-10 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 outline-none focus:border-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="flex h-10 items-center gap-2 rounded-md bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={processAnalyticsLoading}
          >
            {processAnalyticsLoading ? <ButtonSpinner /> : <CiSearch className="text-lg" />}
            Search
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex h-10 items-center gap-2 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
            disabled={processAnalyticsLoading}
          >
            <GrPowerReset className="text-base" />
            Reset
          </button>
          <button
            type="button"
            onClick={() =>
              dispatch(
                getProcessAnalyticsAsync({
                  ...filters,
                  category: selectedCategory,
                })
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
            disabled={processAnalyticsLoading}
            title="Refresh"
          >
            <IoRefreshOutline className="text-lg" />
          </button>
        </div>
      </div>

      <div className="mb-6">      
        <div className="tabs_button flex flex-wrap items-center gap-3">
          {processCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryClick(category)}
              className={`border border-gray-500 px-5 py-2 text-sm rounded-md transition ${
                selectedCategory === category
                  ? "dark:bg-white bg-gray-700 dark:text-black text-gray-100"
                  : "text-gray-800 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {processAnalyticsLoading && !analyticsData ? (
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100" />
        </div>
      ) : (
        <div className="grid gap-5">
          {analyticsData?.data ? (
            <ProcessSection
              key={analyticsData.data.label}
              section={analyticsData.data}
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm font-medium text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No analytics data available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProcessAnalytics;
