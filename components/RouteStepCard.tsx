"use client";

import { formatStepDigimonName, RouteStep } from "@/lib/routeEngine";

export type FodderStatus =
  | "OWNED"
  | "CATCHABLE"
  | "LOCKED_PROGRESS"
  | "MUST_DIGIVOLVE";

export interface FodderOption {
  name: string;
  displayName: string;
  status: FodderStatus;
  locations: string[];
}

interface RouteStepCardProps {
  step: RouteStep;
  fodders: FodderOption[];
  onSelectDigimon: (name: string) => void;
  formatDpDisplay: (dp: number) => string;
}

export function RouteStepCard({
  step,
  fodders,
  onSelectDigimon,
  formatDpDisplay,
}: RouteStepCardProps) {
  return (
    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
      {/* Header Info */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md">
            STEP {step.stepNumber}
          </span>
          <span className="text-sm font-bold text-slate-100">
            {formatStepDigimonName(step.fromDigimon)} ({step.fromStage})
            <span className="text-slate-500 mx-1.5">➔</span>
            <span className="text-emerald-400">
              {formatStepDigimonName(step.toDigimon)}
            </span>{" "}
            ({step.toStage})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold">
            Resulting DP: {formatDpDisplay(step.currentDp)}
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

      {/* Action Explanation */}
      <div className="text-[11px] text-slate-400">
        <span className="text-slate-500 font-bold">Action: </span>
        {step.reason}
      </div>

      {/* Fodder Options */}
      {step.actionType === "DNA" && fodders.length > 0 && (
        <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl space-y-2">
          <div className="flex justify-between items-center flex-wrap gap-1">
            <span className="text-amber-400 font-bold uppercase text-[10px] tracking-wider block">
              Valid {step.fodderLevel} Fodders [{step.fodderFamily} Family] (
              {fodders.length} Options):
            </span>
            <div className="flex items-center gap-2 text-[9px] text-slate-400">
              <span>🟢 Owned</span>
              <span>🟡 Catchable</span>
              <span>🔴 Not In Domain</span>
              <span>🟣 Must Digivolve</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
            {fodders.map((fodder, idx) => {
              let badgeStyle =
                "bg-amber-500/10 text-amber-300 border-amber-500/30";
              let icon = "🟡";

              if (fodder.status === "OWNED") {
                badgeStyle =
                  "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                icon = "🟢";
              } else if (fodder.status === "LOCKED_PROGRESS") {
                badgeStyle =
                  "bg-red-500/10 text-red-400 border-red-500/30 opacity-70";
                icon = "🔴";
              } else if (fodder.status === "MUST_DIGIVOLVE") {
                badgeStyle =
                  "bg-purple-500/10 text-purple-300 border-purple-500/30";
                icon = "🟣";
              }

              return (
                <button
                  key={`${fodder.name}-${idx}`}
                  type="button"
                  onClick={() => onSelectDigimon(fodder.name)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-transform hover:scale-105 ${badgeStyle}`}
                >
                  <span>{icon}</span>
                  <span>{formatStepDigimonName(fodder.name)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
