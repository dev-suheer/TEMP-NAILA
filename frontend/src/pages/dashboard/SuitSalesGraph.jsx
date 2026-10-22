import { useState } from "react";
import { CiSearch } from "react-icons/ci";
import { GrPowerReset } from "react-icons/gr";
import { Bar } from "react-chartjs-2";
import { useDispatch, useSelector } from "react-redux";
import { getSuitSalesHistoryAsync } from "../../features/DashboardSlice";
import toast from "react-hot-toast";
import ThemedSelect from "../../Component/Common/select/ThemedSelect";

const SuitSalesGraph = () => {
  const dispatch = useDispatch();
  const currentYear = new Date().getFullYear();
  const { SuitsSalesData: data } = useSelector((state) => state.dashboard);

  const [saleFilters, setSaleFilters] = useState({
    date: "",
    month: "",
    year: "",
  });

  const barChartDataForSuitSales = {
    labels: [],
    datasets: [
      {
        label: "Suit Sales",
        data: [],
        backgroundColor: "#CCCCCC",
        borderColor: "#434343",
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  data.forEach((item) => {
    barChartDataForSuitSales.labels.push(
      `${item.category} ${item.color} ${item.d_no}`
    );
    barChartDataForSuitSales.datasets[0].data.push(item.totalSale);
  });

  const handleChangeFilters = (e) => {
    const { name, value } = e.target;
    setSaleFilters((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const getYears = () => {
    let years = [];
    let startyear = 2024;
    for (let i = startyear; i <= currentYear; i++) {
      years.push(i);
    }
    return years;
  };

  const years = getYears();

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const handleResetFilters = () => {
    setSaleFilters({
      date: "",
      month: "",
      year: "",
    });
  };

  const handleFiltersSearch = () => {
    if (
      saleFilters.date === "" &&
      saleFilters.year === "" &&
      saleFilters.month !== ""
    ) {
      toast.error("PLease select valid filters");
      return;
    }
    let date = "";
    if (saleFilters.year === "" && saleFilters.month === "") {
      date = saleFilters.date;
    } else if (saleFilters.date === "" && saleFilters.month === "") {
      date = saleFilters.year;
    } else {
      date = `${saleFilters.year}-${saleFilters.month}`;
    }
    const filters = {
      date: date,
    };
    dispatch(getSuitSalesHistoryAsync(filters));
  };

  const hasChartData = data && data.length > 0;

  return (
    <>
      {/* BAR CHARTS */}
      <div className="h-[22rem] col-span-3 rounded-lg text-gray-900 dark:text-gray-100 border border-gray-400 dark:border-gray-700 w-full p-4 overflow-x-auto">
        <div
          style={{
            minWidth: `${barChartDataForSuitSales.labels.length * 60}px`,
            height: "100%",
          }}
        >
          {hasChartData ? (
            <Bar
              data={barChartDataForSuitSales}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { mode: "index", intersect: false },
                },
                scales: {
                  x: {
                    ticks: {
                      autoSkip: false,
                      maxRotation: 45,
                      minRotation: 45,
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-300 text-lg">
              No data available for the selected filters.
            </div>
          )}
        </div>
      </div>
      {/* FILTERS */}
      <div className="col-span-1 h-[22rem] rounded-lg text-gray-900 dark:text-gray-100 border border-gray-400 dark:border-gray-700 w-full p-4">
        <div className="flex items-center gap-3 justify-center flex-col">
          {/* DATE */}
          <input
            type="date"
            name="date"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
            value={saleFilters.date}
            onChange={handleChangeFilters}
            disabled={saleFilters.month !== "" || saleFilters.year !== ""}
          />

          {/* YEAR FILTER */}
          <ThemedSelect className="w-full"
            name="year"
            value={saleFilters.year}
            onChange={handleChangeFilters}
            disabled={saleFilters.date !== ""}
          >
            <option value="" disabled>
              Select Year
            </option>
            {years?.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </ThemedSelect>

          {/* MONTH FILTER */}
          <ThemedSelect className="w-full"
            name="month"
            value={saleFilters.month}
            onChange={handleChangeFilters}
            disabled={saleFilters.date !== ""}
          >
            <option value="" disabled>
              Select Month
            </option>
            {months.map((item) => (
              <option value={item.value} key={item.value}>
                {item.label}
              </option>
            ))}
          </ThemedSelect>

          <div className="flex items-center gap-4 ">
            {/* SEARCH BUTTON */}
            <button
              onClick={handleFiltersSearch}
              type="button"
              className="flex items-center gap-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
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
      </div>
    </>
  );
};

export default SuitSalesGraph;
