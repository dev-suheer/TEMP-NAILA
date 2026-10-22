/* eslint-disable react/prop-types */
import { useState } from "react";
import { useDispatch } from "react-redux";
import { searchMainSuitsForAllocationAsync } from "../../../../features/InStockSlice";
import AppSelect from "../../../../Component/Common/select/AppSelect";
import Chip from "../../../../Component/Common/Chip";
import ButtonSpinner from "../../../../Component/Common/button/ButtonSpinner";

const inputClass =
  "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white";

const describeSuit = (suit) =>
  `D# ${suit.d_no} · ${suit.category} · ${suit.color} · ${suit.stitch_type}`;

const MainTargetPicker = ({ stitchType, onSelect, onCancel }) => {
  const dispatch = useDispatch();
  const [designNo, setDesignNo] = useState("");
  const [suits, setSuits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!designNo) return;
    setLoading(true);
    dispatch(searchMainSuitsForAllocationAsync(designNo)).then((res) => {
      setLoading(false);
      setSearched(true);
      setSuits(res.payload || []);
    });
  };

  const options = suits
    .filter((suit) => suit.stitch_type === stitchType)
    .map((suit) => ({
      value: suit._id,
      label: `${describeSuit(suit)} (${suit.quantity} in stock)`,
      suit,
    }));

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-gray-50 p-3 dark:bg-gray-800">
      <input
        type="number"
        placeholder="Design No"
        className={`${inputClass} !w-32`}
        value={designNo}
        onChange={(e) => setDesignNo(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
          }
        }}
      />
      <button
        type="button"
        onClick={handleSearch}
        disabled={!designNo || loading}
        className="inline-flex items-center justify-center gap-2 rounded bg-gray-600 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && <ButtonSpinner />}
        Search
      </button>
      {searched &&
        (options.length > 0 ? (
          <AppSelect
            className="w-72"
            options={options}
            placeholder="Choose main stock item"
            onChange={(option) => option && onSelect(option.suit)}
          />
        ) : (
          <span className="text-xs text-gray-500 dark:text-gray-300">
            No {stitchType} main stock found for this design
          </span>
        ))}
      <button
        type="button"
        onClick={onCancel}
        className="ml-auto text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
      >
        Cancel
      </button>
    </div>
  );
};

const getItemState = (item, state) => {
  const quantity = Number(item.quantity);
  const bPairQuantity =
    state.b_pair_quantity === "" ? 0 : Number(state.b_pair_quantity);
  const validBPair =
    Number.isInteger(bPairQuantity) && bPairQuantity >= 0 && bPairQuantity <= quantity;
  const mainQuantity = validBPair ? quantity - bPairQuantity : 0;
  const invalid =
    !validBPair || (bPairQuantity > 0 && !(Number(state.b_pair_sale_price) > 0));
  return { quantity, bPairQuantity: validBPair ? bPairQuantity : 0, mainQuantity, validBPair, invalid };
};

const ReturnApprovalModal = ({ transfer, branchName, onClose, onConfirm, loading }) => {
  const items = (transfer.bundles || []).flat();
  const [allocations, setAllocations] = useState(() =>
    Object.fromEntries(
      items.map((item) => [
        item.id,
        { b_pair_quantity: "", b_pair_sale_price: "", target: null, picking: false },
      ])
    )
  );

  const updateAllocation = (itemId, values) => {
    setAllocations((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...values },
    }));
  };

  const itemStates = items.map((item) => ({
    item,
    allocation: allocations[item.id],
    ...getItemState(item, allocations[item.id]),
  }));
  const totals = itemStates.reduce(
    (acc, state) => ({
      returned: acc.returned + state.quantity,
      main: acc.main + state.mainQuantity,
      bPair: acc.bPair + state.bPairQuantity,
    }),
    { returned: 0, main: 0, bPair: 0 }
  );
  const isInvalid = itemStates.some((state) => state.invalid);

  const handleConfirm = () => {
    onConfirm(
      itemStates.map(({ item, allocation, mainQuantity, bPairQuantity }) => ({
        item_id: item.id,
        main_quantity: mainQuantity,
        main_Item_Id: allocation.target?._id || item.Item_Id,
        b_pair_quantity: bPairQuantity,
        b_pair_sale_price: bPairQuantity > 0 ? Number(allocation.b_pair_sale_price) : 0,
      }))
    );
  };

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50 px-2 py-4"
    >
      <div className="relative flex max-h-[92vh] w-[95%] max-w-4xl flex-col overflow-hidden rounded-md bg-white shadow dark:bg-gray-700">
        {/* ------------- HEADER ------------- */}
        <div className="flex items-start justify-between gap-4 border-b p-5 dark:border-gray-600">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Receive Returned Stock
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              {branchName ? `${branchName} · ` : ""}Decide how much goes to main
              stock (same or another item) and how much to B-Pair
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
            type="button"
          >
            <svg
              aria-hidden="true"
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 14 14"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        {/* ------------- ITEMS ------------- */}
        <div className="scrollable-content flex-1 space-y-3 overflow-y-auto p-5">
          {itemStates.map(({ item, allocation, quantity, mainQuantity, validBPair, bPairQuantity }) => (
            <div
              key={item.id}
              className="rounded-md border border-gray-200 p-4 dark:border-gray-600"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {describeSuit(item)}
                </p>
                <Chip>Returned {quantity}</Chip>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    To B-Pair
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={quantity}
                    placeholder="0"
                    className={`${inputClass} ${validBPair ? "" : "!border-red-500"}`}
                    value={allocation.b_pair_quantity}
                    onChange={(e) =>
                      updateAllocation(item.id, { b_pair_quantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    B-Pair Sale Price
                  </label>
                  <input
                    type="number"
                    placeholder="S.P"
                    disabled={bPairQuantity === 0}
                    className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
                    value={allocation.b_pair_sale_price}
                    onChange={(e) =>
                      updateAllocation(item.id, { b_pair_sale_price: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    To Main Stock
                  </label>
                  <p className="rounded-md border border-dashed border-gray-300 p-2 text-sm font-semibold text-gray-900 dark:border-gray-500 dark:text-white">
                    {validBPair ? mainQuantity : "--"}
                  </p>
                </div>
              </div>

              {mainQuantity > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-medium">Add main stock to:</span>
                  {allocation.target ? (
                    <Chip variant="primary">{describeSuit(allocation.target)}</Chip>
                  ) : (
                    <Chip variant="success">Same item</Chip>
                  )}
                  {!allocation.picking && (
                    <button
                      type="button"
                      onClick={() => updateAllocation(item.id, { picking: true })}
                      className="text-xs font-semibold text-gray-700 hover:underline dark:text-gray-300"
                    >
                      Change
                    </button>
                  )}
                  {allocation.target && (
                    <button
                      type="button"
                      onClick={() =>
                        updateAllocation(item.id, { target: null, picking: false })
                      }
                      className="text-xs font-semibold text-gray-500 hover:underline dark:text-gray-300"
                    >
                      Use same item
                    </button>
                  )}
                </div>
              )}

              {mainQuantity > 0 && allocation.picking && (
                <MainTargetPicker
                  stitchType={item.stitch_type}
                  onSelect={(suit) =>
                    updateAllocation(item.id, {
                      target: suit._id === item.Item_Id ? null : suit,
                      picking: false,
                    })
                  }
                  onCancel={() => updateAllocation(item.id, { picking: false })}
                />
              )}
            </div>
          ))}
        </div>

        {/* ------------- FOOTER ------------- */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 dark:border-gray-600">
          <p className="text-sm text-gray-700 dark:text-gray-200">
            Returned <strong>{totals.returned}</strong> · Main{" "}
            <strong>{totals.main}</strong> · B-Pair <strong>{totals.bPair}</strong>
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isInvalid || loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm rounded bg-[#252525] text-white disabled:cursor-not-allowed disabled:bg-gray-400 dark:bg-gray-200 dark:text-gray-800"
            >
              {loading && <ButtonSpinner />}
              Approve & Receive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnApprovalModal;
