import { MdOutlineDelete, MdOutlineEdit } from "react-icons/md";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";


const ICONS = {
    delete: {
        value:MdOutlineDelete,
        color:"text-red-500"
    },
    tick:{
        value:FaCheckCircle,
        color:"text-green-500"
    },
    cross: {
        value:FaTimesCircle,
        color:"text-red-500"
    },
    edit: {
      value:MdOutlineEdit,
      color:"text-black"
    }
};

const Icon = ({ name, size = 20, className = "", onClick }) => {
  const item = ICONS[name];
  if (!item) {
    return null;
  }

  const { value: IconComponent, color } = item;
  return <IconComponent  size={size} className={`${color} ${className}`} onClick={onClick} />;
};

export default Icon;
