"use client";

import { catalog, DIGIMON_MAP } from "@/lib/dnaEngine";
import { formatStepDigimonName } from "@/lib/routeEngine";

interface DigimonInfoModalProps {
  digimon: string;
  onClose: () => void;
  userInventory: string[];
  onAddInventory: (name: string) => void;
  onRemoveInventory: (name: string) => void;
}

export function DigimonInfoModal({
  digimon,
  onClose,
  userInventory,
  onAddInventory,
  onRemoveInventory,
}: DigimonInfoModalProps) {
  const profile = catalog[digimon];
  const locations = DIGIMON_MAP[digimon] || [];

  // Convert raw catalog keys (e.g., "Omnimon (M)") to readable UI names (e.g., "Omnimon [Grey Sword Variant]")
  const formattedTitle = formatStepDigimonName(digimon);

  // Match inventory by raw catalog key or clean display name
  const isOwned = userInventory.some(
    (item) =>
      item === digimon || formatStepDigimonName(item) === formattedTitle,
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-3xl max-w-sm w-full space-y-3 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h3 className="text-base font-bold text-amber-400">
            {formattedTitle}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-sm"
          >
            ✕
          </button>
        </div>

        <div className="text-xs text-slate-300 space-y-1">
          <p>
            <span className="text-slate-500 font-semibold">Stage:</span>{" "}
            {profile?.level || "N/A"}
          </p>
          <p>
            <span className="text-slate-500 font-semibold">Attribute:</span>{" "}
            <span className="text-amber-300 font-bold">
              {profile?.type || "N/A"}
            </span>
          </p>
          <p>
            <span className="text-slate-500 font-semibold">Family:</span>{" "}
            {profile?.family || "N/A"}
          </p>

          <div className="pt-2 border-t border-slate-800/80 mt-2">
            <span className="text-amber-400 font-bold block mb-1.5 uppercase text-[10px] tracking-wider">
              🗺️ Wild Encounters & Floor Range:
            </span>
            {locations.length > 0 ? (
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
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

        <div className="pt-2">
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
