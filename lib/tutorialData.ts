export interface InteractiveStep {
  id: number;
  title: string;
  instruction: string;
  proTip: string;
  targetId: string;
  tab: "calculator" | "routes" | "skills" | "inventory";
}

export const GUIDED_TUTORIAL_STEPS: Record<
  "calculator" | "routes" | "skills" | "inventory",
  InteractiveStep[]
> = {
  calculator: [
    {
      id: 1,
      title: "Set Parent 1",
      instruction: 'Type "Gururumon" into Parent 1 or pick it from the list.',
      proTip: "Gururumon is a Champion level Data attribute Digimon.",
      targetId: "#tutorial-parent-1",
      tab: "calculator",
    },
    {
      id: 2,
      title: "Set Parent 2",
      instruction: 'Type "Myotismon" into Parent 2.',
      proTip: "Attribute priority evaluates automatically upon selection.",
      targetId: "#tutorial-parent-2",
      tab: "calculator",
    },
    {
      id: 3,
      title: "Check Result & Mega Branches",
      instruction:
        'View your resulting species, then click "View Mega Branches".',
      proTip: "Mega routes are sorted with lowest DP requirements first.",
      targetId: "#tutorial-outcome-card",
      tab: "calculator",
    },
  ],
  routes: [
    {
      id: 4,
      title: "Current Digimon & Target Goal",
      instruction: "Enter your current Digimon and desired endgame target.",
      proTip: "Route paths auto-adjust as you advance tower progress.",
      targetId: "#tutorial-route-inputs",
      tab: "routes",
    },
    {
      id: 5,
      title: "Target Signature Skills",
      instruction: "Select the specific skill variant you want to unlock.",
      proTip: "MRA forms like Diaboromon feature branch-specific moves.",
      targetId: "#tutorial-target-skills",
      tab: "routes",
    },
    {
      id: 6,
      title: "Optimal Step-by-Step Path",
      instruction: "View step-by-step DNA combinations and fodder Digimon.",
      proTip:
        "Click any fodder button to inspect or add it to your owned pool.",
      targetId: "#tutorial-evolution-routes",
      tab: "routes",
    },
  ],
  skills: [
    {
      id: 7,
      title: "Search & Filter Signature Moves",
      instruction: "Filter moves by name, element type, or target Digimon.",
      proTip:
        "Search signature moves to trace which Digimon pass down powerful attacks.",
      targetId: "#tutorial-skills-search",
      tab: "skills",
    },
  ],
  inventory: [
    {
      id: 8,
      title: "Manage Owned Pool",
      instruction: "Track Digimon currently in your Digivice or Server Box.",
      proTip:
        "Adding owned Digimon automatically flags them as ready fodder in the Route Finder.",
      targetId: "#tutorial-owned-pool",
      tab: "inventory",
    },
  ],
};
