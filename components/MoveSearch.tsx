"use client";

import { useState, useMemo } from "react";
import { catalog, searchSkills } from "@/lib/dnaEngine";
import { formatStepDigimonName } from "@/lib/routeEngine";
import { AutocompleteInput } from "./AutocompleteInput";

interface MoveSearchProps {
  onSelectDigimon: (name: string) => void;
}

export function MoveSearch({ onSelectDigimon }: MoveSearchProps) {
  const [selectedSkill, setSelectedSkill] = useState<string>("Grey Sword");

  const availableSkills = useMemo(() => {
    const skillSet = new Set<string>();
    Object.values(catalog).forEach((profile) => {
      if (profile.signature_skill) skillSet.add(profile.signature_skill);
      profile.extra_skills?.forEach((item) => skillSet.add(item.skill));
    });
    return Array.from(skillSet).sort();
  }, []);

  const skillDropSources = useMemo(
    () => searchSkills(selectedSkill),
    [selectedSkill],
  );

  return (
    <div className="space-y-4">
      <div
        id="tutorial-skills-search"
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
        id="tutorial-skills-results"
        className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3"
      >
        <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
          Wild Carriers & Encounters for {selectedSkill}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {skillDropSources.map((source, idx) => {
            // Clean display name using human-readable variant labels
            const formattedName = formatStepDigimonName(source.digimon);

            return (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-300">
                    {formattedName}
                  </span>
                  <button
                    onClick={() => onSelectDigimon(source.digimon)}
                    className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded hover:bg-slate-700 transition-colors"
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
