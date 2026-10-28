/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import { getPackingSourceLabel, getPackingSourcePath } from "../packingUtils";

//E.G. "Stitching · Ali · #2", LINKING TO THAT STITCHING
const PackingSourceLink = ({ packing }) => {
  const path = getPackingSourcePath(packing);
  const label = getPackingSourceLabel(packing);
  return path ? (
    <Link to={path} className="hover:underline">
      {label}
    </Link>
  ) : (
    label
  );
};

export default PackingSourceLink;
