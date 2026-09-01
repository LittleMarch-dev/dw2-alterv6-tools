"use client";

import { useState, useMemo, useEffect } from "react";
import { catalog, DOMAIN_ORDER } from "@/lib/dnaEngine";
import { DomainDropdown } from "@/components/DomainDropdown";
import { DnaCalculator } from "@/components/DnaCalculator";
import { RouteFinder } from "@/components/RouteFinder";
import { MoveSearch } from "@/components/MoveSearch";
import { OwnedPool } from "@/components/OwnedPool";
import { DnaMatrixModal } from "@/components/DnaMatrixModal";
import { DigimonInfoModal } from "@/components/DigimonInfoModal";
import { InteractiveTutorialModal } from "@/components/InteractiveTutorial";

export default function DW2App() {
  const [activeTab, setActiveTab] = useState<
    "calculator" | "routes" | "skills" | "inventory"
  >("calculator");
  const allDigimonNames = useMemo(() => Object.keys(catalog).sort(), []);

  // Application States
  const [quickParent1, setQuickParent1] = useState<string>("Greymon");
  const [quickParent2, setQuickParent2] = useState<string>("Leomon");
  const [unlockedDomain, setUnlockedDomain] = useState<string>(DOMAIN_ORDER[0]);
  const [userInventory, setUserInventory] = useState<string[]>([]);

  // Modals
  const [modalDigimon, setModalDigimon] = useState<string | null>(null);
  const [showMatrixModal, setShowMatrixModal] = useState<boolean>(false);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);

  // LocalStorage Initializer
  useEffect(() => {
    const savedDomain = localStorage.getItem("dw2_unlocked_domain");
    const savedInv = localStorage.getItem("dw2_user_inventory");
    if (savedDomain) setUnlockedDomain(savedDomain);
    if (savedInv) setUserInventory(JSON.parse(savedInv));
  }, []);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
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
                onSelect={(val) => {
                  setUnlockedDomain(val);
                  localStorage.setItem("dw2_unlocked_domain", val);
                }}
              />
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
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

        {/* Active Tab Views */}
        {activeTab === "calculator" && (
          <DnaCalculator
            parent1={quickParent1}
            parent2={quickParent2}
            onParent1Change={setQuickParent1}
            onParent2Change={setQuickParent2}
            allDigimonNames={allDigimonNames}
            onOpenMatrix={() => setShowMatrixModal(true)}
          />
        )}
        {activeTab === "routes" && (
          <RouteFinder
            unlockedDomain={unlockedDomain}
            userInventory={userInventory}
            onSelectDigimon={setModalDigimon}
            allDigimonNames={allDigimonNames}
          />
        )}
        {activeTab === "skills" && (
          <MoveSearch onSelectDigimon={setModalDigimon} />
        )}
        {activeTab === "inventory" && (
          <OwnedPool
            inventory={userInventory}
            setInventory={setUserInventory}
            allDigimonNames={allDigimonNames}
          />
        )}

        {/* Modals */}
        {showMatrixModal && (
          <DnaMatrixModal onClose={() => setShowMatrixModal(false)} />
        )}
        {modalDigimon && (
          <DigimonInfoModal
            digimon={modalDigimon}
            onClose={() => setModalDigimon(null)}
            userInventory={userInventory}
            onAddInventory={handleAddInventory}
            onRemoveInventory={handleRemoveInventory}
          />
        )}
        <InteractiveTutorialModal
          isOpen={showTutorialModal}
          onClose={() => setShowTutorialModal(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentParent1={quickParent1}
          currentParent2={quickParent2}
        />
      </div>
    </div>
  );
}
