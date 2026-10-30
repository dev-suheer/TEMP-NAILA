/* eslint-disable react/prop-types */
import PackingSection from "./PackingSection";
import { getRowQuantities } from "../packingUtils";
import ThemedSelect from "../../../../Component/Common/select/ThemedSelect";
import { STITCH_TYPES } from "../../../../Utils/Common";

const defaultPriceFields = [
  { field: "cost_price", label: "Default Cost Price", placeholder: "C.P" },
  { field: "sale_price", label: "Default Sale Price", placeholder: "S.P" },
  { field: "b_pair_sale_price", label: "Default B-Pair Sale Price", placeholder: "B-Pair S.P" },
];

const cellInputClass =
  "w-20 rounded-sm border bg-[#EEEEEE] px-1 py-1 text-gray-900 dark:text-gray-900";
const bPairHeadClass =
  "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200";

const PackingStockSection = ({
  defaultPrices,
  onDefaultPriceChange,
  onDefaultStitchTypeChange,
  sections,
  onRowChange,
}) => {
  
  const rowStitchTypes = new Set(
    sections.flatMap((section) => section.rows.map((item) => item.stitch_type))
  );
  const defaultStitchType =
    rowStitchTypes.size > 1
      ? ""
      : [...rowStitchTypes][0] || STITCH_TYPES.UNSTITCHED;

  return (
    <PackingSection
      step={2}
      title="Stock to add"
    >
      <div className="mb-6 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {defaultPriceFields.map(({ field, label, placeholder }) => (
          <div key={field}>
            <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">
              {label}
            </label>
            <input
              type="number"
              placeholder={placeholder}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              value={defaultPrices[field]}
              onChange={(e) => onDefaultPriceChange(field, e.target.value)}
            />
          </div>
        ))}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">
            Default Type
          </label>
          <ThemedSelect
            value={defaultStitchType}
            onChange={(e) => onDefaultStitchTypeChange(e.target.value)}
          >
            <option value="" disabled>
              Mixed
            </option>
            {Object.values(STITCH_TYPES).map((stitchType) => (
              <option key={stitchType} value={stitchType}>
                {stitchType}
              </option>
            ))}
          </ThemedSelect>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.key} className="mb-6 last:mb-0">
          <h3 className="mb-3 font-semibold text-lg text-gray-800 dark:text-gray-200">
            {section.title}
          </h3>
          <div className="relative overflow-x-auto rounded-md border border-gray-200 dark:border-gray-600">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
              <thead className="text-xs text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                <tr>
                  <th rowSpan={2} className="px-3 py-2 align-bottom">
                    Color
                  </th>
                  <th rowSpan={2} className="px-3 py-2 align-bottom">
                    Type
                  </th>
                  <th rowSpan={2} className="px-3 py-2 align-bottom">
                    Received
                  </th>
                  <th
                    colSpan={3}
                    className="px-3 pt-2 text-center border-l border-gray-200 dark:border-gray-600"
                  >
                    Main Stock
                  </th>
                  <th
                    colSpan={2}
                    className={`px-3 pt-2 text-center border-l border-gray-200 dark:border-gray-600 ${bPairHeadClass}`}
                  >
                    B-Pair
                  </th>
                </tr>
                <tr>
                  <th className="px-3 py-2 border-l border-gray-200 dark:border-gray-600">
                    Qty
                  </th>
                  <th className="px-3 py-2">C.P</th>
                  <th className="px-3 py-2">S.P</th>
                  <th className={`px-3 py-2 border-l border-gray-200 dark:border-gray-600 ${bPairHeadClass}`}>
                    Qty
                  </th>
                  <th className={`px-3 py-2 ${bPairHeadClass}`}>S.P</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((item, index) => {
                  const { received, bPair, validBPair } = getRowQuantities(item);
                  const mainQuantity = received - bPair;
                  return (
                    <tr
                      key={item.id || index}
                      className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                    >
                      <td className="px-3 py-2 font-medium">{item.color}</td>
                      <td className="px-3 py-2">
                        <ThemedSelect
                          className="w-36"
                          value={item.stitch_type}
                          onChange={(e) =>
                            onRowChange(section.key, index, "stitch_type", e.target.value)
                          }
                        >
                          {Object.values(STITCH_TYPES).map((stitchType) => (
                            <option key={stitchType} value={stitchType}>
                              {stitchType}
                            </option>
                          ))}
                        </ThemedSelect>
                      </td>
                      <td className="px-3 py-2">{received}</td>
                      <td className="px-3 py-2 border-l border-gray-200 font-semibold dark:border-gray-700">
                        {validBPair ? mainQuantity : "--"}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          placeholder="C.P"
                          className={`${cellInputClass} border-gray-300`}
                          value={item.cost_price || ""}
                          onChange={(e) =>
                            onRowChange(section.key, index, "cost_price", e.target.value)
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          placeholder="S.P"
                          className={`${cellInputClass} border-gray-300`}
                          value={item.sale_price || ""}
                          onChange={(e) =>
                            onRowChange(section.key, index, "sale_price", e.target.value)
                          }
                        />
                      </td>
                      <td className="px-3 py-2 border-l border-gray-200 dark:border-gray-700">
                        <input
                          type="number"
                          min={0}
                          max={received}
                          placeholder="0"
                          className={`${cellInputClass} ${
                            validBPair ? "border-gray-300" : "border-red-500"
                          }`}
                          value={item.b_pair_quantity}
                          onChange={(e) =>
                            onRowChange(section.key, index, "b_pair_quantity", e.target.value)
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          placeholder="S.P"
                          disabled={bPair === 0}
                          className={`${cellInputClass} border-gray-300 disabled:cursor-not-allowed disabled:opacity-50`}
                          value={item.b_pair_sale_price || ""}
                          onChange={(e) =>
                            onRowChange(section.key, index, "b_pair_sale_price", e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </PackingSection>
  );
};

export default PackingStockSection;
