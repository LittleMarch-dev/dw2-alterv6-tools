"use client";

import { useState, useMemo } from "react";
import dnaData from "@/data/dna-table.json";

interface DnaMatrixModalProps {
  onClose: () => void;
}

export function DnaMatrixModal({ onClose }: DnaMatrixModalProps) {
  const [matrixStage, setMatrixStage] = useState<
    "Rookie" | "Champion" | "Ultimate"
  >("Rookie");
  const [matrixType, setMatrixType] = useState<"Vaccine" | "Data" | "Virus">(
    "Vaccine",
  );

  const families = [
    "Junk",
    "Insect",
    "Plant",
    "Flying",
    "Spirit",
    "Beast",
    "Dragon",
    "Marine",
  ];

  const activeMatrixTable = useMemo(() => {
    return (dnaData as any)[matrixStage]?.[matrixType] || {};
  }, [matrixStage, matrixType]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-3xl max-w-2xl w-full space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-amber-400">
              DNA Family Matrix
            </h3>
            <p className="text-[11px] text-slate-400">
              Select Result Stage and Winning Attribute below
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-base px-2"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider min-w-[110px]">
              Result Stage:
            </span>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1 overflow-x-auto">
              {(["Rookie", "Champion", "Ultimate"] as const).map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setMatrixStage(stage)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    matrixStage === stage
                      ? "bg-amber-400 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider min-w-[110px]">
              Winning Attribute:
            </span>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1">
              {(["Vaccine", "Data", "Virus"] as const).map((attr) => (
                <button
                  key={attr}
                  type="button"
                  onClick={() => setMatrixType(attr)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    matrixType === attr
                      ? "bg-amber-400 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {attr}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {families.map((f1) => (
            <div
              key={f1}
              className="bg-slate-950 border border-slate-800/80 p-3 rounded-2xl space-y-2"
            >
              <span className="text-xs font-black text-amber-300 block uppercase tracking-wider">
                Main Family: {f1}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                {families.map((f2) => {
                  const res = activeMatrixTable[f1]?.[f2] || "None";
                  const cleanRes = res.replace("*", "").trim();
                  return (
                    <div
                      key={f2}
                      className="bg-slate-900 border border-slate-800/60 px-2 py-1.5 rounded-xl flex justify-between items-center"
                    >
                      <span className="text-slate-400 text-[10px] font-medium">
                        + {f2}:
                      </span>
                      <span className="font-bold text-emerald-400 truncate ml-1">
                        {cleanRes}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
