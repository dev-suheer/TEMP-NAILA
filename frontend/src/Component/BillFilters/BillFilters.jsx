import { CiSearch } from "react-icons/ci";
import { GrPowerReset } from "react-icons/gr";
import AppSelect from "../Common/select/AppSelect";

export const emptyBillFilters = {
  name: "",
  status: "",
  city: "",
  dateFrom: "",
  dateTo: "",
};

const dateInputClass =
  "h-10 rounded-md border border-gray-300 bg-gray-50 pl-12 pr-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-500 focus:bg-white focus:ring-0 dark:border-gray-500 dark:bg-gray-600 dark:text-white";

const getSelectedOption = (options, value) =>
  options.find((option) => option.value === value) || null;

const BillFilters = ({
  filters,
  nameOptions = [],
  branchOptions = [],
  categoryOptions = [],
  statusOptions = [],
  cityOptions = [],
  selectedBranch = "",
  selectedCategory = "",
  showBranchFilter = false,
  showCategoryFilter = false,
  showStatusFilter = false,
  showCityFilter = false,
  showDateFilters = true,
  namePlaceholder = "Party Name",
  cityPlaceholder = "City",
  onChange,
  onBranchChange,
  onCategoryChange,
  onSearch,
  onReset,
}) => {
  const handleDateChange = (event) => {
    const { name, value } = event.target;
    onChange({
      ...filters,
      [name]: value,
    });
  };

  const handleNameChange = (selectedOption) => {
    onChange({
      ...filters,
      name: selectedOption?.value || "",
    });
  };

  const handleCityChange = (selectedOption) => {
    onChange({
      ...filters,
      city: selectedOption?.value || "",
    });
  };

  const handleStatusChange = (selectedOption) => {
    onChange({
      ...filters,
      status: selectedOption?.value || "",
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-600 dark:bg-gray-800">
      {showBranchFilter && (
        <AppSelect
          className="w-[180px]"
          options={branchOptions}
          placeholder="Branch"
          value={getSelectedOption(branchOptions, selectedBranch)}
          onChange={(selectedOption) =>
            onBranchChange(selectedOption?.value || "")
          }
        />
      )}

      {showCategoryFilter && (
        <AppSelect
          className="w-[170px]"
          options={categoryOptions}
          placeholder="Category"
          value={getSelectedOption(categoryOptions, selectedCategory)}
          onChange={(selectedOption) =>
            onCategoryChange(selectedOption?.value || "")
          }
        />
      )}

      <AppSelect
        className="w-[210px]"
        options={nameOptions}
        placeholder={namePlaceholder}
        value={getSelectedOption(nameOptions, filters.name)}
        onChange={handleNameChange}
      />

      {showCityFilter && (
        <AppSelect
          className="w-[160px]"
          options={cityOptions}
          placeholder={cityPlaceholder}
          value={getSelectedOption(cityOptions, filters.city)}
          onChange={handleCityChange}
        />
      )}

      {showStatusFilter && (
        <AppSelect
          className="w-[160px]"
          options={statusOptions}
          placeholder="Status"
          value={getSelectedOption(statusOptions, filters.status)}
          onChange={handleStatusChange}
        />
      )}

      {showDateFilters && (
        <>
          <div className="relative">
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 dark:text-gray-300">
              From
            </span>
            <input
              type="date"
              name="dateFrom"
              className={dateInputClass}
              value={filters.dateFrom}
              onChange={handleDateChange}
            />
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 dark:text-gray-300">
              To
            </span>
            <input
              type="date"
              name="dateTo"
              className={dateInputClass}
              value={filters.dateTo}
              onChange={handleDateChange}
            />
          </div>
        </>
      )}

      <button
        type="button"
        onClick={onSearch}
        className="flex h-10 items-center justify-center gap-1.5 rounded-md bg-gray-900 px-3 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-gray-200 dark:text-gray-900"
      >
        <CiSearch size={18} />
        Search
      </button>

      <button
        type="button"
        onClick={onReset}
        className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-gray-50 px-3 text-sm font-medium text-gray-900 transition hover:bg-gray-100 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
      >
        <GrPowerReset size={16} />
        Reset
      </button>
    </div>
  );
};

export default BillFilters;
