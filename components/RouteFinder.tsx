"use client";

import { useState, useMemo, useEffect } from "react";
import {
  findAllEvolutionPaths,
  StrategyPreference,
  SPECIAL_MRA_MAP,
} from "@/lib/dnaEngine";
import { AutocompleteInput } from "./AutocompleteInput";

interface RouteFinderProps {
  unlockedDomain: string;
  userInventory: string[];
  onSelectDigimon: (name: string) => void;
  allDigimonNames: string[];
}

export function RouteFinder({
  unlockedDomain,
  userInventory,
  onSelectDigimon,
  allDigimonNames,
}: RouteFinderProps) {
  const [evoStart, setEvoStart] = useState<string>("Myotismon");
  const [evoGoal, setEvoGoal] = useState<string>("Diaboromon");
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);
  const [strategy, setStrategy] = useState<StrategyPreference>("prioDna");

  // Track the selected move variant key for Diaboromon / Omnimon / Baihumon
  const [selectedMraKey, setSelectedMraKey] = useState<string | null>(null);

  // Check if current goal is one of the 3 special Digimon
  const specialOptions = SPECIAL_MRA_MAP[evoGoal];

  // Auto-reset selected move when goal changes
  useEffect(() => {
    if (specialOptions) {
      setSelectedMraKey(specialOptions[0].catalogKey);
    } else {
      setSelectedMraKey(null);
    }
  }, [evoGoal]);

  // Use either the selected MRA variant key or the direct goal string
  const activeEngineGoal = specialOptions
    ? selectedMraKey || specialOptions[0].catalogKey
    : evoGoal;

  const evoRouteOptions = useMemo(
    () =>
      findAllEvolutionPaths(
        evoStart,
        activeEngineGoal,
        userInventory,
        unlockedDomain,
        strategy,
      ),
    [evoStart, activeEngineGoal, userInventory, unlockedDomain, strategy],
  );

  const activeRoute = evoRouteOptions[selectedRouteIdx] || evoRouteOptions[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search Priority Toggle */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
            Route Search Priority
          </span>
          <p className="text-[11px] text-slate-400">
            Choose whether to prioritize early DNA stage resets or natural
            Digivolution steps first.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStrategy("prioDna")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              strategy === "prioDna"
                ? "bg-amber-400 text-slate-950"
                : "text-slate-400"
            }`}
          >
            ⚡ Prioritize DNA Reset
          </button>
          <button
            type="button"
            onClick={() => setStrategy("prioDirect")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              strategy === "prioDirect"
                ? "bg-amber-400 text-slate-950"
                : "text-slate-400"
            }`}
          >
            🛡️ Prioritize Direct Digivolve
          </button>
        </div>
      </div>

      {/* Start and Target Goal Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <AutocompleteInput
            label="Current Digimon"
            value={evoStart}
            onChange={setEvoStart}
            options={allDigimonNames}
          />
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <AutocompleteInput
            label="Target Goal"
            value={evoGoal}
            onChange={setEvoGoal}
            options={allDigimonNames}
          />
        </div>
      </div>

      {/* SPECIAL MRA SKILL SELECTION PROMPT */}
      {specialOptions && (
        <div className="bg-slate-950 border border-amber-500/30 p-4 rounded-2xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              🎯 Choose Target Skill to Learn for {evoGoal}:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {specialOptions.map((opt) => (
              <button
                key={opt.catalogKey}
                type="button"
                onClick={() => setSelectedMraKey(opt.catalogKey)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  (selectedMraKey || specialOptions[0].catalogKey) ===
                  opt.catalogKey
                    ? "bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-md"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="text-xs font-black">{opt.moveName}</div>
                <div className="text-[10px] opacity-75 mt-0.5">{opt.dpReq}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Evolution Route Display Steps */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Evolution Routes
          </h2>
          <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-semibold">
            {evoRouteOptions.length} Options
          </span>
        </div>

        {evoRouteOptions.length === 0 ? (
          <p className="text-xs text-red-400 font-semibold">
            No path found between these Digimon.
          </p>
        ) : (
          <div className="space-y-3">
            {evoRouteOptions.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {evoRouteOptions.map((opt, idx) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedRouteIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                      selectedRouteIdx === idx
                        ? "bg-amber-400 text-slate-950 border-amber-400"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    {idx === 0 ? "⭐ Best Way" : `Option ${idx + 1}`} (
                    {opt.totalSteps} Steps)
                  </button>
                ))}
              </div>
            )}

            {activeRoute && (
              <div className="space-y-3">
                {activeRoute.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3"
                  >
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                          STEP {idx + 1}
                        </span>
                        <span className="text-sm font-bold text-slate-100">
                          {step.description.replace(/\s*\([RMA]\)/gi, "")}
                        </span>
                      </div>
                    </div>

                    {step.validFodders && step.validFodders.length > 0 && (
                      <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl space-y-2">
                        <span className="text-amber-400 font-bold uppercase text-[10px] tracking-wider block">
                          Select Any {step.requiredStage} with [
                          {step.requiredFamily}] Family (
                          {step.validFodders.length} Options):
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
                          {step.validFodders.map((fodder) => (
                            <button
                              key={fodder.name}
                              type="button"
                              onClick={() => onSelectDigimon(fodder.name)}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-transform hover:scale-105 ${
                                fodder.status === "OWNED"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : fodder.status === "CATCHABLE"
                                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                    : "bg-red-500/10 text-red-500/30 border-red-500/20"
                              }`}
                            >
                              <span>
                                {fodder.status === "OWNED" && "🟢"}
                                {fodder.status === "CATCHABLE" && "🟡"}
                                {fodder.status === "UNCATCHABLE" && "🔴"}
                              </span>
                              <span>{fodder.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
