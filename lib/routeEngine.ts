import rawCatalog from "@/data/digimon-catalog.json";
import { getAdvancedDnaResult, StageLevel } from "@/lib/dnaEngine";

export type RouteStep = {
  stepNumber: number;
  actionType: "START" | "DIGIVOLVE" | "DNA";
  fromDigimon: string;
  fromStage: StageLevel;
  toDigimon: string;
  toStage: StageLevel;
  currentDp: number;
  fodderFamily?: string;
  fodderLevel?: StageLevel;
  dpRequirement?: string;
  reason: string;
};

export type RouteResult = {
  success: boolean;
  totalSteps: number;
  totalDnaResets: number;
  finalDp: number;
  path: RouteStep[];
  message?: string;
  suggestedGoal?: string;
  warningNotice?: string;
};

function flattenCatalog(data: any): Record<string, any> {
  const flat: Record<string, any> = {};
  for (const groupKey of Object.keys(data)) {
    const group = data[groupKey];
    for (const name of Object.keys(group)) {
      const item = group[name];
      if (!item.family && item.Family) {
        item.family = item.Family;
      }
      flat[name] = item;
    }
  }
  return flat;
}

export const catalog: Record<string, any> = flattenCatalog(rawCatalog);

export const MANDATORY_PREDECESSORS: Record<string, string[]> = {
  "Diaboromon (R)": ["Myotismon"],
  "Diaboromon (M)": ["Okuwamon"],
  "Diaboromon (A)": ["Myotismon", "Okuwamon"],
  "Omnimon (M)": ["MetalGreymon"],
  "Omnimon (R)": ["WereGarurumon"],
  "Omnimon (A)": ["MetalGreymon", "WereGarurumon"],
  "Baihumon (R)": ["Meteormon"],
  "Baihumon (M)": ["SuperStarmon"],
  "Baihumon (A)": ["Meteormon", "SuperStarmon"],
};

export const VARIANT_LABEL_MAP: Record<string, string> = {
  "Diaboromon (R)": "Diaboromon [Catastrophe Cannon Variant]",
  "Diaboromon (M)": "Diaboromon [Paradise Lost Variant]",
  "Diaboromon (A)": "Diaboromon [Multiply Variant]",
  "Omnimon (M)": "Omnimon [Grey Sword Variant]",
  "Omnimon (R)": "Omnimon [Garuru Cannon Variant]",
  "Omnimon (A)": "Omnimon [Ω Heal Variant]",
  "Baihumon (R)": "Baihumon [Seidouhou Variant]",
  "Baihumon (M)": "Baihumon [Tekkosou Variant]",
  "Baihumon (A)": "Baihumon [Kongou Variant]",
};

export function getLegendaryVariants(
  baseGoalName: string,
): Array<{ key: string; label: string }> {
  const clean = baseGoalName.trim().toLowerCase();

  if (clean.includes("diaboromon")) {
    return [
      { key: "Diaboromon (R)", label: "Diaboromon [Catastrophe Cannon]" },
      { key: "Diaboromon (M)", label: "Diaboromon [Paradise Lost]" },
      { key: "Diaboromon (A)", label: "Diaboromon [Multiply]" },
    ];
  }
  if (clean.includes("omnimon")) {
    return [
      { key: "Omnimon (M)", label: "Omnimon [Grey Sword]" },
      { key: "Omnimon (R)", label: "Omnimon [Garuru Cannon]" },
      { key: "Omnimon (A)", label: "Omnimon [Ω Heal]" },
    ];
  }
  if (clean.includes("baihumon")) {
    return [
      { key: "Baihumon (R)", label: "Baihumon [Seidouhou]" },
      { key: "Baihumon (M)", label: "Baihumon [Tekkosou]" },
      { key: "Baihumon (A)", label: "Baihumon [Kongou]" },
    ];
  }

  return [];
}

export function formatStepDigimonName(rawName: string): string {
  if (!rawName) return "";
  const clean = rawName.trim();
  if (VARIANT_LABEL_MAP[clean]) {
    return VARIANT_LABEL_MAP[clean];
  }
  return clean
    .replace(/\s*\((Ultimate|Mega|Champion|Rookie)\)\s*/gi, "")
    .trim();
}

const FAMILIES = [
  "Junk",
  "Insect",
  "Plant",
  "Flying",
  "Spirit",
  "Beast",
  "Dragon",
  "Marine",
];

type SearchState = {
  currentDigimon: string;
  currentDp: number;
  generationPeakStage: StageLevel;
  path: RouteStep[];
};

function resolveCatalogKey(inputName: string): string {
  if (!inputName) return "";
  const clean = inputName.trim();
  if (catalog[clean]) return clean;

  const catalogKeys = Object.keys(catalog);
  const found = catalogKeys.find(
    (k) =>
      k.toLowerCase() === clean.toLowerCase() ||
      k
        .toLowerCase()
        .replace(/\s*\((ultimate|mega|champion|rookie)\)\s*/gi, "") ===
        clean.toLowerCase(),
  );

  return found || clean;
}

function parseDpRange(dpStr?: string): { min: number; max: number } {
  if (!dpStr) return { min: 0, max: 99 };
  const clean = dpStr.trim();
  if (clean.endsWith("+")) {
    const min = parseInt(clean.replace("+", ""), 10);
    return { min: isNaN(min) ? 0 : min, max: 99 };
  }
  const parts = clean.split("-");
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10);
    const max = parseInt(parts[1], 10);
    return { min: isNaN(min) ? 0 : min, max: isNaN(max) ? 99 : max };
  }
  return { min: 0, max: 99 };
}

function analyzeDeadEndDiagnostics(
  startDp: number,
  targetGoal: string,
  targetFodderTier: StageLevel,
  deadEndStates: Array<{ digimon: string; dp: number }>,
): { message: string; suggestedGoal?: string } {
  const targetProfile = catalog[targetGoal];
  if (!targetProfile)
    return { message: "No valid path found matching DP constraints." };

  const potentialPredecessors = Object.keys(catalog)
    .filter((key) => {
      const prof = catalog[key];
      return prof.evolutions?.some(
        (evo: any) => resolveCatalogKey(evo.target) === targetGoal,
      );
    })
    .sort((a, b) => {
      const aSameFam = catalog[a]?.family === targetProfile.family ? 1 : 0;
      const bSameFam = catalog[b]?.family === targetProfile.family ? 1 : 0;
      return bSameFam - aSameFam;
    });

  for (const predKey of potentialPredecessors) {
    const predProfile = catalog[predKey];
    const evoRule = predProfile.evolutions?.find(
      (evo: any) => resolveCatalogKey(evo.target) === targetGoal,
    );

    if (evoRule) {
      const { min: minReqDp, max: maxReqDp } = parseDpRange(evoRule.dp);
      const reachedPredState = deadEndStates.find(
        (s) => resolveCatalogKey(s.digimon) === predKey,
      );

      if (reachedPredState) {
        if (reachedPredState.dp > maxReqDp) {
          const excessDp = reachedPredState.dp - maxReqDp;
          const maxAllowedStartDp = Math.max(0, startDp - excessDp);

          return {
            message: `⚠️ DP Over-Shot: Reached ${formatStepDigimonName(predKey)} at ${reachedPredState.dp} DP, but ${formatStepDigimonName(targetGoal)} requires ${evoRule.dp} DP. Try lowering your starting DP to ${maxAllowedStartDp} DP or fewer.`,
            suggestedGoal: predKey,
          };
        }
        if (reachedPredState.dp < minReqDp) {
          const deficitDp = minReqDp - reachedPredState.dp;
          const minRequiredStartDp = startDp + deficitDp;

          return {
            message: `⚠️ DP Deficit: Reached ${formatStepDigimonName(predKey)} at ${reachedPredState.dp} DP, but ${formatStepDigimonName(targetGoal)} requires ${evoRule.dp} DP. Try increasing your starting DP to ${minRequiredStartDp} DP or more.`,
            suggestedGoal: predKey,
          };
        }
      }
    }
  }

  const divertedMega = deadEndStates.find((s) => {
    const prof = catalog[s.digimon];
    return prof && prof.level === "Mega" && s.digimon !== targetGoal;
  });

  if (divertedMega) {
    const alternativeName = formatStepDigimonName(divertedMega.digimon);
    return {
      message: `⚠️ Branch Diversion: Evolution path led to ${alternativeName} (${divertedMega.dp} DP) instead of ${formatStepDigimonName(targetGoal)} due to family line properties. Would you like to set ${alternativeName} as your goal?`,
      suggestedGoal: divertedMega.digimon,
    };
  }

  return { message: "No valid path found matching DP constraints." };
}

export function findShortestSafeRoute(
  startDigimonRaw: string,
  startDp: number,
  targetGoalRaw: string,
  targetFodderTier: StageLevel = "Champion",
): RouteResult {
  const startDigimon = resolveCatalogKey(startDigimonRaw);
  const targetGoal = resolveCatalogKey(targetGoalRaw);

  const startProfile = catalog[startDigimon];
  const targetProfile = catalog[targetGoal];

  if (!startProfile || !targetProfile) {
    return {
      success: false,
      totalSteps: 0,
      totalDnaResets: 0,
      finalDp: startDp,
      path: [],
      message: `Invalid Digimon catalog lookup: "${startDigimonRaw}" or "${targetGoalRaw}".`,
    };
  }

  // 14+ DP Capping Notice for UI Alert
  const isOverCapped = startDp > 14;
  const effectiveStartDp = Math.min(startDp, 14);
  const warningNotice = isOverCapped
    ? `⚡ Starting DP of ${startDp} exceeds the maximum DP cap (14 DP). All route calculations and final DP outputs are capped at 14+.`
    : undefined;

  const requiredPredecessors = MANDATORY_PREDECESSORS[targetGoal];

  const queue: SearchState[] = [
    {
      currentDigimon: startDigimon,
      currentDp: effectiveStartDp,
      generationPeakStage: startProfile.level,
      path: [],
    },
  ];

  const visited = new Set<string>();
  const deadEndStates: Array<{ digimon: string; dp: number }> = [];

  while (queue.length > 0) {
    const { currentDigimon, currentDp, generationPeakStage, path } =
      queue.shift()!;
    const profile = catalog[currentDigimon];
    if (!profile) continue;

    deadEndStates.push({ digimon: currentDigimon, dp: currentDp });

    const dnaCount = path.filter((s) => s.actionType === "DNA").length;
    const stateKey = `${currentDigimon}-DP${currentDp}`;
    if (visited.has(stateKey)) continue;
    visited.add(stateKey);

    if (currentDigimon === targetGoal) {
      const predecessorSatisfied =
        !requiredPredecessors ||
        requiredPredecessors.some(
          (req) =>
            path.some((s) => s.fromDigimon === req || s.toDigimon === req) ||
            startDigimon === req,
        );

      if (predecessorSatisfied) {
        return {
          success: true,
          totalSteps: path.length,
          totalDnaResets: dnaCount,
          finalDp: currentDp,
          path,
          warningNotice,
        };
      }
    }

    if (path.length >= 60) continue;

    // 1. DNA RESET BRANCH
    // Rule A: Non-Rookie starters reset IMMEDIATELY on Step 1.
    // Rule B: Subsequent resets MUST match the starter's original stage level (Ultimate starter = Ultimate reset).
    // Rule C: Back-to-back resets are forbidden.
    const isStepOne = path.length === 0;
    const isStarterRookie = startProfile.level === "Rookie";
    const targetResetStage = isStarterRookie ? "Champion" : startProfile.level;

    const isAtResetStage = isStepOne
      ? !isStarterRookie
      : profile.level === targetResetStage;

    const lastStepWasDna =
      path.length > 0 && path[path.length - 1].actionType === "DNA";

    const canPerformDnaReset = isAtResetStage && !lastStepWasDna;

    if (canPerformDnaReset) {
      for (const fam of FAMILIES) {
        // Enforce 14 DP ceiling internally
        const nextDp = Math.min(currentDp + 1, 14);

        const candidateFodders = Object.keys(catalog).filter(
          (k) =>
            catalog[k].family === fam && catalog[k].level === targetFodderTier,
        );

        for (const sampleFodderKey of candidateFodders) {
          const dnaRes = getAdvancedDnaResult(currentDigimon, sampleFodderKey);
          const resultDigimon = dnaRes.result;

          if (resultDigimon && catalog[resultDigimon]) {
            const resProfile = catalog[resultDigimon];

            queue.push({
              currentDigimon: resultDigimon,
              currentDp: nextDp,
              generationPeakStage: resProfile.level,
              path: [
                ...path,
                {
                  stepNumber: path.length + 1,
                  actionType: "DNA",
                  fromDigimon: currentDigimon,
                  fromStage: profile.level,
                  toDigimon: resultDigimon,
                  toStage: resProfile.level,
                  currentDp: nextDp,
                  fodderFamily: fam,
                  fodderLevel: targetFodderTier,
                  reason: `DNA Reset #${dnaCount + 1}${nextDp >= 14 ? " (14+ DP Cap)" : ` (+1 DP ➔ ${nextDp} DP)`}`,
                },
              ],
            });
          }
        }
      }
    }

    // 2. NATURAL DIGIVOLUTION BRANCH
    if (profile.evolutions) {
      for (const evo of profile.evolutions) {
        const nextTarget = resolveCatalogKey(evo.target);
        const nextProfile = catalog[nextTarget];

        if (nextProfile) {
          const { min: minDp, max: maxDp } = parseDpRange(evo.dp);

          if (currentDp >= minDp && currentDp <= maxDp) {
            const stageOrder: Record<StageLevel, number> = {
              Rookie: 1,
              Champion: 2,
              Ultimate: 3,
              Mega: 4,
            };
            const nextPeak =
              stageOrder[nextProfile.level as StageLevel] >
              stageOrder[generationPeakStage]
                ? (nextProfile.level as StageLevel)
                : generationPeakStage;

            queue.push({
              currentDigimon: nextTarget,
              currentDp,
              generationPeakStage: nextPeak,
              path: [
                ...path,
                {
                  stepNumber: path.length + 1,
                  actionType: "DIGIVOLVE",
                  fromDigimon: currentDigimon,
                  fromStage: profile.level,
                  toDigimon: nextTarget,
                  toStage: nextProfile.level,
                  currentDp,
                  dpRequirement: evo.dp,
                  reason: `Natural Digivolution (DP ${currentDp >= 14 ? "14+" : currentDp} fits ${evo.dp} bracket)`,
                },
              ],
            });
          }
        }
      }
    }
  }

  const diagnostic = analyzeDeadEndDiagnostics(
    startDp,
    targetGoal,
    targetFodderTier,
    deadEndStates,
  );

  return {
    success: false,
    totalSteps: 0,
    totalDnaResets: 0,
    finalDp: startDp,
    path: [],
    message: diagnostic.message,
    suggestedGoal: diagnostic.suggestedGoal,
    warningNotice,
  };
}
