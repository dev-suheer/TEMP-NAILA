import { CiSearch } from "react-icons/ci";
import { GrPowerReset } from "react-icons/gr";

export const emptyAccountFilters = {
  dateFrom: "",
  dateTo: "",
};

const dateInputClass =
  "h-10 rounded-md border border-gray-300 bg-gray-50 pl-12 pr-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-500 focus:bg-white focus:ring-0 dark:border-gray-500 dark:bg-gray-600 dark:text-white";

const AccountFilters = ({ filters, onChange, onSearch, onReset }) => {
  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange({
      ...filters,
      [name]: value,
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-600 dark:bg-gray-800">
      <div className="relative">
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 dark:text-gray-300">
          From
        </span>
        <input
          type="date"
          name="dateFrom"
          className={dateInputClass}
          value={filters.dateFrom}
          onChange={handleChange}
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
          onChange={handleChange}
        />
      </div>

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

export const FilteredAccountTotals = ({
  show,
  debit = 0,
  credit = 0,
  count = 0,
}) => {
  if (!show) return null;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
          Filtered
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-300">
          {count} transaction{count === 1 ? "" : "s"}
        </p>
      </div>
      <div className="h-8 w-px bg-gray-200 dark:bg-gray-600" />
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-300">Debit</p>
        <p className="font-semibold text-red-500">{debit}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-300">Credit</p>
        <p className="font-semibold text-green-600">{credit}</p>
      </div>
    </div>
  );
};

export default AccountFilters;
