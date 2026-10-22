/* eslint-disable react/prop-types */
import { STITCH_TYPE_FILTER_OPTIONS } from "../../Utils/Common";

const optionClass = (active) =>
  `whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors md:text-sm ${
    active
      ? "border-gray-700 bg-gray-700 text-gray-100 dark:bg-white dark:text-black"
      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-700"
  }`;

const StockFilters = ({
  categories,
  total = 0,
  category,
  onCategoryChange,
  stitchType,
  onStitchTypeChange,
}) => {
  const categoryOptions = [
    { _id: "", quantity: total },
    ...[...(categories || [])].sort((a, b) => b.quantity - a.quantity),
  ];

  return (
    <div className="my-5 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
      <div className="flex flex-wrap items-center gap-1">
        {categoryOptions.map((item) => (
          <button
            key={item._id || "all"}
            type="button"
            onClick={() => onCategoryChange(item._id)}
            className={optionClass(category === item._id)}
          >
            {item._id || "All"} ({Number(item.quantity || 0).toLocaleString()})
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-gray-200 pt-3 dark:border-gray-700">
       
        {STITCH_TYPE_FILTER_OPTIONS.map((option) => (
          <button
            key={option.value || "all"}
            type="button"
            onClick={() => onStitchTypeChange(option.value)}
            className={optionClass(stitchType === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StockFilters;
