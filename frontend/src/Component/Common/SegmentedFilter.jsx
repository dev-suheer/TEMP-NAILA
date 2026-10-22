/* eslint-disable react/prop-types */
const optionClass = (active) =>
  `px-3 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "bg-[#252525] text-white dark:bg-gray-200 dark:text-gray-900"
      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
  }`;

const SegmentedFilter = ({ label, options, value, onChange }) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="w-16 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {label}
    </span>
    <div className="inline-flex flex-wrap overflow-hidden rounded-md border border-gray-300 dark:border-gray-600">
      {options.map((option) => (
        <button
          key={option.value || "all"}
          type="button"
          onClick={() => onChange(option.value)}
          className={`${optionClass(value === option.value)} border-r border-gray-300 last:border-r-0 dark:border-gray-600`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

export default SegmentedFilter;
