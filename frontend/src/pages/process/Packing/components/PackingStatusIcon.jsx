/* eslint-disable react/prop-types */
import { useState } from "react";
import { createPortal } from "react-dom";
import { LuPackage, LuPackageCheck, LuPackageOpen } from "react-icons/lu";
import PackingProgressModal from "./PackingProgressModal";
import {
  getOrderPackingIcon,
  getPackingModalTitle,
  getStepPackingIcon,
  getStitchingPackingIcon,
} from "../packingUtils";

//SHAPE AND COLOUR BOTH CHANGE, SO THE STATE IS CLEAR WITHOUT RELYING ON COLOUR ALONE
const tones = {
  packed: { Icon: LuPackageCheck, className: "text-green-600 dark:text-green-400" },
  partial: { Icon: LuPackageOpen, className: "text-amber-500 dark:text-amber-400" },
  info: { Icon: LuPackage, className: "text-blue-600 dark:text-blue-300" },
};

//THE PACKING ICON OF A LIST ROW OR DETAIL PAGE. icon IS { tone, clickable } FROM packingUtils (null = NO ICON)
//A CLICKABLE ICON OPENS THE PACKING MODAL FOR source: { step, id } OR orderId
const PackingStatusIcon = ({ icon, modalTitle, source, orderId }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!icon) return null;
  const { Icon, className } = tones[icon.tone];

  if (!icon.clickable) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center p-0.5 ${className}`}>
        <Icon size={20} />
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Packing details"
        className={`inline-flex shrink-0 items-center justify-center rounded p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}
      >
        <Icon size={20} />
      </button>
      {/* RENDERED INTO body, SO IT DOES NOT TAKE THE STYLES OF THE TABLE CELL IT OPENS FROM (E.G. NO TEXT WRAPPING) */}
      {isOpen &&
        createPortal(
          <PackingProgressModal
            title={modalTitle}
            source={source}
            orderId={orderId}
            onClose={() => setIsOpen(false)}
          />,
          document.body
        )}
    </>
  );
};

//THE SAME ICON FOR EACH KIND OF RECORD, SO A LIST ROW AND ITS DETAIL PAGE SHOW AND OPEN EXACTLY THE SAME THING
export const StitchingPackingIcon = ({ stitching }) => (
  <PackingStatusIcon
    icon={getStitchingPackingIcon(stitching)}
    modalTitle={getPackingModalTitle("Stitching", stitching)}
    source={{ step: "Stitching", id: stitching?.id }}
  />
);

//step: "Cutting" OR "Stone"
export const StepPackingIcon = ({ step, record }) => (
  <PackingStatusIcon
    icon={getStepPackingIcon(record)}
    modalTitle={getPackingModalTitle(step, record)}
    source={{ step, id: record?.id }}
  />
);

export const OrderPackingIcon = ({ order }) => (
  <PackingStatusIcon
    icon={getOrderPackingIcon(order)}
    modalTitle={getPackingModalTitle("Order", order)}
    orderId={order?.id}
  />
);

export default PackingStatusIcon;
