/* eslint-disable react/prop-types */

import { getStatusVariant } from "../../Utils/Common";
import Chip from "./Chip";

const StatusChip = ({ status, fallback = "No Status", className = "" }) => {
  const label = status || fallback;

  if (!label) return null;

  return (
    <Chip variant={getStatusVariant(status)} className={className}>
      {label}
    </Chip>
  );
};

export default StatusChip;
