import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IoColorPaletteOutline } from "react-icons/io5";

const ColorList = ({ items = [] }) => {
  const buttonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const colors = items.map((item) => (typeof item === "string" ? item : item?.color))

  const showDropdown = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDropdownPosition({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 140),
    });
  };

  const hideDropdown = () => {
    setDropdownPosition(null);
  };

  if (!colors.length) {
    return <span className="text-gray-400 dark:text-gray-500">--</span>;
  }

  return (
    <div className="inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={showDropdown}
        onMouseLeave={hideDropdown}
        onFocus={showDropdown}
        onBlur={hideDropdown}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
      >
        <IoColorPaletteOutline size={20} />
      </button>
      {dropdownPosition &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[9999] min-w-28 rounded-md border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
          >
            {colors.map((color) => (
              <div key={color} className="whitespace-nowrap px-3 py-1.5">
                {color}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

export default ColorList;
