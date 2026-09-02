import { catalog, getAdvancedDnaResult, StageLevel } from "@/lib/dnaEngine";

export type StrategyPreference = "prioDna" | "prioDirect";

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
};

// Mandatory Predecessor Map matching catalog DP evolution branches
const MANDATORY_PREDECESSORS: Record<string, string[]> = {
  "Diaboromon (R)": ["Myotismon"], // Catastrophe Cannon (DP 10-11)
  "Diaboromon (M)": ["Okuwamon"], // Paradise Lost (DP 10-11)
  "Diaboromon (A)": ["Myotismon", "Okuwamon"], // Multiply (DP 12+)

  "Omnimon (M)": ["MetalGreymon"], // Grey Sword (DP 10-11)
  "Omnimon (R)": ["WereGarurumon"], // Garuru Cannon (DP 9-11)
  "Omnimon (A)": ["MetalGreymon", "WereGarurumon"], // Ω Heal (DP 12+)

  "Baihumon (R)": ["Meteormon"], // Seidouhou (DP 10-11)
  "Baihumon (M)": ["SuperStarmon"], // Tekkosou (DP 10-11)
  "Baihumon (A)": ["Meteormon", "SuperStarmon"], // Kongou (DP 12+)
};

// Maps raw variant catalog keys to human-readable move names for UI display
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
  highestAchievedStage: StageLevel;
  path: RouteStep[];
};

function cleanKey(inputName: string): string {
  if (!inputName) return "";
  return inputName
    .replace(/\s*\((Ultimate|Mega|Champion|Rookie)\)\s*/gi, "")
    .trim();
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

function getHigherStage(stageA: StageLevel, stageB: StageLevel): StageLevel {
  const order: Record<StageLevel, number> = {
    Rookie: 1,
    Champion: 2,
    Ultimate: 3,
    Mega: 4,
  };
  return order[stageA] >= order[stageB] ? stageA : stageB;
}

export function findShortestSafeRoute(
  startDigimonRaw: string,
  startDp: number,
  targetGoalRaw: string,
  targetFodderTier: StageLevel = "Champion",
): RouteResult {
  const startDigimon = cleanKey(startDigimonRaw);
  const targetGoal = cleanKey(targetGoalRaw);

  const startProfile = catalog[startDigimon];
  const targetProfile = catalog[targetGoal];

  if (!startProfile || !targetProfile) {
    return {
      success: false,
      totalSteps: 0,
      totalDnaResets: 0,
      finalDp: startDp,
      path: [],
      message: `Invalid Digimon key lookup: "${startDigimonRaw}" or "${targetGoalRaw}".`,
    };
  }

  const requiredPredecessors = MANDATORY_PREDECESSORS[targetGoal];

  const queue: SearchState[] = [
    {
      currentDigimon: startDigimon,
      currentDp: startDp,
      highestAchievedStage: startProfile.level,
      path: [],
    },
  ];

  const visited = new Set<string>();

  while (queue.length > 0) {
    const { currentDigimon, currentDp, highestAchievedStage, path } =
      queue.shift()!;
    const profile = catalog[currentDigimon];
    if (!profile) continue;

    const stateKey = `${currentDigimon}-DP${currentDp}-${highestAchievedStage}`;
    if (visited.has(stateKey)) continue;
    visited.add(stateKey);

    // Goal Reach Validation (Enforces mandatory predecessor evolution checks)
    if (currentDigimon === targetGoal) {
      const predecessorSatisfied =
        !requiredPredecessors ||
        requiredPredecessors.some(
          (req) =>
            path.some((s) => s.fromDigimon === req || s.toDigimon === req) ||
            startDigimon === req,
        );

      if (predecessorSatisfied) {
        const dnaCount = path.filter((s) => s.actionType === "DNA").length;
        return {
          success: true,
          totalSteps: path.length,
          totalDnaResets: dnaCount,
          finalDp: currentDp,
          path,
        };
      }
    }

    if (path.length >= 14) continue;

    // --- 1. Natural Digivolution Branch ---
    if (profile.evolutions) {
      for (const evo of profile.evolutions) {
        const nextTarget = cleanKey(evo.target);
        const nextProfile = catalog[nextTarget];

        if (nextProfile) {
          const { min: minDp, max: maxDp } = parseDpRange(evo.dp);

          if (currentDp >= minDp && currentDp <= maxDp) {
            const nextHighestStage = getHigherStage(
              highestAchievedStage,
              nextProfile.level,
            );

            queue.push({
              currentDigimon: nextTarget,
              currentDp,
              highestAchievedStage: nextHighestStage,
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
                  reason: `Natural Digivolution (DP ${currentDp} fits ${evo.dp} bracket)`,
                },
              ],
            });
          }
        }
      }
    }

    // --- 2. DNA Reset Branch ---
    // Rule: Must re-digivolve back to highestAchievedStage before performing another DNA reset!
    const canPerformDnaReset = profile.level === highestAchievedStage;

    if (canPerformDnaReset && currentDp < 15) {
      for (const fam of FAMILIES) {
        const nextDp = currentDp + 1;

        // Fetch sample fodder matching the exact stage selected from the UI tab
        const sampleFodderKey = Object.keys(catalog).find(
          (k) =>
            catalog[k].family === fam && catalog[k].level === targetFodderTier,
        );

        if (sampleFodderKey) {
          const dnaRes = getAdvancedDnaResult(currentDigimon, sampleFodderKey);
          const resultDigimon = dnaRes.result;

          if (resultDigimon && catalog[resultDigimon]) {
            const resProfile = catalog[resultDigimon];

            queue.push({
              currentDigimon: resultDigimon,
              currentDp: nextDp,
              highestAchievedStage, // Preserve high stage requirement for subsequent resets
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
                  reason: `Stage-Preserved DNA Reset (+1 DP Gain ➔ ${nextDp} DP total using ${targetFodderTier} Fodder)`,
                },
              ],
            });
          }
        }
      }
    }
  }

  return {
    success: false,
    totalSteps: 0,
    totalDnaResets: 0,
    finalDp: startDp,
    path: [],
    message: "No safe route found matching DP constraints.",
  };
}
