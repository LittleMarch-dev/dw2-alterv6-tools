"use client";

import { useState, useMemo } from "react";
import { formatStepDigimonName } from "@/lib/routeEngine";
import { AutocompleteInput } from "./AutocompleteInput";

interface OwnedPoolProps {
  inventory: string[];
  setInventory: (inventory: string[]) => void;
  allDigimonNames: string[];
}

export function OwnedPool({
  inventory,
  setInventory,
  allDigimonNames,
}: OwnedPoolProps) {
  const [inventoryInput, setInventoryInput] = useState<string>("");

  // Map readable options for the autocomplete input
  const formattedOptions = useMemo(() => {
    return allDigimonNames.map((name) => formatStepDigimonName(name));
  }, [allDigimonNames]);

  const handleAddInventory = (inputName: string) => {
    if (!inputName) return;

    // Find the matching catalog key even if typed with variant brackets or raw names
    const matchedKey = allDigimonNames.find(
      (name) =>
        name.toLowerCase() === inputName.toLowerCase() ||
        formatStepDigimonName(name).toLowerCase() === inputName.toLowerCase(),
    );

    const targetToAdd = matchedKey || inputName;

    if (!inventory.includes(targetToAdd)) {
      const updated = [...inventory, targetToAdd];
      setInventory(updated);
      localStorage.setItem("dw2_user_inventory", JSON.stringify(updated));
    }
  };

  const handleRemoveInventory = (name: string) => {
    const updated = inventory.filter((item) => item !== name);
    setInventory(updated);
    localStorage.setItem("dw2_user_inventory", JSON.stringify(updated));
  };

  return (
    <div
      id="tutorial-owned-pool"
      className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4"
    >
      <div>
        <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          Owned Digimon Pool
        </h2>
        <p className="text-xs text-slate-400">
          Add Digimon you currently own to prioritize them in DNA calculations.
        </p>
      </div>

      <div id="tutorial-inventory-input" className="flex gap-2">
        <AutocompleteInput
          value={inventoryInput}
          onChange={setInventoryInput}
          options={formattedOptions}
          placeholder="Type Digimon to add (e.g., Omnimon)..."
        />
        <button
          onClick={() => {
            handleAddInventory(inventoryInput);
            setInventoryInput("");
          }}
          className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs hover:bg-amber-400 whitespace-nowrap transition-colors"
        >
          Add
        </button>
      </div>

      <div id="tutorial-inventory-list" className="flex flex-wrap gap-2 pt-2">
        {inventory.map((item) => (
          <span
            key={item}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-xl flex items-center gap-1.5"
          >
            🟢 {formatStepDigimonName(item)}
            <button
              onClick={() => handleRemoveInventory(item)}
              className="text-red-400 font-bold ml-1 hover:text-red-300 transition-colors"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
