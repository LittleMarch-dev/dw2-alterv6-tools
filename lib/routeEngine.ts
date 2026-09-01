import { catalog, getAdvancedDnaResult, StageLevel } from "@/lib/dnaEngine";

export type RouteStep = {
  stepNumber: number;
  actionType: "START" | "DIGIVOLVE" | "DNA";
  fromDigimon: string;
  fromStage: StageLevel;
  toDigimon: string;
  toStage: StageLevel;
  currentDp: number;
  fodderFamily?: string;
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

// Legendary Predecessor Map matching catalog DP branches
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
  dnaLocked: boolean;
  path: RouteStep[];
};

// Strip stage labels like (Ultimate) while preserving variant tags like (R), (M), (A)
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

export function findShortestSafeRoute(
  startDigimonRaw: string,
  startDp: number,
  targetGoalRaw: string,
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
      dnaLocked: false,
      path: [],
    },
  ];

  const visited = new Set<string>();

  while (queue.length > 0) {
    const { currentDigimon, currentDp, dnaLocked, path } = queue.shift()!;
    const profile = catalog[currentDigimon];
    if (!profile) continue;

    const stateKey = `${currentDigimon}-DP${currentDp}-${dnaLocked}`;
    if (visited.has(stateKey)) continue;
    visited.add(stateKey);

    // Goal Reach Validation
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

    if (path.length >= 12) continue;

    // --- 1. Natural Digivolution Branch (Strict DP Bounds Check) ---
    if (profile.evolutions) {
      for (const evo of profile.evolutions) {
        const nextTarget = cleanKey(evo.target);
        const nextProfile = catalog[nextTarget];

        if (nextProfile) {
          const { min: minDp, max: maxDp } = parseDpRange(evo.dp);

          if (currentDp >= minDp && currentDp <= maxDp) {
            const isUltimateOrHigher =
              nextProfile.level === "Ultimate" || nextProfile.level === "Mega";
            const nextDnaLocked = isUltimateOrHigher ? false : dnaLocked;

            queue.push({
              currentDigimon: nextTarget,
              currentDp,
              dnaLocked: nextDnaLocked,
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

    // --- 2. DNA Reset Branch (DP Accumulation Loop + Skill Guardrail) ---
    if (!dnaLocked && currentDp < 15) {
      for (const fam of FAMILIES) {
        const nextDp = currentDp + 1;

        const sampleFodder =
          Object.keys(catalog).find(
            (k) => catalog[k].family === fam && catalog[k].level === "Champion",
          ) || "Greymon";

        const dnaRes = getAdvancedDnaResult(currentDigimon, sampleFodder);
        const resultDigimon = dnaRes.result;

        if (resultDigimon && catalog[resultDigimon]) {
          const resProfile = catalog[resultDigimon];
          const isLowStage =
            resProfile.level === "Champion" || resProfile.level === "Rookie";

          queue.push({
            currentDigimon: resultDigimon,
            currentDp: nextDp,
            dnaLocked: isLowStage,
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
                reason: `DNA Reset (+1 DP Gain ➔ ${nextDp} DP total)`,
              },
            ],
          });
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
