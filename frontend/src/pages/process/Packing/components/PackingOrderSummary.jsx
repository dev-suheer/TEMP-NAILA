/* eslint-disable react/prop-types */
import { FaEye } from "react-icons/fa";
import PackingSection from "./PackingSection";

const SummaryField = ({ label, children }) => (
  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-600 dark:bg-gray-700">
    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
      {label}
    </dt>
    <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
      {children}
    </dd>
  </div>
);

const PackingOrderSummary = ({
  serialNo,
  manualNo,
  designNo,
  additionalCost,
  picturesOrder,
  onViewPictures,
  useBags,
  onUseBagsChange,
}) => {
  return (
    <PackingSection step={1} title="Order">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <SummaryField label="Serial No">{serialNo ?? "--"}</SummaryField>
        <SummaryField label="Manual No">{manualNo ?? "--"}</SummaryField>
        <SummaryField label="Design No">{designNo ?? "--"}</SummaryField>
        <SummaryField label="Additional Cost">{additionalCost ?? "--"}</SummaryField>
        <SummaryField label="Pictures Order">
          {picturesOrder ? (
            <button
              type="button"
              onClick={onViewPictures}
              className="inline-flex items-center gap-1.5 text-gray-900 hover:underline dark:text-white"
            >
              <FaEye size={16} />
              View
            </button>
          ) : (
            <span className="text-red-500">No Order</span>
          )}
        </SummaryField>
        <SummaryField label="Use Bags">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              id="useBags"
              checked={useBags}
              className="w-5 h-5 text-gray-700 bg-gray-200 border-gray-300 rounded focus:ring-0 cursor-pointer"
              onChange={onUseBagsChange}
            />
            <span>{useBags ? "Yes" : "No"}</span>
          </label>
        </SummaryField>
      </dl>
    </PackingSection>
  );
};

export default PackingOrderSummary;
