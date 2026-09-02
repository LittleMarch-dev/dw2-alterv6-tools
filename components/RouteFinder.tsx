"use client";

import { useState, useMemo, useEffect } from "react";
import { SPECIAL_MRA_MAP, catalog, StageLevel } from "@/lib/dnaEngine";
import {
  findShortestSafeRoute,
  RouteResult,
  formatStepDigimonName,
} from "@/lib/routeEngine";
import { AutocompleteInput } from "./AutocompleteInput";

interface RouteFinderProps {
  unlockedDomain: string;
  userInventory: string[];
  onSelectDigimon: (name: string) => void;
  allDigimonNames: string[];
}

function sanitizeDisplayName(rawName: string): string {
  if (!rawName) return "";
  return rawName
    .replace(/\s*\([RMA]\)/gi, "")
    .replace(/\s*\[.*?\]/g, "")
    .trim();
}

function resolveCatalogKey(inputName: string): string {
  if (!inputName) return "";
  if (catalog[inputName]) return inputName;

  const variants = [`${inputName} (M)`, `${inputName} (R)`, `${inputName} (A)`];
  const found = variants.find((v) => catalog[v]);
  return found || inputName;
}

// Strict DW2 DNA Fodder Filter:
// 1. Rookies CANNOT be used as DNA parents/fodder.
// 2. Ultimate -> Champion requires Ultimate fodder.
// 3. Ultimate -> Rookie or Champion -> Rookie requires Champion fodder.
function getFoddersForFamily(
  family?: string,
  userInventory: string[] = [],
  fromStage?: StageLevel,
  toStage?: StageLevel,
) {
  if (!family) return [];

  const requiredFodderLevel: StageLevel =
    fromStage === "Ultimate" && toStage === "Champion"
      ? "Ultimate"
      : "Champion";

  const matches = Object.keys(catalog).filter(
    (key) =>
      catalog[key].family === family &&
      catalog[key].level === requiredFodderLevel,
  );

  return matches.map((name) => {
    const cleanName = sanitizeDisplayName(name);
    const isOwned =
      userInventory.includes(name) || userInventory.includes(cleanName);
    return {
      name,
      displayName: cleanName,
      status: isOwned ? "OWNED" : "CATCHABLE",
      level: catalog[name].level,
    };
  });
}

export function RouteFinder({
  unlockedDomain,
  userInventory,
  onSelectDigimon,
  allDigimonNames,
}: RouteFinderProps) {
  const [evoStart, setEvoStart] = useState<string>("Myotismon");
  const [currentDp, setCurrentDp] = useState<number>(8);
  const [evoGoal, setEvoGoal] = useState<string>("Diaboromon");
  const [selectedMraKey, setSelectedMraKey] = useState<string | null>(null);

  const specialOptions = SPECIAL_MRA_MAP[evoGoal];

  // Sync selected variant key when target goal changes
  useEffect(() => {
    if (specialOptions && specialOptions.length > 0) {
      setSelectedMraKey(specialOptions[0].catalogKey);
    } else {
      setSelectedMraKey(null);
    }
  }, [evoGoal, specialOptions]);

  const activeEngineGoal = useMemo(() => {
    if (specialOptions && specialOptions.length > 0) {
      return selectedMraKey || specialOptions[0].catalogKey;
    }
    return evoGoal;
  }, [specialOptions, selectedMraKey, evoGoal]);

  const resolvedStart = useMemo(() => resolveCatalogKey(evoStart), [evoStart]);
  const resolvedGoal = useMemo(
    () => resolveCatalogKey(activeEngineGoal),
    [activeEngineGoal],
  );

  // Execute DP-aware route engine calculation
  const routeResult: RouteResult = useMemo(() => {
    return findShortestSafeRoute(resolvedStart, currentDp, resolvedGoal);
  }, [resolvedStart, currentDp, resolvedGoal]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Pickers: Start Digimon, DP, Target Goal */}
      <div
        id="tutorial-route-inputs"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <AutocompleteInput
            label="Current Digimon"
            value={evoStart}
            onChange={setEvoStart}
            options={allDigimonNames}
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <label className="text-xs font-bold text-slate-400 block mb-2">
            Current DP
          </label>
          <input
            type="number"
            min={0}
            max={99}
            value={currentDp}
            onChange={(e) => setCurrentDp(parseInt(e.target.value, 10) || 0)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-bold text-emerald-400 focus:outline-none focus:border-amber-400"
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

      {/* Target Skill Selector (Special MRA Options) */}
      <div id="tutorial-target-skills">
        {specialOptions ? (
          <div className="bg-slate-950 border border-amber-500/30 p-4 rounded-2xl space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                🎯 Choose Target Skill to Learn for{" "}
                {sanitizeDisplayName(evoGoal)}:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {specialOptions.map((opt) => (
                <button
                  key={opt.catalogKey}
                  type="button"
                  onClick={() => setSelectedMraKey(opt.catalogKey)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeEngineGoal === opt.catalogKey
                      ? "bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-md"
                      : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="text-xs font-black">{opt.moveName}</div>
                  <div className="text-[10px] opacity-75 mt-0.5">
                    Required DP: {opt.dpReq}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800/40 p-3 rounded-2xl text-[11px] text-slate-500 text-center">
            Standard Digimon evolution selected.
          </div>
        )}
      </div>

      {/* Optimal Evolution Path Timeline */}
      <div
        id="tutorial-evolution-routes"
        className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4"
      >
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Optimal Shortest Path
            </h2>
            {routeResult.success && (
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                Success Generate
              </span>
            )}
          </div>

          {routeResult.success && (
            <div className="flex gap-2 text-[11px] font-semibold text-slate-400">
              <span>
                Steps:{" "}
                <strong className="text-white">{routeResult.totalSteps}</strong>
              </span>
              <span>•</span>
              <span>
                DNA Resets:{" "}
                <strong className="text-white">
                  {routeResult.totalDnaResets}
                </strong>
              </span>
              <span>•</span>
              <span>
                End DP:{" "}
                <strong className="text-emerald-400">
                  {routeResult.finalDp} DP
                </strong>
              </span>
            </div>
          )}
        </div>

        {!routeResult.success ? (
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 text-red-300 text-xs font-semibold">
            ❌{" "}
            {routeResult.message ||
              "No valid path found matching DP constraints."}
          </div>
        ) : (
          <div className="space-y-3">
            {routeResult.path.map((step) => {
              const fodders = getFoddersForFamily(
                step.fodderFamily,
                userInventory,
                step.fromStage,
                step.toStage,
              );

              const requiredFodderLevel =
                step.fromStage === "Ultimate" && step.toStage === "Champion"
                  ? "Ultimate"
                  : "Champion";

              return (
                <div
                  key={step.stepNumber}
                  className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3"
                >
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                        STEP {step.stepNumber}
                      </span>
                      <span className="text-sm font-bold text-slate-100">
                        {formatStepDigimonName(step.fromDigimon)} (
                        {step.fromStage})
                        <span className="text-slate-500 mx-1.5">➔</span>
                        <span className="text-emerald-400">
                          {formatStepDigimonName(step.toDigimon)}
                        </span>{" "}
                        ({step.toStage})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold">
                        Resulting DP: {step.currentDp}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          step.actionType === "DNA"
                            ? "bg-purple-900 text-purple-200"
                            : "bg-blue-900 text-blue-200"
                        }`}
                      >
                        {step.actionType === "DNA"
                          ? `🧬 DNA RESET (${step.fodderFamily})`
                          : `⚡ DIGIVOLVE`}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    <span className="text-slate-500 font-bold">Action: </span>
                    {step.reason}
                  </div>

                  {step.actionType === "DNA" && fodders.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl space-y-2">
                      <span className="text-amber-400 font-bold uppercase text-[10px] tracking-wider block">
                        Recommended {requiredFodderLevel} Fodders [
                        {step.fodderFamily} Family] ({fodders.length} Options):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
                        {fodders.map((fodder) => (
                          <button
                            key={fodder.displayName}
                            type="button"
                            onClick={() => onSelectDigimon(fodder.name)}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-transform hover:scale-105 ${
                              fodder.status === "OWNED"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            }`}
                          >
                            <span>
                              {fodder.status === "OWNED" ? "🟢" : "🟡"}
                            </span>
                            <span>{fodder.displayName}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
