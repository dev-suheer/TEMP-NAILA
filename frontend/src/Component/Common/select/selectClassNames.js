const CONTROL_VARIANTS = {
  field:
    "min-h-10 w-full rounded-md border border-gray-300 bg-gray-50 text-sm font-medium shadow-none hover:border-gray-300 dark:border-gray-500 dark:bg-gray-600",
  sm: "min-h-9 w-full rounded-md border border-gray-300 bg-white text-sm font-semibold shadow-sm hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800",
  suffix:
    "h-full min-h-10 w-full rounded-r-md border border-gray-300 bg-gray-50 text-sm font-medium shadow-none hover:border-gray-300 dark:border-gray-500 dark:bg-gray-600",
  ghost:
    "min-h-8 w-full rounded-md border-0 bg-transparent text-sm font-medium shadow-none",
  button:
    "min-h-10 w-full cursor-pointer rounded bg-[#252525] text-sm shadow-none dark:bg-gray-200",
};

const TEXT_VARIANTS = {
  button: {
    value: "text-white dark:text-gray-800",
    placeholder: "text-white dark:text-gray-800",
    indicator: "px-2 text-white dark:text-gray-800",
  },
  default: {
    value: "text-gray-900 dark:text-white",
    placeholder: "text-gray-500",
    indicator: "px-2 text-gray-500 hover:text-gray-700 dark:text-gray-300",
  },
};

export const SELECT_MENU_LIST_CLASS = "themed-select-menu-list";

export const getSelectClassNames = (variant = "field") => {
  const text = TEXT_VARIANTS[variant] || TEXT_VARIANTS.default;
  return {
    // SUFFIX FILLS THE ROW SO IT MATCHES THE INPUT NEXT TO IT
    container: () => (variant === "suffix" ? "h-full" : ""),
    control: ({ isDisabled }) =>
      `${CONTROL_VARIANTS[variant] || CONTROL_VARIANTS.field}${
        isDisabled ? " cursor-not-allowed opacity-60" : ""
      }`,
    valueContainer: () => (variant === "button" ? "px-3" : "px-2"),
    placeholder: () => text.placeholder,
    singleValue: () => text.value,
    input: () => `${text.value} custom-reactSelect`,
    indicatorSeparator: () => "hidden",
    dropdownIndicator: () => text.indicator,
    clearIndicator: () => "px-1 text-gray-500 hover:text-gray-700",
    multiValue: () => "my-0.5 mr-1 flex items-center rounded bg-gray-200 text-gray-900",
    multiValueLabel: () => "px-2 py-0.5 text-xs",
    multiValueRemove: () => "rounded-r px-1 hover:bg-gray-300",
    menu: () =>
      "z-50 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700",
    menuList: () => SELECT_MENU_LIST_CLASS,
    noOptionsMessage: () => "px-4 py-2 text-sm text-gray-500",
    option: ({ isFocused, isSelected, isDisabled }) =>
      `px-5 py-2 text-sm ${
        isDisabled
          ? "cursor-not-allowed bg-white text-gray-400 dark:bg-gray-700"
          : isSelected
            ? "cursor-pointer bg-gray-900 text-white"
            : isFocused
              ? "cursor-pointer bg-gray-100 text-gray-900 dark:bg-gray-600 dark:text-white"
              : "cursor-pointer bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
      }`,
  };
};

export const selectStyles = {
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};
