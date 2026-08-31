"use client";

import { useState, useMemo, useEffect } from "react";
import {
  catalog,
  findAllEvolutionPaths,
  searchSkills,
  getAdvancedDnaResult,
  DOMAIN_ORDER,
  DIGIMON_MAP,
  RouteStep,
  EvolutionPathOption,
  StrategyPreference,
} from "@/lib/dnaEngine";
import dnaData from "@/data/dna-table.json";
import { InteractiveTutorialModal } from "@/components/InteractiveTutorial";

// Tailored Dropdown Component
function DomainDropdown({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedIndex = options.indexOf(selected) + 1;

  return (
    <div className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-xl w-full sm:w-auto transition-colors"
      >
        <span className="truncate">
          {selectedIndex > 0 ? `${selectedIndex}. ${selected}` : selected}
        </span>
        <span className="text-slate-500 text-[10px]">▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 z-50 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1">
            {options.map((domain, idx) => (
              <button
                key={domain}
                type="button"
                onClick={() => {
                  onSelect(domain);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2 ${
                  selected === domain
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-[10px] opacity-60 font-mono">
                  {idx + 1}.
                </span>
                <span className="truncate">{domain}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Compact Autocomplete Component
function AutocompleteInput({
  label,
  value,
  onChange,
  options,
  placeholder = "Type to search...",
}: {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options.slice(0, 8);
    return options
      .filter((opt) => opt.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);
  }, [query, options]);

  return (
    <div className="relative space-y-1 w-full">
      {label && (
        <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
          {label}
        </label>
      )}
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
          {filteredOptions.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setQuery(opt);
                setIsOpen(false);
              }}
              className="px-3 py-2 text-xs text-slate-200 hover:bg-amber-500 hover:text-slate-950 cursor-pointer transition-colors flex justify-between"
            >
              <span className="font-semibold">{opt}</span>
              {catalog[opt] && (
                <span className="text-slate-400 text-[10px]">
                  ({catalog[opt].level} / {catalog[opt].type})
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DW2App() {
  const [activeTab, setActiveTab] = useState<
    "calculator" | "routes" | "skills" | "inventory"
  >("calculator");

  const allDigimonNames = useMemo(() => Object.keys(catalog).sort(), []);

  const availableSkills = useMemo(() => {
    const skillSet = new Set<string>();
    Object.values(catalog).forEach((profile) => {
      if (profile.signature_skill) skillSet.add(profile.signature_skill);
      profile.extra_skills?.forEach((item) => skillSet.add(item.skill));
    });
    return Array.from(skillSet).sort();
  }, []);

  // Calculator State
  const [quickParent1, setQuickParent1] = useState<string>("Greymon");
  const [quickParent2, setQuickParent2] = useState<string>("Leomon");
  const dnaDetails = useMemo(
    () => getAdvancedDnaResult(quickParent1, quickParent2),
    [quickParent1, quickParent2],
  );

  // General App State
  const [unlockedDomain, setUnlockedDomain] = useState<string>(DOMAIN_ORDER[0]);
  const [userInventory, setUserInventory] = useState<string[]>([]);
  const [inventoryInput, setInventoryInput] = useState<string>("");

  // Route Planner State
  const [evoStart, setEvoStart] = useState<string>("Myotismon");
  const [evoGoal, setEvoGoal] = useState<string>("B-Garurumon");
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);
  const [strategy, setStrategy] = useState<StrategyPreference>("prioDna");

  // Skill Planner State
  const [selectedSkill, setSelectedSkill] = useState<string>("Mega Heal");

  // Modal States
  const [modalDigimon, setModalDigimon] = useState<string | null>(null);
  const [showMatrixModal, setShowMatrixModal] = useState<boolean>(false);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);
  const [matrixStage, setMatrixStage] = useState<
    "Rookie" | "Champion" | "Ultimate"
  >("Rookie");
  const [matrixType, setMatrixType] = useState<"Vaccine" | "Data" | "Virus">(
    "Vaccine",
  );

  // LocalStorage
  useEffect(() => {
    const savedDomain = localStorage.getItem("dw2_unlocked_domain");
    const savedInv = localStorage.getItem("dw2_user_inventory");
    const savedStart = localStorage.getItem("dw2_evo_start");
    const savedGoal = localStorage.getItem("dw2_evo_goal");
    const savedSkill = localStorage.getItem("dw2_selected_skill");

    if (savedDomain) setUnlockedDomain(savedDomain);
    if (savedInv) setUserInventory(JSON.parse(savedInv));
    if (savedStart) setEvoStart(savedStart);
    if (savedGoal) setEvoGoal(savedGoal);
    if (savedSkill) setSelectedSkill(savedSkill);
  }, []);

  const updateDomain = (domain: string) => {
    setUnlockedDomain(domain);
    localStorage.setItem("dw2_unlocked_domain", domain);
  };

  const handleAddInventory = (name: string) => {
    if (name && !userInventory.includes(name) && catalog[name]) {
      const updated = [...userInventory, name];
      setUserInventory(updated);
      localStorage.setItem("dw2_user_inventory", JSON.stringify(updated));
    }
  };

  const handleRemoveInventory = (name: string) => {
    const updated = userInventory.filter((item) => item !== name);
    setUserInventory(updated);
    localStorage.setItem("dw2_user_inventory", JSON.stringify(updated));
  };

  const evoRouteOptions = useMemo(
    () =>
      findAllEvolutionPaths(
        evoStart,
        evoGoal,
        userInventory,
        unlockedDomain,
        strategy,
      ),
    [evoStart, evoGoal, userInventory, unlockedDomain, strategy],
  );

  const activeRoute = evoRouteOptions[selectedRouteIdx] || evoRouteOptions[0];
  const skillDropSources = useMemo(
    () => searchSkills(selectedSkill),
    [selectedSkill],
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Compact Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
              Digimon World 2 Pathfinder
            </h1>
            <p className="text-slate-400 text-xs">
              Alternative V6 Mod DNA & Route Tools
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <button
              onClick={() => setShowTutorialModal(true)}
              className="bg-slate-950 border border-slate-800 text-amber-300 hover:border-amber-400 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
            >
              📖 How to Use
            </button>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl w-full sm:w-auto">
              <span className="text-[10px] font-bold text-amber-400 uppercase whitespace-nowrap">
                Progress:
              </span>
              <DomainDropdown
                options={DOMAIN_ORDER}
                selected={unlockedDomain}
                onSelect={updateDomain}
              />
            </div>
          </div>
        </header>

        {/* Navigation Bar */}
        <nav className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab("calculator")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
              activeTab === "calculator"
                ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            🧪 DNA Calculator
          </button>
          <button
            id="tutorial-routes-tab"
            onClick={() => setActiveTab("routes")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
              activeTab === "routes"
                ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            🗺️ Route Finder
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
              activeTab === "skills"
                ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            🎯 Move Search
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
              activeTab === "inventory"
                ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            📦 Owned Pool ({userInventory.length})
          </button>
        </nav>

        {/* TAB 1: DETAILED DNA CALCULATOR */}
        {activeTab === "calculator" && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Detailed DNA Simulator
                </h2>
                <p className="text-[11px] text-slate-400">
                  Calculates rank dominance, attribute advantage, and family
                  outcomes.
                </p>
              </div>

              <button
                onClick={() => setShowMatrixModal(true)}
                className="bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
              >
                📊 View DNA Family Matrix
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                id="tutorial-parent1-input"
                className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3"
              >
                <AutocompleteInput
                  label="Parent 1 (First Digimon)"
                  value={quickParent1}
                  onChange={setQuickParent1}
                  options={allDigimonNames}
                />
                {dnaDetails.p1Details && (
                  <div className="grid grid-cols-3 gap-1 text-[11px] pt-1">
                    <span className="bg-slate-900 px-2 py-1 rounded text-slate-300 font-medium">
                      Rank: {dnaDetails.p1Details.level}
                    </span>
                    <span className="bg-slate-900 px-2 py-1 rounded text-amber-300 font-medium">
                      {dnaDetails.p1Details.type}
                    </span>
                    <span className="bg-slate-900 px-2 py-1 rounded text-slate-400 font-medium truncate">
                      {dnaDetails.p1Details.family}
                    </span>
                  </div>
                )}
              </div>

              <div
                id="tutorial-parent2-input"
                className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3"
              >
                <AutocompleteInput
                  label="Parent 2 (Second Digimon)"
                  value={quickParent2}
                  onChange={setQuickParent2}
                  options={allDigimonNames}
                />
                {dnaDetails.p2Details && (
                  <div className="grid grid-cols-3 gap-1 text-[11px] pt-1">
                    <span className="bg-slate-900 px-2 py-1 rounded text-slate-300 font-medium">
                      Rank: {dnaDetails.p2Details.level}
                    </span>
                    <span className="bg-slate-900 px-2 py-1 rounded text-amber-300 font-medium">
                      {dnaDetails.p2Details.type}
                    </span>
                    <span className="bg-slate-900 px-2 py-1 rounded text-slate-400 font-medium truncate">
                      {dnaDetails.p2Details.family}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div
              id="tutorial-dna-result"
              className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/80 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                    Attribute Advantage & Priority
                  </span>
                  <p className="text-xs text-amber-300 font-semibold">
                    {dnaDetails.reason}
                  </p>
                </div>
                {dnaDetails.winningParent && (
                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-3 py-1 rounded-full">
                    Winner: {dnaDetails.winningParent} ({dnaDetails.winningType}
                    )
                  </span>
                )}
              </div>

              <div className="text-center py-2 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                  DNA Outcome Species
                </span>
                {dnaDetails.result ? (
                  <div>
                    <span className="text-2xl font-black text-emerald-400 block">
                      {dnaDetails.result}
                    </span>
                    <span className="text-xs text-slate-400">
                      Result Stage:{" "}
                      <strong className="text-white">{dnaDetails.stage}</strong>{" "}
                      • Attribute:{" "}
                      <strong className="text-amber-300">
                        {dnaDetails.winningType}
                      </strong>
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-red-400 font-semibold block">
                    {dnaDetails.stage}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EVOLUTION ROUTE PLANNER */}
        {activeTab === "routes" && (
          <div className="space-y-4 sm:space-y-6">
            <div
              id="tutorial-route-toggle"
              className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3"
            >
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Route Search Priority
                </span>
                <p className="text-[11px] text-slate-400">
                  Choose whether to prioritize early DNA stage resets or natural
                  Digivolution steps first.
                </p>
              </div>

              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setStrategy("prioDna")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto ${
                    strategy === "prioDna"
                      ? "bg-amber-400 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  ⚡ Prioritize DNA Reset
                </button>
                <button
                  type="button"
                  onClick={() => setStrategy("prioDirect")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto ${
                    strategy === "prioDirect"
                      ? "bg-amber-400 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🛡️ Prioritize Direct Digivolve
                </button>
              </div>
            </div>

            <div
              id="tutorial-route-inputs"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <AutocompleteInput
                  label="Current Digimon"
                  value={evoStart}
                  onChange={(val) => {
                    setEvoStart(val);
                    localStorage.setItem("dw2_evo_start", val);
                  }}
                  options={allDigimonNames}
                />
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <AutocompleteInput
                  label="Target Goal"
                  value={evoGoal}
                  onChange={(val) => {
                    setEvoGoal(val);
                    localStorage.setItem("dw2_evo_goal", val);
                  }}
                  options={allDigimonNames}
                />
              </div>
            </div>

            <div
              id="tutorial-route-steps"
              className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Evolution Routes
                </h2>
                <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-semibold">
                  {evoRouteOptions.length} Options
                </span>
              </div>

              {evoRouteOptions.length === 0 ? (
                <p className="text-xs text-red-400 font-semibold">
                  No path found between these Digimon.
                </p>
              ) : (
                <div className="space-y-3">
                  {evoRouteOptions.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {evoRouteOptions.map((opt, idx) => (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedRouteIdx(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                            selectedRouteIdx === idx
                              ? "bg-amber-400 text-slate-950 border-amber-400"
                              : "bg-slate-950 text-slate-400 border-slate-800"
                          }`}
                        >
                          {idx === 0 ? "⭐ Best Way" : `Option ${idx + 1}`} (
                          {opt.totalSteps} Steps)
                        </button>
                      ))}
                    </div>
                  )}

                  {activeRoute && (
                    <div className="space-y-3">
                      {activeRoute.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3"
                        >
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                                STEP {idx + 1}
                              </span>
                              <span className="text-sm font-bold text-slate-100">
                                {step.description}
                              </span>
                            </div>
                          </div>

                          {step.validFodders &&
                            step.validFodders.length > 0 && (
                              <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-amber-400 font-bold uppercase text-[10px] tracking-wider">
                                    Select Any {step.requiredStage} with [
                                    {step.requiredFamily}] Family (
                                    {step.validFodders.length} Options):
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
                                  {step.validFodders.map((fodder) => (
                                    <button
                                      key={fodder.name}
                                      type="button"
                                      onClick={() =>
                                        setModalDigimon(fodder.name)
                                      }
                                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-transform hover:scale-105 ${
                                        fodder.status === "OWNED"
                                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                          : fodder.status === "CATCHABLE"
                                            ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                            : "bg-red-500/10 text-red-500/30 border-red-500/20"
                                      }`}
                                    >
                                      <span>
                                        {fodder.status === "OWNED" && "🟢"}
                                        {fodder.status === "CATCHABLE" && "🟡"}
                                        {fodder.status === "UNCATCHABLE" &&
                                          "🔴"}
                                      </span>
                                      <span>{fodder.name}</span>
                                      <span className="text-[9px] opacity-60">
                                        ({fodder.type})
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MOVE SEARCH */}
        {activeTab === "skills" && (
          <div className="space-y-4">
            <div
              id="tutorial-skill-input"
              className="bg-slate-900 border border-slate-800 p-4 rounded-2xl"
            >
              <AutocompleteInput
                label="Search Skill or Move"
                value={selectedSkill}
                onChange={(val) => {
                  setSelectedSkill(val);
                  localStorage.setItem("dw2_selected_skill", val);
                }}
                options={availableSkills}
              />
            </div>

            <div
              id="tutorial-skill-results"
              className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3"
            >
              <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                Wild Carriers & Encounters for {selectedSkill}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skillDropSources.map((source, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-300">
                        {source.digimon}
                      </span>
                      <button
                        onClick={() => setModalDigimon(source.digimon)}
                        className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded hover:bg-slate-700"
                      >
                        Info
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {source.locations.map((loc, lIdx) => (
                        <span
                          key={lIdx}
                          className="bg-slate-900 text-slate-400 border border-slate-800 text-[9px] px-1.5 py-0.5 rounded"
                        >
                          {loc}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OWNED POOL INVENTORY */}
        {activeTab === "inventory" && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div>
              <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Owned Digimon Pool
              </h2>
              <p className="text-xs text-slate-400">
                Add Digimon you currently own to prioritize them in DNA
                calculations.
              </p>
            </div>

            <div id="tutorial-inventory-input" className="flex gap-2">
              <AutocompleteInput
                value={inventoryInput}
                onChange={setInventoryInput}
                options={allDigimonNames}
                placeholder="Type Digimon to add..."
              />
              <button
                onClick={() => {
                  handleAddInventory(inventoryInput);
                  setInventoryInput("");
                }}
                className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs hover:bg-amber-400 whitespace-nowrap"
              >
                Add
              </button>
            </div>

            <div
              id="tutorial-inventory-list"
              className="flex flex-wrap gap-2 pt-2"
            >
              {userInventory.map((item) => (
                <span
                  key={item}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-xl flex items-center gap-1.5"
                >
                  🟢 {item}
                  <button
                    onClick={() => handleRemoveInventory(item)}
                    className="text-red-400 font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* INTERACTIVE COMPACT DNA FAMILY MATRIX MODAL */}
        {showMatrixModal && (
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
                  onClick={() => setShowMatrixModal(false)}
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
                    {(["Rookie", "Champion", "Ultimate"] as const).map(
                      (stage) => (
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
                      ),
                    )}
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
        )}

        {/* DIGIMON INFO MODAL */}
        {modalDigimon && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-3xl max-w-sm w-full space-y-3 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-amber-400">
                  {modalDigimon}
                </h3>
                <button
                  onClick={() => setModalDigimon(null)}
                  className="text-slate-400 hover:text-white font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <p>
                  <span className="text-slate-500">Stage:</span>{" "}
                  {catalog[modalDigimon]?.level || "N/A"}
                </p>
                <p>
                  <span className="text-slate-500">Attribute:</span>{" "}
                  {catalog[modalDigimon]?.type || "N/A"}
                </p>
                <p>
                  <span className="text-slate-500">Family:</span>{" "}
                  {catalog[modalDigimon]?.family || "N/A"}
                </p>

                <div className="pt-2">
                  <span className="text-slate-400 font-semibold block mb-1">
                    Wild Spawn Domains:
                  </span>
                  {(DIGIMON_MAP[modalDigimon] || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                      {(DIGIMON_MAP[modalDigimon] || []).map((loc, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-950 text-slate-300 border border-slate-800 text-[10px] px-2 py-0.5 rounded-md"
                        >
                          {loc}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">
                      Not available in wild domains (DNA breeding only).
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                {!userInventory.includes(modalDigimon) ? (
                  <button
                    onClick={() => {
                      handleAddInventory(modalDigimon);
                      setModalDigimon(null);
                    }}
                    className="w-full bg-emerald-500 text-slate-950 font-bold py-2 rounded-xl text-xs hover:bg-emerald-400"
                  >
                    + Add to Owned Pool
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleRemoveInventory(modalDigimon);
                      setModalDigimon(null);
                    }}
                    className="w-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-2 rounded-xl text-xs"
                  >
                    Remove from Owned Pool
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* INTERACTIVE TUTORIAL MODAL */}
        <InteractiveTutorialModal
          isOpen={showTutorialModal}
          onClose={() => setShowTutorialModal(false)}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          currentParent1={quickParent1}
          currentParent2={quickParent2}
        />
      </div>
    </div>
  );
}
