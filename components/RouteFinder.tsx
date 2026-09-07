"use client";

import { useState, useMemo, useEffect } from "react";
import {
  catalog,
  StageLevel,
  getAdvancedDnaResult,
  DIGIMON_MAP,
} from "@/lib/dnaEngine";
import {
  findShortestSafeRoute,
  getLegendaryVariants,
  RouteResult,
  formatStepDigimonName,
} from "@/lib/routeEngine";
import { AutocompleteInput } from "./AutocompleteInput";
import { RouteStepCard, FodderStatus, FodderOption } from "./RouteStepCard";

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

function formatDpDisplay(dp: number): string {
  return dp >= 14 ? "14+" : `${dp}`;
}

function copyDebugLogToClipboard(
  evoStart: string,
  currentDp: number,
  evoGoal: string,
  activeEngineGoal: string,
  selectedFodderTier: StageLevel,
  routeResult: RouteResult,
) {
  const debugPayload = {
    timestamp: new Date().toISOString(),
    inputs: {
      evoStart,
      resolvedStart: resolveCatalogKey(evoStart),
      currentDp,
      evoGoal,
      activeEngineGoal,
      resolvedGoal: resolveCatalogKey(activeEngineGoal),
      selectedFodderTier,
    },
    engineResult: {
      success: routeResult.success,
      totalSteps: routeResult.totalSteps,
      totalDnaResets: routeResult.totalDnaResets,
      finalDp: routeResult.finalDp,
      warningNotice: routeResult.warningNotice || null,
      message: routeResult.message || null,
      suggestedGoal: routeResult.suggestedGoal || null,
      path: routeResult.path.map((step) => ({
        stepNumber: step.stepNumber,
        actionType: step.actionType,
        fromDigimon: step.fromDigimon,
        fromStage: step.fromStage,
        toDigimon: step.toDigimon,
        toStage: step.toStage,
        currentDp: step.currentDp,
        fodderFamily: step.fodderFamily || null,
        fodderLevel: step.fodderLevel || null,
        reason: step.reason,
      })),
    },
  };

  navigator.clipboard.writeText(JSON.stringify(debugPayload, null, 2));
  alert("📋 Engine debug trace copied to clipboard in JSON format!");
}

function getFoddersForStep(
  fromDigimon?: string,
  expectedResult?: string,
  family?: string,
  fodderLevel?: StageLevel,
  userInventory: string[] = [],
  unlockedDomain: string = "All Domains",
): FodderOption[] {
  if (!fromDigimon || !expectedResult || !family || !fodderLevel) return [];

  const matches = Object.keys(catalog).filter(
    (key) =>
      catalog[key].family === family && catalog[key].level === fodderLevel,
  );

  const validMatches = matches.filter((fodderKey) => {
    const dnaRes = getAdvancedDnaResult(fromDigimon, fodderKey);
    return dnaRes.result === expectedResult;
  });

  return validMatches.map((name) => {
    const cleanName = sanitizeDisplayName(name);

    // 1. Check inventory against both exact key and clean name
    const isOwned =
      userInventory.includes(name) || userInventory.includes(cleanName);

    // 2. Normalize lookup key for locations (e.g., "Omnimon (M)" -> "Omnimon")
    const lookupKey = name.replace(/\s*\([MRA]\)/gi, "").trim();
    const locations = DIGIMON_MAP[lookupKey] || DIGIMON_MAP[name] || [];
    const isWild = locations.length > 0;

    let status: FodderStatus = "CATCHABLE";

    if (isOwned) {
      status = "OWNED";
    } else if (!isWild) {
      status = "MUST_DIGIVOLVE";
    } else if (unlockedDomain && unlockedDomain !== "All Domains") {
      const isAvailableInUnlocked = locations.some((locStr) => {
        const domainName = locStr.replace(/\s*\(Floor.*\)/gi, "").trim();
        return domainName.toLowerCase() === unlockedDomain.toLowerCase();
      });

      status = isAvailableInUnlocked ? "CATCHABLE" : "LOCKED_PROGRESS";
    } else {
      status = "CATCHABLE";
    }

    return {
      name,
      displayName: cleanName,
      status,
      locations,
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
  const [currentDp, setCurrentDp] = useState<number>(1);
  const [evoGoal, setEvoGoal] = useState<string>("Diaboromon");
  const [selectedVariantKey, setSelectedVariantKey] = useState<string | null>(
    null,
  );

  const [selectedFodderTier, setSelectedFodderTier] =
    useState<StageLevel>("Champion");

  const resolvedStart = useMemo(() => resolveCatalogKey(evoStart), [evoStart]);
  const startProfile = catalog[resolvedStart];
  const starterStage: StageLevel = startProfile?.level || "Rookie";

  const legendaryVariants = useMemo(
    () => getLegendaryVariants(evoGoal),
    [evoGoal],
  );

  useEffect(() => {
    if (legendaryVariants.length > 0) {
      setSelectedVariantKey(legendaryVariants[0].key);
    } else {
      setSelectedVariantKey(null);
    }
  }, [legendaryVariants]);

  const activeEngineGoal = useMemo(() => {
    if (legendaryVariants.length > 0 && selectedVariantKey) {
      return selectedVariantKey;
    }
    return evoGoal;
  }, [legendaryVariants, selectedVariantKey, evoGoal]);

  const resolvedGoal = useMemo(
    () => resolveCatalogKey(activeEngineGoal),
    [activeEngineGoal],
  );

  const availableFodderTiers = useMemo<StageLevel[]>(() => {
    if (starterStage === "Mega") {
      return ["Champion", "Ultimate", "Mega"];
    }
    if (starterStage === "Ultimate") {
      return ["Champion", "Ultimate"];
    }
    return ["Champion"];
  }, [starterStage]);

  useEffect(() => {
    if (!availableFodderTiers.includes(selectedFodderTier)) {
      setSelectedFodderTier(availableFodderTiers[0]);
    }
  }, [availableFodderTiers, selectedFodderTier]);

  const routeResult: RouteResult = useMemo(() => {
    return findShortestSafeRoute(
      resolvedStart,
      currentDp,
      resolvedGoal,
      selectedFodderTier,
    );
  }, [resolvedStart, currentDp, resolvedGoal, selectedFodderTier]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div
        id="tutorial-route-inputs"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <AutocompleteInput
            label="1. Current Starter Digimon"
            value={evoStart}
            onChange={setEvoStart}
            options={allDigimonNames}
          />
          <span className="text-[10px] text-amber-400 font-bold mt-1 block uppercase">
            Current Stage: {starterStage}
          </span>
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

      {/* Legendary Sub-Variant Selector */}
      {legendaryVariants.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
            Select {evoGoal} Skill Variant:
          </span>
          <div className="flex flex-wrap gap-2">
            {legendaryVariants.map((variant) => (
              <button
                key={variant.key}
                type="button"
                onClick={() => setSelectedVariantKey(variant.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedVariantKey === variant.key
                    ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {variant.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(starterStage === "Ultimate" || starterStage === "Mega") && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                2. Choose DNA Fodder Stage Strategy
              </span>
              <p className="text-[11px] text-slate-400">
                Select your preferred fodder tier for DNA resets.
              </p>
            </div>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
              {availableFodderTiers.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setSelectedFodderTier(tier)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedFodderTier === tier
                      ? "bg-amber-400 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tier === "Champion" &&
                    "🛡️ Champion Fodder (Reset to Rookie)"}
                  {tier === "Ultimate" &&
                    "⚡ Ultimate Fodder (Reset to Champion)"}
                  {tier === "Mega" && "🔥 Mega Fodder (Reset to Ultimate)"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Warning Banner */}
      {routeResult.warningNotice && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-2.5 shadow-lg">
          <span className="text-base">⚡</span>
          <span>{routeResult.warningNotice}</span>
        </div>
      )}

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
                🛡️ Generate Success
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {typeof window !== "undefined" &&
              (process.env.NODE_ENV === "development" ||
                window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1") && (
                <button
                  type="button"
                  onClick={() =>
                    copyDebugLogToClipboard(
                      evoStart,
                      currentDp,
                      evoGoal,
                      activeEngineGoal,
                      selectedFodderTier,
                      routeResult,
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-[11px] font-bold transition-all border border-slate-700 flex items-center gap-1.5"
                >
                  📋 Copy Engine Debug Log
                </button>
              )}

            {routeResult.success && (
              <div className="flex gap-2 text-[11px] font-semibold text-slate-400">
                <span>
                  Steps:{" "}
                  <strong className="text-white">
                    {routeResult.totalSteps}
                  </strong>
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
                    {formatDpDisplay(routeResult.finalDp)} DP
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {!routeResult.success ? (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="text-base">⚠️</span>
              <span>
                {routeResult.message ||
                  "No valid path found matching DP constraints."}
              </span>
            </div>

            {routeResult.suggestedGoal && (
              <button
                type="button"
                onClick={() =>
                  setEvoGoal(formatStepDigimonName(routeResult.suggestedGoal!))
                }
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black whitespace-nowrap hover:bg-amber-300 transition-all shadow-md shrink-0"
              >
                🎯 Set {formatStepDigimonName(routeResult.suggestedGoal)} as
                Goal
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {routeResult.path.map((step) => {
              const fodders = getFoddersForStep(
                step.fromDigimon,
                step.toDigimon,
                step.fodderFamily,
                step.fodderLevel,
                userInventory,
                unlockedDomain,
              );

              return (
                <RouteStepCard
                  key={step.stepNumber}
                  step={step}
                  fodders={fodders}
                  onSelectDigimon={onSelectDigimon}
                  formatDpDisplay={formatDpDisplay}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
