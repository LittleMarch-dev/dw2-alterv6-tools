import rawCatalogData from "@/data/digimon-catalog.json";
import dnaData from "@/data/dna-table.json";
import domainProgressData from "@/data/domain-progress.json";

export type DigimonProfile = {
  level: "Rookie" | "Champion" | "Ultimate" | "Mega";
  type: "Vaccine" | "Data" | "Virus";
  family: string;
  specialty?: string;
  signature_skill?: string;
  extra_skills?: Array<{ skill: string; type: string; locations: string[] }>;
  evolutions?: Array<{ dp: string; target: string }>;
};

export type FodderStatus = "OWNED" | "CATCHABLE" | "UNCATCHABLE";

export type FodderOption = {
  name: string;
  level: string;
  type: string;
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

export const DOMAIN_PROGRESS = domainProgressData.domains;
export const DOMAIN_ORDER = DOMAIN_PROGRESS.map((d) => d.name);
export const DIGIMON_MAP = domainProgressData.digimon_map as Record<
  string,
  string[]
>;

export type StrategyPreference = "prioDna" | "prioDirect";

export function getFlatCatalog(): Record<string, DigimonProfile> {
  const flat: Record<string, any> = {};
  const raw = rawCatalogData as any;
  if (raw.Rookies || raw.Champions || raw.Ultimates || raw.Megas) {
    ["Rookies", "Champions", "Ultimates", "Megas"].forEach((stage) => {
      if (raw[stage]) Object.assign(flat, raw[stage]);
    });
  } else {
    Object.assign(flat, raw);
  }
  Object.keys(flat).forEach((name) => {
    if (!flat[name].family && flat[name].Family)
      flat[name].family = flat[name].Family;
  });
  return flat;
}

export const catalog = getFlatCatalog();

export function isDigimonCatchableInProgress(
  digimonName: string,
  maxDomainIndex: number,
) {
  const allLocations = DIGIMON_MAP[digimonName] || [];
  const validLocations = allLocations.filter((loc) => {
    const domainIdx = DOMAIN_ORDER.indexOf(loc);
    return domainIdx !== -1 && domainIdx <= maxDomainIndex;
  });
  return { catchable: validLocations.length > 0, validLocations };
}

export type AdvancedDnaResult = {
  result: string | null;
  stage: string;
  winningType: "Vaccine" | "Data" | "Virus" | null;
  winningParent: string | null;
  reason: string;
  p1Details: {
    name: string;
    level: string;
    type: string;
    family: string;
  } | null;
  p2Details: {
    name: string;
    level: string;
    type: string;
    family: string;
  } | null;
};

export function getAdvancedDnaResult(
  p1Name: string,
  p2Name: string,
): AdvancedDnaResult {
  const p1 = catalog[p1Name];
  const p2 = catalog[p2Name];

  if (!p1 || !p2) {
    return {
      result: null,
      stage: "Invalid Digimon",
      winningType: null,
      winningParent: null,
      reason: "Select two valid Digimon.",
      p1Details: null,
      p2Details: null,
    };
  }

  const p1Details = {
    name: p1Name,
    level: p1.level,
    type: p1.type,
    family: p1.family,
  };
  const p2Details = {
    name: p2Name,
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

  // 1. Determine Stage Outcome
  let dnaStage = "Rookie";
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

  // Rank Scale
  const levelRanks: Record<string, number> = {
    Champion: 1,
    Ultimate: 2,
    Mega: 3,
  };
  const p1Rank = levelRanks[p1.level] || 0;
  const p2Rank = levelRanks[p2.level] || 0;

  let winningType = p1.type;
  let winningFamily = p1.family;
  let secondaryFamily = p2.family;
  let winningParent = p1Name;
  let reason = "";

  // 2. DNA Priority Rule Resolution
  if (p1Rank > p2Rank) {
    // Parent 1 Higher Rank: Parent 1 completely overrides Attribute & Primary Family!
    winningType = p1.type;
    winningFamily = p1.family;
    secondaryFamily = p2.family;
    winningParent = p1Name;
    reason = `Rank Dominance: ${p1Name} (${p1.level}) > ${p2Name} (${p2.level}). Lower rank prevents attribute advantage. ${p1Name} controls Attribute (${p1.type}) & Primary Family (${p1.family}).`;
  } else {
    // Parent 1 Equal or Lower Rank: Evaluate Attribute Advantage (Data > Vaccine > Virus > Data)
    if (p1.type === p2.type) {
      winningType = p1.type;
      winningFamily = p1.family;
      secondaryFamily = p2.family;
      winningParent = p1Name;
      reason = `Same Attribute (${p1.type}): ${p1Name} takes priority.`;
    } else if (
      (p1.type === "Data" && p2.type === "Vaccine") ||
      (p1.type === "Vaccine" && p2.type === "Virus") ||
      (p1.type === "Virus" && p2.type === "Data")
    ) {
      winningType = p1.type;
      winningFamily = p1.family;
      secondaryFamily = p2.family;
      winningParent = p1Name;
      reason = `Attribute Advantage: ${p1.type} beats ${p2.type} (${p1Name} Wins Primary Family).`;
    } else {
      winningType = p2.type;
      winningFamily = p1.family; // Parent 1 stays Primary Family, but P2 Attribute wins
      secondaryFamily = p2.family;
      winningParent = p2Name;
      reason = `Attribute Advantage: ${p2.type} beats ${p1.type} (${p2Name} Attribute Wins).`;
    }
  }

  // 3. DNA Table Lookup
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
          locations: item.locations,
        });
      }
    });
  });
  return matches;
}

export function findAllEvolutionPaths(
  startName: string,
  targetGoal: string,
  userInventory: string[] = [],
  unlockedDomain: string = DOMAIN_ORDER[0],
  strategy: StrategyPreference = "prioDna",
): EvolutionPathOption[] {
  if (startName === targetGoal) return [];

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
  const stages = ["Champion", "Ultimate", "Mega"];

  const queue: Array<{
    current: string;
    path: RouteStep[];
    visitedNodes: Set<string>;
  }> = [{ current: startName, path: [], visitedNodes: new Set([startName]) }];

  while (queue.length > 0 && foundPaths.length < 5) {
    const { current, path, visitedNodes } = queue.shift()!;

    if (current === targetGoal) {
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

    // Helper functions for queued options
    const pushDirectEvoSteps = () => {
      if (profile.evolutions) {
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
      }
    };

    const pushDnaResetSteps = () => {
      if (profile.level !== "Rookie" && path.length < 3) {
        for (const stageReq of stages) {
          for (const familyReq of families) {
            const sampleDigimon = Object.keys(catalog).find(
              (name) =>
                catalog[name].level === stageReq &&
                catalog[name].family === familyReq,
            );

            if (!sampleDigimon) continue;

            const dnaTest = getAdvancedDnaResult(current, sampleDigimon);
            if (
              dnaTest.result &&
              catalog[dnaTest.result] &&
              !visitedNodes.has(dnaTest.result)
            ) {
              const validFodderDigimon: FodderOption[] = Object.keys(catalog)
                .filter(
                  (name) =>
                    catalog[name].level === stageReq &&
                    catalog[name].family === familyReq,
                )
                .map((name) => {
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
                });

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
      }
    };

    // Evaluate order based on strategy preference
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
