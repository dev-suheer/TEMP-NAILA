/* eslint-disable react/prop-types */
import { Children, Fragment, isValidElement, useState } from "react";
import Select from "react-select";
import {
  getSelectClassNames,
  SELECT_MENU_LIST_CLASS,
  selectStyles,
} from "./selectClassNames";

const getOptionText = (children) =>
  Children.toArray(children)
    .filter((child) => typeof child === "string" || typeof child === "number")
    .join("")
    .trim();

//READS <option> CHILDREN THE SAME WAY A NATIVE <select> DOES
const collectOptions = (children, list = []) => {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Fragment) {
      collectOptions(child.props.children, list);
      return;
    }
    if (child.type !== "option") return;
    const { value, disabled, hidden, selected, children: label } = child.props;
    const text = getOptionText(label);
    list.push({
      value: value === undefined || value === null ? text : String(value),
      label: text,
      isDisabled: !!disabled,
      hidden: !!hidden,
      selected: !!selected,
    });
  });
  return list;
};

//CLOSE THE FIXED MENU WHEN THE PAGE OR A MODAL SCROLLS, NOT WHEN THE MENU ITSELF SCROLLS
const closeMenuOnScroll = (event) =>
  !(
    event.target instanceof Element &&
    event.target.closest(`.${SELECT_MENU_LIST_CLASS}`)
  );

//DROP-IN REPLACEMENT FOR NATIVE <select> WITH THE APP THEME
const ThemedSelect = (props) => {
  const {
    name,
    id,
    value,
    defaultValue,
    onChange,
    required,
    disabled,
    variant = "field",
    className = "w-full",
    children,
  } = props;
  const isControlled = Object.prototype.hasOwnProperty.call(props, "value");

  const allOptions = collectOptions(children);
  const placeholderOption = allOptions.find(
    (option) => option.value === "" && (option.isDisabled || option.hidden)
  );
  const options = allOptions.filter(
    (option) => option !== placeholderOption && !option.hidden
  );

  const [internalValue, setInternalValue] = useState(() => {
    if (defaultValue !== undefined && defaultValue !== null) {
      return String(defaultValue);
    }
    const preselected = allOptions.find((option) => option.selected);
    if (preselected) return preselected.hidden ? null : preselected.value;
    return null;
  });

  const currentValue = isControlled
    ? value === undefined || value === null
      ? null
      : String(value)
    : internalValue;

  let selectedOption =
    currentValue === null
      ? null
      : options.find((option) => option.value === currentValue) || null;
  //WITHOUT A PLACEHOLDER A NATIVE SELECT SHOWS ITS FIRST ENABLED OPTION
  if (!selectedOption && !placeholderOption) {
    selectedOption = options.find((option) => !option.isDisabled) || null;
  }

  const handleChange = (option) => {
    const nextValue = option ? option.value : "";
    if (nextValue === (selectedOption?.value ?? "")) return;
    if (!isControlled) setInternalValue(nextValue === "" ? null : nextValue);

    let targetValue = nextValue;
    const target = { name, id };
    Object.defineProperty(target, "value", {
      enumerable: true,
      get: () => targetValue,
      set: (newValue) => {
        targetValue = newValue === undefined || newValue === null ? "" : String(newValue);
        if (!isControlled) setInternalValue(targetValue === "" ? null : targetValue);
      },
    });
    onChange?.({
      target,
      currentTarget: target,
      type: "change",
      preventDefault: () => {},
      stopPropagation: () => {},
      persist: () => {},
    });
  };

  return (
    //STOP A WRAPPING <label> FROM FORWARDING THE CLICK TO ITS INPUT AND CLOSING THE MENU
    <div className={className} onClick={(event) => event.preventDefault()}>
      <Select
        unstyled
        classNames={getSelectClassNames(variant)}
        styles={selectStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        closeMenuOnScroll={closeMenuOnScroll}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        placeholder={placeholderOption?.label || "Select..."}
        isSearchable={options.length > 7}
        isDisabled={!!disabled}
        required={!!required}
        name={name}
        inputId={id}
      />
    </div>
  );
};

export default ThemedSelect;
