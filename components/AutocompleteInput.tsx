"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { catalog } from "@/lib/dnaEngine";

interface AutocompleteInputProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}

export function AutocompleteInput({
  label,
  value,
  onChange,
  options,
  placeholder = "Type to search...",
}: AutocompleteInputProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click Outside to Close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Clean raw MRA keys & deduplicate (e.g., "Diaboromon (A)" -> "Diaboromon")
  const cleanOptions = useMemo(() => {
    const set = new Set<string>();
    options.forEach((opt) => {
      const clean = opt.replace(/\s*\([RMA]\)/gi, "").trim();
      set.add(clean);
    });
    return Array.from(set).sort();
  }, [options]);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return cleanOptions.slice(0, 8);
    return cleanOptions
      .filter((opt) => opt.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);
  }, [query, cleanOptions]);

  return (
    <div ref={containerRef} className="relative space-y-1 w-full">
      {label && (
        <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8"
        />
        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onChange("");
              setIsOpen(true);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
          {filteredOptions.map((opt) => {
            const rawKey =
              opt === "Diaboromon"
                ? "Diaboromon (A)"
                : opt === "Omnimon"
                  ? "Omnimon (A)"
                  : opt === "Baihumon"
                    ? "Baihumon (A)"
                    : opt;
            const profile = catalog[rawKey];

            return (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setQuery(opt);
                  setIsOpen(false);
                }}
                className="px-3 py-2 text-xs text-slate-200 hover:bg-amber-500 hover:text-slate-950 cursor-pointer transition-colors flex justify-between items-center"
              >
                <span className="font-semibold">{opt}</span>
                {profile && (
                  <span className="text-slate-400 text-[10px]">
                    ({profile.level} / {profile.type})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
