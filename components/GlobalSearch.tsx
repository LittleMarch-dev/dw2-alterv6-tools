"use client";

import { useState, useMemo } from "react";
import catalogData from "@/data/digimon-catalog.json";
import skillData from "@/data/digimon-skill.json";
import locationData from "@/data/digimon-locations.json";
import { formatStepDigimonName } from "@/lib/routeEngine";

interface GlobalSearchProps {
  onSelectDigimon: (name: string) => void;
  onSelectDomain?: (domainName: string) => void;
}

type CategoryFilter = "ALL" | "DIGIMON" | "SKILL" | "DOMAIN";
type StageFilter = "ALL" | "Rookie" | "Champion" | "Ultimate" | "Mega";
type SkillTypeFilter = "ALL" | "Attack" | "Assist" | "Interrupt" | "Counter";

interface DigimonResult {
  name: string;
  level: string;
  type: string;
  family: string;
  signatureSkill: string;
  matchedExtraSkill?: string;
  locations: string[];
}

interface SkillCarrier {
  digimon: string;
  obtain: string;
  stage: string;
}

interface SkillResult {
  name: string;
  skillType: string;
  target: string | null;
  attribute: string | null;
  ap: number | null;
  mp: number | null;
  effect: string | null;
  carriers: SkillCarrier[];
}

interface DomainResult {
  domainName: string;
  digimonList: { name: string; stage: string; type: string }[];
}

const normalizeStage = (stageStr: string): string =>
  stageStr.toLowerCase().replace(/s$/i, "").trim();

export function GlobalSearch({
  onSelectDigimon,
  onSelectDomain,
}: GlobalSearchProps) {
  const [query, setQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");
  const [selectedStage, setSelectedStage] = useState<StageFilter>("ALL");
  const [selectedSkillType, setSelectedSkillType] =
    useState<SkillTypeFilter>("ALL");
  const [selectedDomainModal, setSelectedDomainModal] =
    useState<DomainResult | null>(null);

  // 1. Flatten Digimon profiles
  const allDigimonMap = useMemo(() => {
    const map = new Map<string, { profile: any; stage: string }>();
    Object.entries(catalogData).forEach(([stageKey, speciesGroup]) => {
      const cleanStage = normalizeStage(stageKey);
      Object.entries(speciesGroup as Record<string, any>).forEach(
        ([name, profile]) => {
          map.set(name, { profile, stage: cleanStage });
        },
      );
    });
    return map;
  }, []);

  // 2. Flatten Skills & build Digimon -> Learned Skills lookup map
  const { allSkillsMap, digimonLearnedSkillsMap } = useMemo(() => {
    const skillsMap = new Map<
      string,
      { skillInfo: any; digimonName: string; stage: string }[]
    >();
    const digiSkillsMap = new Map<string, string[]>();

    Object.entries(skillData).forEach(([stageGroupKey, speciesGroup]) => {
      const cleanStage = normalizeStage(stageGroupKey);

      Object.entries(speciesGroup as Record<string, any[]>).forEach(
        ([digimonName, skills]) => {
          const learnedSkillNames: string[] = [];

          skills.forEach((s) => {
            const list = skillsMap.get(s.name) || [];
            list.push({ skillInfo: s, digimonName, stage: cleanStage });
            skillsMap.set(s.name, list);
            learnedSkillNames.push(s.name);
          });

          const existing = digiSkillsMap.get(digimonName) || [];
          digiSkillsMap.set(digimonName, [...existing, ...learnedSkillNames]);
        },
      );
    });

    return { allSkillsMap: skillsMap, digimonLearnedSkillsMap: digiSkillsMap };
  }, []);

  // 3. Extract unique Domain Names
  const allDomains = useMemo(() => {
    const domainSet = new Set<string>();
    Object.values(locationData).forEach((locArray) => {
      locArray.forEach((locStr: string) => {
        const cleanDomain = locStr.replace(/\s*\(Floor.*\)/gi, "").trim();
        if (cleanDomain) domainSet.add(cleanDomain);
      });
    });
    return Array.from(domainSet).sort();
  }, []);

  // 4. Compute Search Results
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filterStageNorm = normalizeStage(selectedStage);

    // A. Filter Digimon
    const digimonResults: DigimonResult[] = [];
    allDigimonMap.forEach(({ profile, stage }, name) => {
      const formatted = formatStepDigimonName(name).toLowerCase();
      const matchesStage = selectedStage === "ALL" || stage === filterStageNorm;

      const sigSkill = profile.signature_skill || "";
      const sigSkillLower = sigSkill.toLowerCase();

      // Clean base name for skill lookup (e.g., "Diaboromon (M)" -> "Diaboromon")
      const cleanLookupName = name.replace(/\s*\([MRA]\)/gi, "").trim();
      const learnedSkills = digimonLearnedSkillsMap.get(cleanLookupName) || [];

      // Find signature skills of sibling variants (e.g., Multiply, Catastrophe Cannon, Paradise Lost)
      const siblingSigSkills = new Set<string>();
      allDigimonMap.forEach(({ profile: siblingProfile }, siblingName) => {
        if (
          siblingName !== name &&
          siblingName
            .replace(/\s*\([MRA]\)/gi, "")
            .trim()
            .toLowerCase() === cleanLookupName.toLowerCase()
        ) {
          if (siblingProfile.signature_skill) {
            siblingSigSkills.add(siblingProfile.signature_skill.toLowerCase());
          }
        }
      });

      // Exclude skills that belong to other variant signature slots
      const matchedSkill = q
        ? learnedSkills.find((sName) => {
            const sLower = sName.toLowerCase();
            return (
              sLower.includes(q) &&
              sLower !== sigSkillLower &&
              !siblingSigSkills.has(sLower)
            );
          })
        : undefined;

      const matchesQuery =
        !q ||
        name.toLowerCase().includes(q) ||
        formatted.includes(q) ||
        profile.type.toLowerCase().includes(q) ||
        profile.family.toLowerCase().includes(q) ||
        sigSkillLower.includes(q) ||
        Boolean(matchedSkill);

      if (matchesQuery && matchesStage) {
        digimonResults.push({
          name,
          level: profile.level,
          type: profile.type,
          family: profile.family,
          signatureSkill: profile.signature_skill,
          matchedExtraSkill: matchedSkill,
          locations: (locationData as Record<string, string[]>)[name] || [],
        });
      }
    });

    // B. Filter Skills
    const skillResults: SkillResult[] = [];
    allSkillsMap.forEach((instances, skillName) => {
      const first = instances[0]?.skillInfo;
      const skillType = first?.Type || "Attack";
      const effectText = (first?.Effect || first?.effect || "").toLowerCase();

      const matchesType =
        selectedSkillType === "ALL" ||
        skillType.toLowerCase() === selectedSkillType.toLowerCase();

      const matchesStage =
        selectedStage === "ALL" ||
        instances.some((inst) => inst.stage === filterStageNorm);

      const matchesQuery =
        !q ||
        skillName.toLowerCase().includes(q) ||
        skillType.toLowerCase().includes(q) ||
        (first?.attribute && first.attribute.toLowerCase().includes(q)) ||
        effectText.includes(q);

      if (matchesQuery && matchesType && matchesStage) {
        const carriers: SkillCarrier[] = instances.map((inst) => ({
          digimon: inst.digimonName,
          obtain: inst.skillInfo.Obtain || "Unknown",
          stage: inst.stage,
        }));

        skillResults.push({
          name: skillName,
          skillType,
          target: first.target || null,
          attribute: first.attribute || null,
          ap: first.AP,
          mp: first.MP,
          effect: first.Effect || first.effect || null,
          carriers,
        });
      }
    });

    // C. Filter Domains
    const domainResults: DomainResult[] = [];
    allDomains.forEach((domainName) => {
      const matchesQuery = !q || domainName.toLowerCase().includes(q);

      if (matchesQuery) {
        const digimonList: { name: string; stage: string; type: string }[] = [];

        Object.entries(locationData).forEach(([digi, locs]) => {
          if (locs.some((l) => l.startsWith(domainName))) {
            const digiMeta = allDigimonMap.get(digi);
            const digiStage = digiMeta?.stage || "Unknown";

            if (selectedStage === "ALL" || digiStage === filterStageNorm) {
              digimonList.push({
                name: digi,
                stage: digiStage,
                type: digiMeta?.profile?.type || "Unknown",
              });
            }
          }
        });

        if (digimonList.length > 0) {
          domainResults.push({
            domainName,
            digimonList,
          });
        }
      }
    });

    return { digimonResults, skillResults, domainResults };
  }, [
    query,
    selectedStage,
    selectedSkillType,
    allDigimonMap,
    allSkillsMap,
    digimonLearnedSkillsMap,
    allDomains,
  ]);

  const hasActiveFilters =
    query.trim().length > 0 ||
    selectedStage !== "ALL" ||
    selectedSkillType !== "ALL";

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Digimon, Skill, Effect (e.g. confusion, paralysis), or Domain..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:border-amber-500/50"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 border-t border-slate-800/80 pt-2.5 overflow-x-auto text-[10px] font-bold">
          {(
            [
              { id: "ALL", label: "All Results" },
              { id: "DIGIMON", label: "👾 Digimon" },
              { id: "SKILL", label: "⚔️ Skills" },
              { id: "DOMAIN", label: "🏰 Domains" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategory(tab.id);
                if (tab.id !== "SKILL") setSelectedSkillType("ALL");
              }}
              className={`px-3 py-1 rounded-lg border transition-colors shrink-0 ${
                activeCategory === tab.id
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 border-t border-slate-800/80 pt-2.5">
          {/* Stage Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
              Digimon Stage:
            </label>
            <div className="flex gap-1 overflow-x-auto text-[9px]">
              {(["ALL", "Rookie", "Champion", "Ultimate", "Mega"] as const).map(
                (stage) => (
                  <button
                    key={stage}
                    onClick={() => setSelectedStage(stage)}
                    className={`px-2 py-0.5 rounded-md border font-semibold shrink-0 transition-colors ${
                      selectedStage === stage
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {stage}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Skill Move Type Filter */}
          {(activeCategory === "SKILL" || activeCategory === "ALL") && (
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                Skill Move Type:
              </label>
              <div className="flex gap-1 overflow-x-auto text-[9px]">
                {(
                  ["ALL", "Attack", "Assist", "Interrupt", "Counter"] as const
                ).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedSkillType(type)}
                    className={`px-2 py-0.5 rounded-md border font-semibold shrink-0 transition-colors ${
                      selectedSkillType === type
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Display */}
      {!hasActiveFilters ? (
        <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl text-center space-y-1">
          <p className="text-xs font-bold text-slate-400">
            Type a query or select a Stage/Skill filter above to search
          </p>
          <p className="text-[10px] text-slate-500">
            Filter by Rookie, Champion, Ultimate, or Mega stages.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* 👾 DIGIMON SECTION */}
          {(activeCategory === "ALL" || activeCategory === "DIGIMON") &&
            searchResults.digimonResults.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  👾 Digimon ({searchResults.digimonResults.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.digimonResults.map((digi, idx) => {
                    const formattedName = formatStepDigimonName(digi.name);

                    return (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-amber-300">
                              {formattedName}
                            </h4>
                            <span className="text-[9px] text-slate-400">
                              {digi.level} • {digi.type} • {digi.family}
                            </span>
                          </div>
                          <button
                            onClick={() => onSelectDigimon(digi.name)}
                            className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded hover:bg-slate-700 transition-colors"
                          >
                            Info
                          </button>
                        </div>

                        {/* Signature Skill Badge */}
                        <div className="text-[10px] text-slate-300 flex items-center gap-1">
                          <span>⚡ Signature:</span>
                          <span className="font-semibold text-emerald-400">
                            {digi.signatureSkill}
                          </span>
                        </div>

                        {/* Matched Extra Skill Badge */}
                        {digi.matchedExtraSkill && (
                          <div className="text-[10px] text-slate-300 bg-amber-500/10 border border-amber-500/30 p-1.5 rounded-lg flex items-center gap-1">
                            <span>💡 Matches Learned Skill:</span>
                            <span className="font-semibold text-amber-300">
                              {digi.matchedExtraSkill}
                            </span>
                          </div>
                        )}

                        {digi.locations.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {digi.locations.slice(0, 3).map((loc, lIdx) => (
                              <span
                                key={lIdx}
                                className="bg-slate-900 text-slate-400 border border-slate-800 text-[9px] px-1.5 py-0.5 rounded"
                              >
                                {loc}
                              </span>
                            ))}
                            {digi.locations.length > 3 && (
                              <span className="text-[9px] text-slate-500 px-1 py-0.5">
                                +{digi.locations.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* ⚔️ SKILL SECTION */}
          {(activeCategory === "ALL" || activeCategory === "SKILL") &&
            searchResults.skillResults.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  ⚔️ Skills & Moves ({searchResults.skillResults.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.skillResults.map((skill, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-amber-300">
                            {skill.name}
                          </h4>
                          <span className="text-[9px] text-slate-400">
                            {skill.skillType}{" "}
                            {skill.attribute ? `• ${skill.attribute}` : ""}
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-300 font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                          {skill.ap ? `${skill.ap} AP` : ""}{" "}
                          {skill.mp ? `${skill.mp} MP` : ""}
                        </div>
                      </div>

                      {skill.effect && (
                        <p className="text-[10px] text-slate-300 italic bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                          "{skill.effect}"
                        </p>
                      )}

                      <div className="space-y-1 border-t border-slate-800/60 pt-1.5">
                        <span className="text-[9px] text-slate-500 font-bold block uppercase">
                          Carried By:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {skill.carriers.map((c, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => onSelectDigimon(c.digimon)}
                              className="bg-slate-900 text-slate-300 hover:text-amber-300 border border-slate-800 text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors"
                            >
                              <span>{formatStepDigimonName(c.digimon)}</span>
                              <span className="text-[8px] text-slate-500">
                                ({c.obtain})
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* 🏰 DOMAIN SECTION */}
          {(activeCategory === "ALL" || activeCategory === "DOMAIN") &&
            searchResults.domainResults.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  🏰 Domains ({searchResults.domainResults.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.domainResults.map((dom, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-3 text-xs flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                          <h4 className="font-extrabold text-amber-300 text-sm">
                            🏰 {dom.domainName}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                            {dom.digimonList.length} Species
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {dom.digimonList.slice(0, 4).map((d, dIdx) => (
                            <span
                              key={dIdx}
                              className="bg-slate-900 text-slate-300 border border-slate-800 text-[9px] px-2 py-0.5 rounded-lg"
                            >
                              {formatStepDigimonName(d.name)}
                            </span>
                          ))}
                          {dom.digimonList.length > 4 && (
                            <span className="text-[9px] text-amber-400/80 px-1 py-0.5 font-bold">
                              +{dom.digimonList.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedDomainModal(dom)}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 font-bold py-1.5 rounded-xl text-[10px] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span>View Encounters</span>
                          <span className="text-[9px]">➔</span>
                        </button>
                        {onSelectDomain && (
                          <button
                            onClick={() => onSelectDomain(dom.domainName)}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-colors"
                          >
                            Set Progress
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* DOMAIN ENCOUNTERS MODAL */}
      {selectedDomainModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border-t sm:border border-amber-500/30 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                  Domain Encounters
                </span>
                <h3 className="text-base font-black text-slate-100 flex items-center gap-1.5">
                  🏰 {selectedDomainModal.domainName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDomainModal(null)}
                className="bg-slate-800 text-slate-300 hover:text-white font-bold h-7 w-7 rounded-full flex items-center justify-center text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                All Wild Encounters ({selectedDomainModal.digimonList.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedDomainModal.digimonList.map((d, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-200 block">
                        {formatStepDigimonName(d.name)}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {d.stage} • {d.type}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDomainModal(null);
                        onSelectDigimon(d.name);
                      }}
                      className="text-[9px] bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 px-2 py-1 rounded-lg font-bold transition-colors"
                    >
                      Info
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
