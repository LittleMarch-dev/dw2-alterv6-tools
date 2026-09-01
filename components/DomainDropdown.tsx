"use client";

import { useState } from "react";

interface DomainDropdownProps {
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
}

export function DomainDropdown({
  options,
  selected,
  onSelect,
}: DomainDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedIndex = options.indexOf(selected) + 1;

  return (
    <div className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-xl w-full sm:w-auto transition-colors"
      >
        <span className="truncate">
          {selectedIndex > 0 ? `${selectedIndex}. ${selected}` : selected}
        </span>
        <span className="text-slate-500 text-[10px]">▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 z-50 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1">
            {options.map((domain, idx) => (
              <button
                key={domain}
                type="button"
                onClick={() => {
                  onSelect(domain);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2 ${
                  selected === domain
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-[10px] opacity-60 font-mono">
                  {idx + 1}.
                </span>
                <span className="truncate">{domain}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
