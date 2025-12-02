import { useState, useRef, useEffect } from "react";

export default function SidebarDropdown({ label, options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="sidebar-block" ref={dropdownRef} style={{ position: "relative" }}>
      <label className="sidebar-label">{label}</label>

      <button
        type="button"
        className="dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {options.find((o) => o.value === value)?.label || "Select"}
        <span className="arrow">▼</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu" style={{ maxHeight: "none", overflowY: "visible" }}>
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`dropdown-item${opt.value === value ? " selected" : ""}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
