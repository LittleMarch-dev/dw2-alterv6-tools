"use client";

import { catalog } from "@/lib/dnaEngine";

interface MegaTreeModalProps {
  digimonName: string;
  onClose: () => void;
}

interface MegaOption {
  megaName: string;
  megaDp: string;
  megaType: string;
  megaSkill?: string;
  megaDpVal: number;
}

interface UltimateGroup {
  ultName: string;
  ultDp: string;
  ultDpVal: number;
  megas: MegaOption[];
}

interface ChampionBranch {
  nextName: string;
  nextStage: string;
  nextType: string;
  nextDp: string;
  minDpVal: number;
  ultimates: UltimateGroup[];
}

function parseMinDpValue(dpStr: string): number {
  if (!dpStr) return 0;
  const matches = dpStr.match(/\d+/g);
  if (!matches) return 0;
  return Math.min(...matches.map(Number));
}

function getGroupedTree(baseName: string): ChampionBranch[] {
  const baseProfile = catalog[baseName];
  if (!baseProfile || !baseProfile.evolutions) return [];

  const branches: ChampionBranch[] = [];

  baseProfile.evolutions.forEach((evo1) => {
    const nextProfile = catalog[evo1.target];
    if (!nextProfile) return;

    const nextName = evo1.target.replace(/\s*\([RMA]\)/gi, "").trim();
    const currentMinDp = parseMinDpValue(evo1.dp);

    // 1. Rookie -> Champion -> Ultimate -> Mega
    if (nextProfile.level === "Champion") {
      const ultGroups: UltimateGroup[] = [];

      (nextProfile.evolutions || []).forEach((evo2) => {
        const ultName = evo2.target.replace(/\s*\([RMA]\)/gi, "").trim();
        const ultProfile = catalog[evo2.target];

        const megas: MegaOption[] = (ultProfile?.evolutions || []).map(
          (evo3) => {
            const rawMegaName = evo3.target;
            const megaProfile = catalog[rawMegaName];

            return {
              megaName: rawMegaName.replace(/\s*\([RMA]\)/gi, "").trim(),
              megaDp: evo3.dp,
              megaType: megaProfile?.type || "Unknown",
              megaSkill: megaProfile?.signature_skill,
              megaDpVal: parseMinDpValue(evo3.dp),
            };
          },
        );

        megas.sort((a, b) => a.megaDpVal - b.megaDpVal);

        ultGroups.push({
          ultName,
          ultDp: evo2.dp,
          ultDpVal: parseMinDpValue(evo2.dp),
          megas,
        });
      });

      ultGroups.sort((a, b) => a.ultDpVal - b.ultDpVal);

      branches.push({
        nextName,
        nextStage: "Champion",
        nextType: nextProfile.type,
        nextDp: evo1.dp,
        minDpVal: currentMinDp,
        ultimates: ultGroups,
      });
    }
    // 2. Champion -> Ultimate -> Mega
    else if (nextProfile.level === "Ultimate") {
      const megas: MegaOption[] = (nextProfile.evolutions || []).map((evo2) => {
        const rawMegaName = evo2.target;
        const megaProfile = catalog[rawMegaName];

        return {
          megaName: rawMegaName.replace(/\s*\([RMA]\)/gi, "").trim(),
          megaDp: evo2.dp,
          megaType: megaProfile?.type || "Unknown",
          megaSkill: megaProfile?.signature_skill,
          megaDpVal: parseMinDpValue(evo2.dp),
        };
      });

      megas.sort((a, b) => a.megaDpVal - b.megaDpVal);

      branches.push({
        nextName,
        nextStage: "Ultimate",
        nextType: nextProfile.type,
        nextDp: evo1.dp,
        minDpVal: currentMinDp,
        ultimates: [
          {
            ultName: nextName,
            ultDp: evo1.dp,
            ultDpVal: currentMinDp,
            megas,
          },
        ],
      });
    }
  });

  return branches.sort((a, b) => a.minDpVal - b.minDpVal);
}

export function MegaTreeModal({ digimonName, onClose }: MegaTreeModalProps) {
  const cleanBaseName = digimonName.replace(/\s*\([RMA]\)/gi, "").trim();
  const branches = getGroupedTree(digimonName);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border-t sm:border border-amber-500/30 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
              Evolution Guide (Lowest DP First)
            </span>
            <h3 className="text-base font-black text-slate-100 flex items-center gap-1.5">
              <span>🧬</span> {cleanBaseName} Branches
            </h3>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 text-slate-300 hover:text-white font-bold h-7 w-7 rounded-full flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Priority List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {branches.length === 0 ? (
            <p className="text-xs text-slate-400 font-semibold text-center py-6">
              {cleanBaseName} has reached its final form!
            </p>
          ) : (
            branches.map((branch, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-md"
              >
                {/* Champion Stage Header */}
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">
                        Next Step
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-100">
                        {branch.nextName}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        ({branch.nextStage})
                      </span>
                    </div>
                  </div>

                  <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-black px-2.5 py-1 rounded-xl">
                    {branch.nextDp} DP
                  </span>
                </div>

                {/* Grouped Ultimate Sections */}
                <div className="space-y-2.5">
                  {branch.ultimates.map((ultGroup, uIdx) => (
                    <div
                      key={uIdx}
                      className="bg-slate-900/90 border border-slate-800/90 p-2.5 rounded-xl space-y-2"
                    >
                      {/* Ultimate Stage Name */}
                      <div className="flex justify-between items-center text-xs border-b border-slate-800/60 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 text-[10px]">➔</span>
                          <span className="font-bold text-slate-200">
                            {ultGroup.ultName}
                          </span>
                        </div>
                        <span className="text-[9px] text-amber-300 font-mono font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {ultGroup.ultDp} DP
                        </span>
                      </div>

                      {/* Mega Targets Under this Ultimate */}
                      {ultGroup.megas.length > 0 && (
                        <div className="space-y-1 pl-2">
                          {ultGroup.megas.map((mega, mIdx) => {
                            const isSpecialTrio = [
                              "Omnimon",
                              "Diaboromon",
                              "Baihumon",
                            ].includes(mega.megaName);

                            return (
                              <div
                                key={mIdx}
                                className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800/60 flex justify-between items-center text-xs"
                              >
                                <div className="space-y-0.5 truncate">
                                  <span className="font-extrabold text-emerald-400 block truncate">
                                    👑 {mega.megaName}
                                  </span>
                                  {isSpecialTrio && mega.megaSkill && (
                                    <span className="text-[8px] font-extrabold text-emerald-300/90 block">
                                      ⚡ {mega.megaSkill}
                                    </span>
                                  )}
                                </div>

                                <span className="text-[10px] text-amber-300 font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0 ml-2">
                                  {mega.megaDp} DP
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
