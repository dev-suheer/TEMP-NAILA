const ProcessAvailabilityCard = ({ availability, unit = "" }) => {
  const unitLabel = unit ? ` ${unit}` : "";
  const formatValue = (value) => Number(value || 0).toLocaleString();

  const items = [
    { label: "Received", value: availability?.capacity },
    { label: "Used", value: availability?.allocated, className: "text-red-500" },
    { label: "Available", value: availability?.available, className: "text-[#009C73]" },
  ];

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 dark:border-gray-600 dark:bg-gray-800">
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex ">
            <p className="text-sm font-semibold uppercase leading-none text-gray-500 dark:text-gray-400">
              {item.label}
            </p>
            
            <p className={`text-sm font-semibold leading-none ${item.className || "text-gray-900 dark:text-gray-100"}`}>
               : {formatValue(item.value)}
              {unitLabel}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessAvailabilityCard;
