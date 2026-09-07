"use client";

import { useMemo } from "react";
import { catalog, DIGIMON_MAP } from "@/lib/dnaEngine";
import { formatStepDigimonName } from "@/lib/routeEngine";
import skillData from "@/data/digimon-skill.json";

interface DigimonInfoModalProps {
  digimon: string;
  onClose: () => void;
  userInventory: string[];
  onAddInventory: (name: string) => void;
  onRemoveInventory: (name: string) => void;
}

interface SkillInfo {
  name: string;
  Type?: string;
  target?: string;
  attribute?: string | null;
  AP?: number;
  MP?: number;
  Effect?: string | null;
  Obtain?: string;
}

const getSkillLookupName = (rawName: string): string => {
  const cleanName = rawName.replace(/\s*\([MRA]\)/gi, "").trim();

  if (cleanName.toLowerCase() === "bk-i-dramon") return "BK-I-dramon";
  if (cleanName.toLowerCase() === "i-dramon") return "I-dramon";

  return cleanName;
};

export function DigimonInfoModal({
  digimon,
  onClose,
  userInventory,
  onAddInventory,
  onRemoveInventory,
}: DigimonInfoModalProps) {
  const profile = catalog[digimon];
  const locations = DIGIMON_MAP[digimon] || [];

  const moves = useMemo(() => {
    let foundSkills: SkillInfo[] = [];
    const searchKey = getSkillLookupName(digimon);

    Object.values(skillData).forEach((stageGroup) => {
      const stageMap = stageGroup as unknown as Record<string, SkillInfo[]>;
      const matchKey = Object.keys(stageMap).find(
        (k) => k.toLowerCase() === searchKey.toLowerCase(),
      );

      if (matchKey) {
        const allSkills = stageMap[matchKey];

        if (profile?.signature_skill) {
          const sigSkillTarget = profile.signature_skill.toLowerCase();
          foundSkills = allSkills.filter(
            (s) => s.name.toLowerCase() === sigSkillTarget,
          );
        } else {
          foundSkills = allSkills;
        }
      }
    });

    return foundSkills;
  }, [digimon, profile]);

  const formattedTitle = formatStepDigimonName(digimon);

  const isOwned = userInventory.some(
    (item) =>
      item === digimon || formatStepDigimonName(item) === formattedTitle,
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-3xl max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-2 shrink-0">
          <div>
            <h3 className="text-base font-bold text-amber-400">
              {formattedTitle}
            </h3>
            <span className="text-[10px] text-slate-400">
              {profile?.level || "N/A"} • {profile?.type || "N/A"} •{" "}
              {profile?.family || "N/A"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-sm bg-slate-800 h-7 w-7 rounded-full flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
          <div className="space-y-2">
            <span className="text-amber-400 font-bold block uppercase text-[10px] tracking-wider">
              ⚔️ Learnable Moves & Skill Descriptions:
            </span>

            {moves.length > 0 ? (
              <div className="space-y-2">
                {moves.map((skill, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl space-y-1.5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-amber-300">
                          {skill.name}
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          {skill.Type || "Attack"}{" "}
                          {skill.attribute ? `• ${skill.attribute}` : ""}{" "}
                          {skill.target ? `• Target: ${skill.target}` : ""}
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-300 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                        {skill.AP ? `${skill.AP} AP` : ""}{" "}
                        {skill.MP ? `${skill.MP} MP` : ""}
                      </div>
                    </div>

                    {skill.Effect ? (
                      <p className="text-[10px] text-slate-200 bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 leading-relaxed">
                        <span className="text-amber-400/80 font-semibold block text-[9px] uppercase tracking-wider mb-0.5">
                          Effect:
                        </span>
                        "{skill.Effect}"
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/50">
                        No additional status effect for this skill.
                      </p>
                    )}

                    {skill.Obtain && (
                      <div className="text-[9px] text-slate-500 font-semibold pt-0.5">
                        Source:{" "}
                        <span className="text-slate-400">{skill.Obtain}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : profile?.signature_skill ? (
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl space-y-1">
                <span className="font-bold text-amber-300 block">
                  {profile.signature_skill}
                </span>
                <p className="text-[10px] text-slate-400 italic">
                  Signature skill from Digimon catalog profile.
                </p>
              </div>
            ) : (
              <p className="text-slate-500 italic text-[11px]">
                No skill data available for this Digimon.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="text-amber-400 font-bold block mb-1.5 uppercase text-[10px] tracking-wider">
              🗺️ Wild Encounters & Floor Range:
            </span>
            {locations.length > 0 ? (
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                {locations.map((loc, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 text-slate-200 border border-slate-800 text-[11px] px-2.5 py-1.5 rounded-xl flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-300">
                      📍 {loc}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic text-[11px]">
                Not available in wild domains (DNA breeding only).
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 shrink-0">
          {!isOwned ? (
            <button
              onClick={() => {
                onAddInventory(digimon);
                onClose();
              }}
              className="w-full bg-emerald-500 text-slate-950 font-bold py-2 rounded-xl text-xs hover:bg-emerald-400 transition-colors"
            >
              + Add to Owned Pool
            </button>
          ) : (
            <button
              onClick={() => {
                onRemoveInventory(digimon);
                onClose();
              }}
              className="w-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-2 rounded-xl text-xs hover:bg-red-500/30 transition-colors"
            >
              Remove from Owned Pool
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
