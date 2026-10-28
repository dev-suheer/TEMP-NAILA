/* eslint-disable react/prop-types */
import { toColorKey } from "../../../../Utils/Common";
import { SummaryField } from "./PackingOrderSummary";
import PackingRoundList from "./PackingRoundList";

const headClass = "px-3 py-2 whitespace-nowrap";
const cellClass = "px-3 py-2 whitespace-nowrap";

const packedInRound = (packing, color) =>
  packing.rows
    .filter((row) => toColorKey(row.color) === toColorKey(color))
    .reduce((total, row) => total + (Number(row.received) || 0), 0);

//ONE STEP'S PACKING (availability FROM THE SERVER): RECEIVED / PACKED / LEFT, PER COLOR PER ROUND, AND ITS ROUNDS
const PackingProgressContent = ({ availability }) => {
  const { capacity, available, byColor = [], byStep = {}, packings = [] } = availability;
  //CUTTING AND STONE CAN ALSO SEND SUITS ON TO THE NEXT STEP
  const sentOn = Object.entries(byStep)
    .filter(([step]) => step !== "Packing")
    .reduce((total, [, quantity]) => total + quantity, 0);
  //PER COLOR WHEN THE COLORS ADD UP TO THE RECEIVED QUANTITY, OTHERWISE ONE TOTAL ROW
  const colorRows = byColor.length
    ? byColor.map((item) => ({
        label: item.color,
        left: item.available,
        rounds: packings.map((packing) => packedInRound(packing, item.color)),
      }))
    : [
        {
          label: "All colors",
          left: available,
          rounds: packings.map((packing) => packing.total_received),
        },
      ];

  return (
    <div className="space-y-4 text-sm text-gray-800 dark:text-gray-200">
      <dl className={`grid gap-3 ${sentOn > 0 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
        <SummaryField label="Received">{capacity}</SummaryField>
        {sentOn > 0 && <SummaryField label="Sent on">{sentOn}</SummaryField>}
        <SummaryField label="Packed">{byStep.Packing || 0}</SummaryField>
        <SummaryField label="Left">{available}</SummaryField>
      </dl>

      {packings.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No packing rounds yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-600">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                <tr>
                  <th className={headClass}>Color</th>
                  {packings.map((packing) => (
                    <th key={packing.id} className={headClass}>
                      #{packing.round_no}
                    </th>
                  ))}
                  <th className={headClass}>Left</th>
                </tr>
              </thead>
              <tbody>
                {colorRows.map((row) => (
                  <tr key={row.label} className="border-t border-gray-200 dark:border-gray-600">
                    <td className={`${cellClass} font-medium`}>{row.label}</td>
                    {row.rounds.map((quantity, index) => (
                      <td key={packings[index].id} className={cellClass}>
                        {quantity || "–"}
                      </td>
                    ))}
                    <td className={`${cellClass} font-semibold`}>{row.left}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PackingRoundList packings={packings} getLabel={(packing) => `#${packing.round_no}`} />
        </>
      )}
    </div>
  );
};

export default PackingProgressContent;
