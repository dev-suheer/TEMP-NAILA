/* eslint-disable react/prop-types */
import { getRoundLabel } from "../packingUtils";
import PackingRoundList from "./PackingRoundList";

const headClass = "px-3 py-2 whitespace-nowrap";
const cellClass = "px-3 py-2 whitespace-nowrap";

//A WHOLE ORDER'S PACKING (progress FROM THE SERVER): WHAT EACH STEP RECEIVED, PACKED AND HAS LEFT, AND EVERY ROUND
const OrderPackingProgressContent = ({ progress }) => {
  const { steps = [], packings = [] } = progress;
  //EACH STEP'S ROUNDS TOGETHER, IN THE STEP TABLE'S ORDER, SO ITS ROUND NUMBERS READ 1, 2, 3
  const roundsByStep = steps
    .map((step) => ({
      step,
      rounds: packings
        .filter(
          (packing) => packing.source_step === step.step && String(packing.source_id) === step.id
        )
        .sort((a, b) => a.round_no - b.round_no),
    }))
    .filter(({ rounds }) => rounds.length > 0);

  return (
    <div className="space-y-4 text-sm text-gray-800 dark:text-gray-200">
      {steps.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-600">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <tr>
                <th className={headClass}>Step</th>
                <th className={headClass}>Received</th>
                <th className={headClass}>Packed</th>
                <th className={headClass}>Left</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step) => (
                <tr key={step.id} className="border-t border-gray-200 dark:border-gray-600">
                  <td className={`${cellClass} font-medium`}>
                    {step.step}
                    <span className="font-normal text-gray-500 dark:text-gray-400">
                      {" · "}
                      {step.partyName}
                    </span>
                  </td>
                  <td className={cellClass}>{step.received}</td>
                  <td className={cellClass}>{step.packed || "–"}</td>
                  {/* A STEP STILL BEING WORKED ON HAS NOTHING LEFT YET, ITS SUITS ARE IN PROCESS */}
                  {step.project_status !== "Completed" ? (
                    <td className={`${cellClass} text-gray-500 dark:text-gray-400`}>In process</td>
                  ) : (
                    <td
                      className={`${cellClass} ${
                        step.available > 0 ? "font-semibold text-amber-600 dark:text-amber-400" : ""
                      }`}
                    >
                      {step.available}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {roundsByStep.length > 0 ? (
        roundsByStep.map(({ step, rounds }) => (
          <div key={step.id}>
            <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              {step.step}
              <span className="font-normal text-gray-500 dark:text-gray-400">
                {" · "}
                {step.partyName}
              </span>
            </h4>
            <PackingRoundList packings={rounds} getLabel={getRoundLabel} />
          </div>
        ))
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No packing rounds yet.</p>
      )}
    </div>
  );
};

export default OrderPackingProgressContent;
