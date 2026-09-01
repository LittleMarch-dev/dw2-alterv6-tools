"use client";

import { useState, useMemo } from "react";
import { getAdvancedDnaResult, catalog } from "@/lib/dnaEngine";
import { AutocompleteInput } from "./AutocompleteInput";
import { MegaTreeModal } from "./MegaTreeModal";

interface DnaCalculatorProps {
  parent1: string;
  parent2: string;
  onParent1Change: (val: string) => void;
  onParent2Change: (val: string) => void;
  allDigimonNames: string[];
  onOpenMatrix: () => void;
}

export function DnaCalculator({
  parent1,
  parent2,
  onParent1Change,
  onParent2Change,
  allDigimonNames,
  onOpenMatrix,
}: DnaCalculatorProps) {
  const [showTreeModal, setShowTreeModal] = useState(false);

  const dnaDetails = useMemo(
    () => getAdvancedDnaResult(parent1, parent2),
    [parent1, parent2],
  );

  const handleSwapParents = () => {
    onParent1Change(parent2);
    onParent2Change(parent1);
  };

  // Lookup parent catalog details for live badges
  const p1Profile = catalog[parent1];
  const p2Profile = catalog[parent2];

  const cleanOutcomeName = dnaDetails.result
    ? dnaDetails.result.replace(/\s*\([RMA]\)/gi, "").trim()
    : null;

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Detailed DNA Simulator
          </h2>
          <p className="text-[11px] text-slate-400">
            Calculates rank dominance, attribute advantage, and family outcomes.
          </p>
        </div>

        <button
          onClick={onOpenMatrix}
          className="bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
        >
          📊 View DNA Family Matrix
        </button>
      </div>

      {/* Parent Inputs & Metadata Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
        {/* Desktop Swap Button */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden sm:block">
          <button
            type="button"
            onClick={handleSwapParents}
            title="Swap Parent 1 and Parent 2"
            className="bg-slate-950 border border-slate-700 hover:border-amber-400 text-amber-300 hover:text-amber-400 rounded-full p-2.5 shadow-xl transition-transform hover:scale-110 active:scale-95"
          >
            🔄
          </button>
        </div>

        {/* Parent 1 Input + Badges */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2.5">
          <AutocompleteInput
            label="Parent 1 (First Digimon)"
            value={parent1}
            onChange={onParent1Change}
            options={allDigimonNames}
          />
          {p1Profile ? (
            <div className="grid grid-cols-3 gap-1.5 text-[10px] pt-1">
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-300 font-bold text-center">
                {p1Profile.level}
              </span>
              <span className="bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg text-amber-300 font-extrabold text-center">
                {p1Profile.type}
              </span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-400 font-medium truncate text-center">
                {p1Profile.family || "DR"}
              </span>
            </div>
          ) : (
            <div className="h-6" />
          )}
        </div>

        {/* Mobile Swap Button */}
        <div className="flex sm:hidden justify-center -my-2 z-10">
          <button
            type="button"
            onClick={handleSwapParents}
            className="bg-slate-950 border border-slate-700 text-amber-300 text-xs font-bold px-3 py-1 rounded-xl shadow-md"
          >
            🔄 Swap Parents
          </button>
        </div>

        {/* Parent 2 Input + Badges */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2.5">
          <AutocompleteInput
            label="Parent 2 (Second Digimon)"
            value={parent2}
            onChange={onParent2Change}
            options={allDigimonNames}
          />
          {p2Profile ? (
            <div className="grid grid-cols-3 gap-1.5 text-[10px] pt-1">
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-300 font-bold text-center">
                {p2Profile.level}
              </span>
              <span className="bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg text-amber-300 font-extrabold text-center">
                {p2Profile.type}
              </span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-400 font-medium truncate text-center">
                {p2Profile.family || "DR"}
              </span>
            </div>
          ) : (
            <div className="h-6" />
          )}
        </div>
      </div>

      {/* DNA Result Summary Box */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
              Attribute Advantage & Priority
            </span>
            <p className="text-xs text-amber-300 font-semibold">
              {dnaDetails.reason}
            </p>
          </div>
          {dnaDetails.winningParent && (
            <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-3 py-1 rounded-full">
              Winner: {dnaDetails.winningParent.replace(/\s*\([RMA]\)/gi, "")} (
              {dnaDetails.winningType})
            </span>
          )}
        </div>

        <div className="text-center py-2 space-y-3">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
            DNA Outcome Species
          </span>

          {cleanOutcomeName ? (
            <div className="space-y-3">
              <div>
                <span className="text-2xl font-black text-emerald-400 block">
                  {cleanOutcomeName}
                </span>
                <span className="text-xs text-slate-400">
                  Result Stage:{" "}
                  <strong className="text-white">{dnaDetails.stage}</strong> •
                  Attribute:{" "}
                  <strong className="text-amber-300">
                    {catalog[dnaDetails.result!]?.type ||
                      dnaDetails.winningType}
                  </strong>
                </span>
              </div>

              {/* Mega Branches Modal Button */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowTreeModal(true)}
                  className="bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-all inline-flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  🔍 View Mega Branches & DP Requirements
                </button>
              </div>
            </div>
          ) : (
            <span className="text-sm text-red-400 font-semibold block">
              {dnaDetails.stage}
            </span>
          )}
        </div>
      </div>

      {/* Render Popover Modal */}
      {showTreeModal && dnaDetails.result && (
        <MegaTreeModal
          digimonName={dnaDetails.result}
          onClose={() => setShowTreeModal(false)}
        />
      )}
    </div>
  );
}
