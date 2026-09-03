import rawCatalogData from "@/data/digimon-catalog.json";
import dnaData from "@/data/dna-table.json";
import domainProgressData from "@/data/domain-progress.json";
import digimonLocations from "@/data/digimon-locations.json";

export type StageLevel = "Rookie" | "Champion" | "Ultimate" | "Mega";
export type AttributeType = "Vaccine" | "Data" | "Virus";

export type DigimonProfile = {
  level: StageLevel;
  type: AttributeType;
  family: string;
  specialty?: string;
  signature_skill?: string;
  extra_skills?: Array<{ skill: string; type: string; locations: string[] }>;
  evolutions?: Array<{ dp: string; target: string }>;
};

export type FodderStatus = "OWNED" | "CATCHABLE" | "UNCATCHABLE";

export type FodderOption = {
  name: string;
  level: StageLevel;
  type: AttributeType;
  family: string;
  status: FodderStatus;
  locations: string[];
};

export type RouteStep = {
  action: "DIGIVOLVE" | "DNA";
  description: string;
  from?: string;
  target: string;
  dpRequired?: string;
  requiredStage?: string;
  requiredFamily?: string;
  validFodders?: FodderOption[];
  elCapWarning?: string;
};

export type EvolutionPathOption = {
  id: string;
  title: string;
  totalSteps: number;
  steps: RouteStep[];
  pathType: "BEST_WAY" | "DIRECT_EVO" | "SAFE_EL_RESET";
  isRecommended?: boolean;
};

export type StrategyPreference = "prioDna" | "prioDirect";

interface DomainProgress {
  name: string;
}

// Master Data Setup
export const DOMAIN_PROGRESS: DomainProgress[] =
  (domainProgressData as any).domains || [];
export const DOMAIN_ORDER: string[] = DOMAIN_PROGRESS.map((d) => d.name);

// Fallback to digimon-locations.json for precise floor data
export const DIGIMON_MAP: Record<string, string[]> =
  (digimonLocations as Record<string, string[]>) ||
  ((domainProgressData as any).digimon_map as Record<string, string[]>);

export const RANK_HIERARCHY: Record<StageLevel, number> = {
  Rookie: 1,
  Champion: 2,
  Ultimate: 3,
  Mega: 4,
};

// ---------------------------------------------------------------------------
// Catalog & Lookup Initialization
// ---------------------------------------------------------------------------

function buildCatalog(): Record<string, DigimonProfile> {
  const flat: Record<string, DigimonProfile> = {};
  const raw = rawCatalogData as Record<string, any>;

  if (raw.Rookies || raw.Champions || raw.Ultimates || raw.Megas) {
    ["Rookies", "Champions", "Ultimates", "Megas"].forEach((stage) => {
      if (raw[stage]) Object.assign(flat, raw[stage]);
    });
  } else {
    Object.assign(flat, raw);
  }

  // Normalize family property casing
  Object.keys(flat).forEach((name) => {
    const item = flat[name] as any;
    if (!item.family && item.Family) {
      item.family = item.Family;
    }
  });

  return flat;
}

export const catalog: Record<string, DigimonProfile> = buildCatalog();

// Fast O(1) Fodder Lookup Index: Stage -> Family -> Array of Catalog Names
const catalogByStageFamily = (() => {
  const map = new Map<string, string[]>();
  Object.entries(catalog).forEach(([name, profile]) => {
    const key = `${profile.level}:${profile.family}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(name);
  });
  return map;
})();

/**
 * Case-insensitive catalog lookup helper with string normalization fallback.
 */
export function getCatalogProfile(
  name: string,
): { key: string; profile: DigimonProfile } | null {
  if (!name) return null;
  if (catalog[name]) return { key: name, profile: catalog[name] };

  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const matchKey = Object.keys(catalog).find(
    (key) => key.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized,
  );

  if (matchKey && catalog[matchKey]) {
    return { key: matchKey, profile: catalog[matchKey] };
  }

  return null;
}

export function isDigimonCatchableInProgress(
  digimonName: string,
  maxDomainIndex: number,
) {
  const allLocations = DIGIMON_MAP[digimonName] || [];
  const validLocations = allLocations.filter((loc) => {
    const domainName = loc.split("(")[0].split("-")[0].trim();
    const domainIdx = DOMAIN_ORDER.indexOf(domainName);
    return domainIdx !== -1 && domainIdx <= maxDomainIndex;
  });
  return { catchable: validLocations.length > 0, validLocations };
}

// ---------------------------------------------------------------------------
// DNA Calculation Engine
// ---------------------------------------------------------------------------

export type AdvancedDnaResult = {
  result: string | null;
  stage: string;
  winningType: AttributeType | null;
  winningParent: string | null;
  reason: string;
  p1Details: {
    name: string;
    level: StageLevel;
    type: AttributeType;
    family: string;
  } | null;
  p2Details: {
    name: string;
    level: StageLevel;
    type: AttributeType;
    family: string;
  } | null;
};

export function getAdvancedDnaResult(
  p1Name: string,
  p2Name: string,
): AdvancedDnaResult {
  const p1Match = getCatalogProfile(p1Name);
  const p2Match = getCatalogProfile(p2Name);

  if (!p1Match || !p2Match) {
    return {
      result: null,
      stage: "Invalid Digimon",
      winningType: null,
      winningParent: null,
      reason: "Select two valid Digimon.",
      p1Details: p1Match
        ? {
            name: p1Match.key,
            level: p1Match.profile.level,
            type: p1Match.profile.type,
            family: p1Match.profile.family,
          }
        : null,
      p2Details: p2Match
        ? {
            name: p2Match.key,
            level: p2Match.profile.level,
            type: p2Match.profile.type,
            family: p2Match.profile.family,
          }
        : null,
    };
  }

  const p1 = p1Match.profile;
  const p2 = p2Match.profile;
  const actualP1Name = p1Match.key;
  const actualP2Name = p2Match.key;

  const p1Details = {
    name: actualP1Name,
    level: p1.level,
    type: p1.type,
    family: p1.family,
  };
  const p2Details = {
    name: actualP2Name,
    level: p2.level,
    type: p2.type,
    family: p2.family,
  };

  if (p1.level === "Rookie" || p2.level === "Rookie") {
    return {
      result: null,
      stage: "Rookies Cannot DNA",
      winningType: null,
      winningParent: null,
      reason: "Rookies must evolve before performing DNA Digivolution.",
      p1Details,
      p2Details,
    };
  }

  // 1. Determine Outcome Stage
  let dnaStage: StageLevel = "Rookie";
  if (p1.level === "Mega" && p2.level === "Mega") {
    dnaStage = "Ultimate";
  } else if (
    (p1.level === "Ultimate" && p2.level === "Ultimate") ||
    (p1.level === "Mega" && p2.level === "Ultimate") ||
    (p1.level === "Ultimate" && p2.level === "Mega")
  ) {
    dnaStage = "Champion";
  } else {
    dnaStage = "Rookie";
  }

  // 2. Attribute Advantage Evaluation
  // Attribute Advantage ONLY determines resulting type (winningType).
  // Parent 1 ALWAYS retains Primary Family position regardless of attribute winner.
  let winningType = p1.type;
  const winningFamily = p1.family; // Always Parent 1
  const secondaryFamily = p2.family; // Always Parent 2
  let winningParent = actualP1Name;
  let reason = "";

  if (p1.type === p2.type) {
    winningType = p1.type;
    winningParent = actualP1Name;
    reason = `Same Attribute (${p1.type}): Offspring inherits ${p1.type}.`;
  } else if (
    (p1.type === "Data" && p2.type === "Vaccine") ||
    (p1.type === "Vaccine" && p2.type === "Virus") ||
    (p1.type === "Virus" && p2.type === "Data")
  ) {
    // Parent 1 wins attribute advantage
    winningType = p1.type;
    winningParent = actualP1Name;
    reason = `Attribute Advantage: ${p1.type} beats ${p2.type} → Offspring is ${p1.type}.`;
  } else {
    // Parent 2 wins attribute advantage
    winningType = p2.type;
    winningParent = actualP2Name;
    reason = `Attribute Advantage: ${p2.type} beats ${p1.type} → Offspring is ${p2.type}.`;
  }

  // 3. DNA Table Outcome Lookup
  const rawResult = (dnaData as any)[dnaStage]?.[winningType]?.[
    winningFamily
  ]?.[secondaryFamily];

  if (rawResult) {
    const cleanResult = rawResult.replace("*", "").trim();
    return {
      result: cleanResult,
      stage: dnaStage,
      winningType,
      winningParent,
      reason,
      p1Details,
      p2Details,
    };
  }

  return {
    result: null,
    stage: dnaStage,
    winningType,
    winningParent,
    reason: "Combination not found in DNA table.",
    p1Details,
    p2Details,
  };
}

// ---------------------------------------------------------------------------
// Skill Search & Special MRA Setup
// ---------------------------------------------------------------------------

export function searchSkills(searchTerm: string) {
  const matches: Array<{
    digimon: string;
    skill: string;
    type: string;
    locations: string[];
  }> = [];
  if (!searchTerm || !searchTerm.trim()) return matches;
  const query = searchTerm.toLowerCase().trim();

  Object.entries(catalog).forEach(([digimonName, profile]) => {
    if (
      profile.signature_skill &&
      profile.signature_skill.toLowerCase().includes(query)
    ) {
      const locs = DIGIMON_MAP[digimonName] || [];
      matches.push({
        digimon: digimonName,
        skill: profile.signature_skill,
        type: "Signature Skill",
        locations:
          locs.length > 0 ? locs : ["DNA Digivolution / Evolution Only"],
      });
    }

    profile.extra_skills?.forEach((item) => {
      if (item.skill.toLowerCase().includes(query)) {
        matches.push({
          digimon: digimonName,
          skill: item.skill,
          type: item.type,
          locations: DIGIMON_MAP[digimonName] || item.locations,
        });
      }
    });
  });
  return matches;
}

export interface SpecialMraTarget {
  moveName: string;
  catalogKey: string;
  dpReq: string;
}

export const SPECIAL_MRA_MAP: Record<string, SpecialMraTarget[]> = {
  Diaboromon: [
    {
      moveName: "Catastrophe Cannon",
      catalogKey: "Diaboromon (R)",
      dpReq: "DP 10-11",
    },
    {
      moveName: "Paradise Lost",
      catalogKey: "Diaboromon (M)",
      dpReq: "DP 10-11",
    },
    { moveName: "Multiply", catalogKey: "Diaboromon (A)", dpReq: "DP 12+" },
  ],
  Omnimon: [
    { moveName: "Grey Sword", catalogKey: "Omnimon (M)", dpReq: "DP 10-11" },
    { moveName: "Garuru Cannon", catalogKey: "Omnimon (R)", dpReq: "DP 10-11" },
    { moveName: "Ω Heal", catalogKey: "Omnimon (A)", dpReq: "DP 12+" },
  ],
  Baihumon: [
    { moveName: "Seidouhou", catalogKey: "Baihumon (R)", dpReq: "DP 10-11" },
    { moveName: "Tekkosou", catalogKey: "Baihumon (M)", dpReq: "DP 10-11" },
    { moveName: "Kongou", catalogKey: "Baihumon (A)", dpReq: "DP 12+" },
  ],
};

// ---------------------------------------------------------------------------
// Pathfinding Engine (Optimized BFS)
// ---------------------------------------------------------------------------

export function findAllEvolutionPaths(
  startName: string,
  targetGoal: string,
  userInventory: string[] = [],
  unlockedDomain: string = DOMAIN_ORDER[0],
  strategy: StrategyPreference = "prioDna",
): EvolutionPathOption[] {
  const startMatch = getCatalogProfile(startName);
  const targetMatch = getCatalogProfile(targetGoal);

  const startKey = startMatch ? startMatch.key : startName;
  const targetKey = targetMatch ? targetMatch.key : targetGoal;

  if (startKey === targetKey) return [];

  const maxDomainIndex = DOMAIN_ORDER.indexOf(unlockedDomain);
  const foundPaths: EvolutionPathOption[] = [];
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
  const stages: StageLevel[] = ["Champion", "Ultimate", "Mega"];

  const queue: Array<{
    current: string;
    path: RouteStep[];
    visitedNodes: Set<string>;
  }> = [{ current: startKey, path: [], visitedNodes: new Set([startKey]) }];

  while (queue.length > 0 && foundPaths.length < 5) {
    const { current, path, visitedNodes } = queue.shift()!;

    if (current === targetKey) {
      const hasDna = path.some((s) => s.action === "DNA");
      foundPaths.push({
        id: `path-${foundPaths.length + 1}`,
        title: hasDna
          ? strategy === "prioDna"
            ? "Optimal DNA Reset Route"
            : "Alternative DNA Route"
          : "Direct Digivolution Route",
        totalSteps: path.length,
        steps: path,
        pathType: hasDna ? "SAFE_EL_RESET" : "DIRECT_EVO",
        isRecommended: foundPaths.length === 0,
      });
      continue;
    }

    const profile = catalog[current];
    if (!profile) continue;

    const pushDirectEvoSteps = () => {
      if (!profile.evolutions) return;

      for (const evo of profile.evolutions) {
        const nextTarget = evo.target.replace("*", "").trim();
        if (!visitedNodes.has(nextTarget) && catalog[nextTarget]) {
          const nextVisited = new Set(visitedNodes);
          nextVisited.add(nextTarget);

          queue.push({
            current: nextTarget,
            path: [
              ...path,
              {
                action: "DIGIVOLVE",
                from: current,
                target: nextTarget,
                dpRequired: evo.dp,
                description: `Digivolve ${current} → ${nextTarget} (DP Req: ${evo.dp})`,
              },
            ],
            visitedNodes: nextVisited,
          });
        }
      }
    };

    const pushDnaResetSteps = () => {
      // Limit DNA reset depth to prevent infinite combinatorial expansion
      if (profile.level === "Rookie" || path.length >= 3) return;

      for (const stageReq of stages) {
        for (const familyReq of families) {
          const candidateNames =
            catalogByStageFamily.get(`${stageReq}:${familyReq}`) || [];

          if (candidateNames.length === 0) continue;

          // Pick the first sample Digimon from pre-indexed candidate list
          const sampleDigimon = candidateNames[0];
          const dnaTest = getAdvancedDnaResult(current, sampleDigimon);

          if (
            dnaTest.result &&
            catalog[dnaTest.result] &&
            !visitedNodes.has(dnaTest.result)
          ) {
            // Build valid fodder options using O(1) catalog candidates
            const validFodderDigimon: FodderOption[] = candidateNames.map(
              (name) => {
                const { catchable, validLocations } =
                  isDigimonCatchableInProgress(name, maxDomainIndex);
                let status: FodderStatus = "UNCATCHABLE";
                if (userInventory.includes(name)) status = "OWNED";
                else if (catchable) status = "CATCHABLE";

                return {
                  name,
                  level: catalog[name].level,
                  type: catalog[name].type,
                  family: catalog[name].family,
                  status,
                  locations: validLocations,
                };
              },
            );

            const nextVisited = new Set(visitedNodes);
            nextVisited.add(dnaTest.result);

            queue.push({
              current: dnaTest.result,
              path: [
                ...path,
                {
                  action: "DNA",
                  from: current,
                  target: dnaTest.result,
                  requiredStage: stageReq,
                  requiredFamily: familyReq,
                  validFodders: validFodderDigimon,
                  description: `DNA ${current} + Any [${stageReq} / ${familyReq} Family] → ${dnaTest.result}`,
                },
              ],
              visitedNodes: nextVisited,
            });
          }
        }
      }
    };

    if (strategy === "prioDirect") {
      pushDirectEvoSteps();
      pushDnaResetSteps();
    } else {
      pushDnaResetSteps();
      pushDirectEvoSteps();
    }
  }

  return foundPaths;
}
