export type InteractiveStep = {
  id: number;
  title: string;
  tab: "calculator" | "routes" | "skills" | "inventory";
  instruction: string;
  targetId: string;
  proTip: string;
  expectedValue?: string;
};

export const GUIDED_TUTORIAL_STEPS: Record<
  "calculator" | "routes" | "skills" | "inventory",
  InteractiveStep[]
> = {
  calculator: [
    {
      id: 1,
      title: "🧬 Master Rank Dominance",
      tab: "calculator",
      instruction:
        'Type "WarGreymon" (Mega / Vaccine / Dragon) as Parent 1 to test high-rank breeding!',
      targetId: "#tutorial-parent1-input",
      proTip:
        "In the V6 Mod, higher rank parents override attribute triangle advantage!",
      expectedValue: "WarGreymon",
    },
    {
      id: 2,
      title: "⚔️ High-Tier Fodder Fusion",
      tab: "calculator",
      instruction: 'Type "MetalGarurumon" (Mega / Data / Beast) as Parent 2.',
      targetId: "#tutorial-parent2-input",
      proTip:
        "Combine two Mega Digimon to output powerful Ultimate stage resets!",
      expectedValue: "MetalGarurumon",
    },
    {
      id: 3,
      title: "🔥 Instant Fusion Preview",
      tab: "calculator",
      instruction:
        "Check the DNA Outcome box! The simulator calculates exact species, stage resets, and family rules automatically.",
      targetId: "#tutorial-dna-result",
      proTip:
        'Hit "View DNA Family Matrix" to inspect all 64 family combination outcomes!',
    },
  ],
  routes: [
    {
      id: 1,
      title: "🚀 Legendary Goal Pathfinder",
      tab: "routes",
      instruction:
        "Set your starter Digimon and aim for legendary endgame targets like Omnimon, Diaboromon, or Imperialdramon!",
      targetId: "#tutorial-route-inputs",
      proTip:
        "The pathfinder engine scans all 3 attribute tables to find the shortest breeding route.",
    },
    {
      id: 2,
      title: "⚡ Fast-Track Level Cap Resets",
      tab: "routes",
      instruction:
        'Toggle between "⚡ Prioritize DNA Reset" to clear EL caps fast, or "🛡️ Prioritize Direct Digivolve".',
      targetId: "#tutorial-route-toggle",
      proTip:
        "DNA Resets save hours of grinding by lowering stage and raising max EL caps!",
    },
    {
      id: 3,
      title: "🟢 Flexible Family Fodders",
      tab: "routes",
      instruction:
        "Check the colored badges! The app gives you ALL valid Digimon matching the family criteria instead of locking you into one species.",
      targetId: "#tutorial-route-steps",
      proTip:
        "🟢 = Owned in your Bank | 🟡 = Catchable in your Unlocked Domain | 🔴 = Uncatchable",
    },
  ],
  skills: [
    {
      id: 1,
      title: "🎯 Hunt Endgame Skill Carriers",
      tab: "skills",
      instruction:
        'Search for high-value moves like "Dramon Killer", "Giga Blaster", or "Mega Heal".',
      targetId: "#tutorial-skill-input",
      proTip: "Finds both signature moves and wild inheritable extra skills!",
    },
    {
      id: 2,
      title: "🗺️ Wild Encounter Radar",
      tab: "skills",
      instruction:
        "Instantly view which wild Digimon carry the skill and which domains they spawn in based on your story progress.",
      targetId: "#tutorial-skill-results",
      proTip:
        "Change your Progress level in the header to filter encounter locations!",
    },
  ],
  inventory: [
    {
      id: 1,
      title: "📦 Sync Your Server Bank",
      tab: "inventory",
      instruction:
        "Add Digimon currently sitting in your Digivice or Server Bank to your Owned Pool.",
      targetId: "#tutorial-inventory-input",
      proTip: "Saves automatically to your browser storage!",
    },
    {
      id: 2,
      title: "✨ Smart Route Highlighting",
      tab: "inventory",
      instruction:
        "Owned Digimon light up with green 🟢 badges across all Route Finder paths to minimize grinding!",
      targetId: "#tutorial-inventory-list",
      proTip: "Remove Digimon anytime using the red × button.",
    },
  ],
};
