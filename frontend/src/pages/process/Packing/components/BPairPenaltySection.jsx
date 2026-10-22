/* eslint-disable react/prop-types */
import Chip from "../../../../Component/Common/Chip";
import Loading from "../../../../Component/Loader/Loading";
import { formatAmount } from "../../../../Utils/Common";
import PackingSection from "./PackingSection";
import { getPartyKey } from "../packingUtils";

const withUnit = (value, unit) => `${value}${unit ? ` ${unit}` : ""}`;

const penaltyInputClass =
  "w-24 rounded-sm border border-gray-300 bg-[#EEEEEE] px-1 py-1 text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-900";

const BPairPenaltySection = ({
  loading,
  totalBPairQuantity,
  status,
  penaltyValues,
  onPenaltyChange,
}) => {
  const { rows, assignedQuantity } = status;
  const remaining = totalBPairQuantity - assignedQuantity;

  const aside = (
    <div className="flex flex-wrap items-center gap-2">
      <Chip variant={remaining === 0 ? "success" : "danger"}>
        Assigned {assignedQuantity} / {totalBPairQuantity}
      </Chip>
    </div>
  );

  return (
    <PackingSection
      step={3}
      title="B-Pair penalties"
      aside={aside}
    >
      {loading ? (
        <div className="flex justify-center py-6">
          <Loading />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          No process parties found for this order
        </p>
      ) : (
        <>
          <div className="relative overflow-x-auto rounded-md border border-gray-200 dark:border-gray-600">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
              <thead className="text-xs text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-3 py-2">Party</th>
                  <th className="px-3 py-2">Sent</th>
                  <th className="px-3 py-2">Received</th>
                  <th className="px-3 py-2">Rate</th>
                  <th className="px-3 py-2">Bill</th>
                  <th className="px-3 py-2 border-l border-gray-200 dark:border-gray-600">
                    B-Pair Qty
                  </th>
                  <th className="px-3 py-2">Penalty</th>
                  <th className="px-3 py-2">Additional Cost</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const { party, quantity, penalty_amount, total_penalty } = row;
                  const key = getPartyKey(party);
                  const values = penaltyValues[key] || {};
                  return (
                    <tr
                      key={key}
                      className={`border-t border-gray-200 dark:border-gray-700 ${
                        party.bill_generated
                          ? "bg-white dark:bg-gray-800"
                          : "bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-500"
                      }`}
                    >
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {party.partyName}
                          </span>
                          <Chip className="w-fit">{party.process_step}</Chip>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{withUnit(party.sent, party.unit)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{withUnit(party.received, party.unit)}</td>
                      <td className="px-3 py-2">{party.rate}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {party.bill_generated ? (
                          formatAmount(party.bill_amount)
                        ) : (
                          <span className="text-red-500">Not generated</span>
                        )}
                      </td>
                      <td className="px-3 py-2 border-l border-gray-200 dark:border-gray-700">
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          aria-label={`B-Pair quantity for ${party.partyName}`}
                          title={party.bill_generated ? "" : "Generate the bill first"}
                          disabled={!party.bill_generated}
                          className={`${penaltyInputClass} ${
                            row.invalidQuantity ? "border-red-500" : ""
                          }`}
                          value={values.quantity ?? ""}
                          onChange={(e) => onPenaltyChange(key, "quantity", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {quantity > 0
                          ? `${quantity} × ${party.rate} = ${formatAmount(penalty_amount)}`
                          : "--"}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          aria-label={`Additional cost for ${party.partyName}`}
                          disabled={quantity === 0}
                          className={`${penaltyInputClass} ${
                            row.invalidAdditional ? "border-red-500" : ""
                          }`}
                          value={values.additional_cost ?? ""}
                          onChange={(e) =>
                            onPenaltyChange(key, "additional_cost", e.target.value)
                          }
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-semibold text-gray-900 dark:text-white">
                        {quantity > 0 ? formatAmount(total_penalty) : "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
        </>
      )}
    </PackingSection>
  );
};

export default BPairPenaltySection;
