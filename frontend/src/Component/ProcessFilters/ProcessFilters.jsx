import { useEffect, useMemo, useState } from "react";
import { CiSearch } from "react-icons/ci";
import { GrPowerReset } from "react-icons/gr";
import { IoFilter } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getProcessFiltersDataAsync } from "../../features/EmbroiderySlice";
import AppSelect from "../Common/select/AppSelect";
import { buildPaginationQuery, getPageLimit } from "../../Utils/Common";

const initialFilters = {
  Manual_No: "",
  partyName: "",
  project_status: "",
  Design_No: "",
};

const inputClass =
  "h-10 w-[170px] rounded-md border border-gray-300 bg-gray-50 px-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-500 focus:bg-white focus:ring-0 dark:border-gray-500 dark:bg-gray-600 dark:text-white";

const statusOptions = [
  { value: "Completed", label: "Completed" },
  { value: "Pending", label: "Pending" },
];

const getRouteCategory = (pathname) => {
  const routeCategory = pathname.split("/").filter(Boolean).pop();
  return routeCategory === "calendar" ? "calender" : routeCategory;
};

const ProcessFilters = ({ handlers }) => {
  const { liftUpFiltersData } = handlers;
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const limit = getPageLimit(searchParams);
  const { processFiltersData } = useSelector((state) => state.Embroidery);
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState(initialFilters);

  const routeCategory = useMemo(
    () => getRouteCategory(location.pathname),
    [location.pathname],
  );

  const partyNameOptions = useMemo(() => {
    const partyNames = processFiltersData?.partyNames || [];

    return partyNames.map((partyName) => ({
      value: partyName,
      label: partyName,
    }));
  }, [processFiltersData]);

  const designNumberOptions = useMemo(() => {
    const designNumbers = processFiltersData?.designNumbers || [];
    return designNumbers.filter(Boolean).map((designNumber) => ({
      value: designNumber,
      label: designNumber,
    }));
  }, [processFiltersData]);

  useEffect(() => {
    if (routeCategory) {
      dispatch(getProcessFiltersDataAsync(routeCategory));
    }
  }, [dispatch, routeCategory]);

  const handleChangeFilters = (e) => {
    const { name, value } = e.target;
    setFilters((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSelectFilter = (name, selectedOption) => {
    setFilters((prevData) => ({
      ...prevData,
      [name]: selectedOption?.value || "",
    }));
  };

  const getSelectedOption = (options, value) =>
    options.find((option) => option.value === value) || null;

  const handleFiltersSearch = () => {
    liftUpFiltersData(filters);
    navigate(
      `${location.pathname}${buildPaginationQuery(searchParams, { page: 1, limit })}`,
    );
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    liftUpFiltersData(initialFilters);
    navigate(
      `${location.pathname}${buildPaginationQuery(searchParams, { page: 1, limit })}`,
    );
  };

  return (
    <div className="flex min-w-0 items-center justify-end gap-2">
      <div
        className={`overflow-hidden transition-[width,opacity,transform] duration-300 ease-out ${
          isOpen
            ? "w-[900px] translate-x-0 opacity-100"
            : "pointer-events-none w-0 translate-x-3 opacity-0"
        }`}
      >
        <div className="flex w-[900px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm dark:border-gray-600 dark:bg-gray-800">
          <AppSelect
            options={statusOptions}
            placeholder="Status"
            value={getSelectedOption(statusOptions, filters.project_status)}
            onChange={(selectedOption) =>
              handleSelectFilter("project_status", selectedOption)
            }
          />

          <AppSelect
            options={partyNameOptions}
            placeholder="Party Name"
            value={getSelectedOption(partyNameOptions, filters.partyName)}
            onChange={(selectedOption) =>
              handleSelectFilter("partyName", selectedOption)
            }
          />

          <input
            name="Manual_No"
            type="text"
            className={inputClass}
            placeholder="Manual Number"
            value={filters.Manual_No}
            onChange={handleChangeFilters}
          />

          <AppSelect
            options={designNumberOptions}
            placeholder="Design Number"
            value={getSelectedOption(designNumberOptions, filters.Design_No)}
            onChange={(selectedOption) =>
              handleSelectFilter("Design_No", selectedOption)
            }
          />

          <button
            onClick={handleFiltersSearch}
            type="button"
            className="flex h-10 w-[92px] items-center justify-center gap-1.5 rounded-md bg-gray-900 px-2 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-gray-200 dark:text-gray-900"
          >
            <CiSearch size={18} />
            Search
          </button>

          <button
            onClick={handleResetFilters}
            type="button"
            className="flex h-10 w-[84px] items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-gray-50 px-2 text-sm font-medium text-gray-900 transition hover:bg-gray-100 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
          >
            <GrPowerReset size={16} />
            Reset
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
          isOpen
            ? "border-gray-800 bg-gray-800 text-white dark:border-gray-200 dark:bg-gray-200 dark:text-gray-900"
            : "border-gray-300 bg-gray-50 text-gray-900 hover:bg-gray-100 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
        }`}
      >
        <IoFilter size={18} />
        Filters
      </button>
    </div>
  );
};

export default ProcessFilters;
