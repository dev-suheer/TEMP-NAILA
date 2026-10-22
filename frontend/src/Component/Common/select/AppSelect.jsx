import Select from "react-select";
import { getSelectClassNames, selectStyles } from "./selectClassNames";

const selectClassNames = getSelectClassNames("field");

const AppSelect = ({ className = "w-[170px]", ...props }) => {
  return (
    <div className={className}>
      <Select
        unstyled
        classNames={selectClassNames}
        styles={selectStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        {...props}
      />
    </div>
  );
};

export default AppSelect;
