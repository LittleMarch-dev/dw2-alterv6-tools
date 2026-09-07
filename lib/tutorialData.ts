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
      title: "Set Current Domain",
      instruction:
        "Select your active domain here to mark wild Digimon available in this specific location as catchable.",
      proTip:
        "Changing your current domain updates catchable status badges across all tools instantly.",
      targetId: "#tutorial-header-domain-select",
      tab: "calculator",
    },
    {
      id: 2,
      title: "Set Parent 1",
      instruction: 'Type "Gururumon" into Parent 1 or pick it from the list.',
      proTip: "Gururumon is a Champion level Vaccine attribute Digimon.",
      targetId: "#tutorial-parent-1",
      tab: "calculator",
    },
    {
      id: 3,
      title: "Set Parent 2",
      instruction: 'Type "Myotismon" into Parent 2.',
      proTip:
        "Attribute priority and resulting DP evaluate automatically upon selection.",
      targetId: "#tutorial-parent-2",
      tab: "calculator",
    },
    {
      id: 4,
      title: "Check Result",
      instruction:
        'View your resulting species, then click "View Mega Branches".',
      proTip: "Mega routes are sorted with lowest DP requirements first.",
      targetId: "#tutorial-outcome-card",
      tab: "calculator",
    },
  ],
  routes: [
    {
      id: 5,
      title: "Set Your Goal",
      instruction: "Enter your current Digimon and desired endgame target.",
      proTip: "Route paths auto-adjust based on unlocked Domain progress.",
      targetId: "#tutorial-route-inputs",
      tab: "routes",
    },
    {
      id: 6,
      title: "Target Variant Skills",
      instruction: "Select the specific skill variant you want to unlock.",
      proTip:
        "MRA forms like Omnimon [Grey Sword Variant] feature branch-specific signature moves.",
      targetId: "#tutorial-target-skills",
      tab: "routes",
    },
    {
      id: 7,
      title: "DNA Fodder Strategy",
      instruction:
        "Choose whether to reset using Champion, Ultimate, or Mega fodder.",
      proTip:
        "Using higher tier fodder preserves stage levels and shortens evolution steps.",
      targetId: "#tutorial-fodder-strategy",
      tab: "routes",
    },
    {
      id: 8,
      title: "Optimal Step Path",
      instruction:
        "View step-by-step DNA combinations and color-coded fodder buttons.",
      proTip:
        "Buttons display 🟢 Owned, 🟡 Catchable, 🔴 Not in Domain, or 🟣 Must Digivolve status.",
      targetId: "#tutorial-evolution-routes",
      tab: "routes",
    },
    {
      id: 9,
      title: "Fodder Info",
      instruction:
        "Click any fodder button to inspect its moves, locations, or direct evolution parents.",
      proTip:
        "For 🟣 Must Digivolve fodder, the modal shows direct 1-stage lower forms along with required DP ranges.",
      targetId: "#tutorial-fodder-button",
      tab: "routes",
    },
  ],
  skills: [
    {
      id: 10,
      title: "Global Search Query",
      instruction:
        "Type any Digimon, skill name, status effect (like confusion), or domain.",
      proTip:
        "You can search for status effects to quickly find all skills causing paralysis or confusion.",
      targetId: "#tutorial-global-search",
      tab: "skills",
    },
    {
      id: 11,
      title: "Category Filters",
      instruction: "Switch between Digimon, Skills, or Domains categories.",
      proTip:
        "Selecting Domains isolates wild encounter lists per tower location.",
      targetId: "#tutorial-category-filters",
      tab: "skills",
    },
    {
      id: 12,
      title: "Stage & Move Filters",
      instruction:
        "Filter results by Digimon Stage (Rookie to Mega) or Move Type (Attack, Assist, Interrupt).",
      proTip:
        "Filtering by Interrupt or Assist quickly isolates crowd control abilities.",
      targetId: "#tutorial-stage-filters",
      tab: "skills",
    },
    {
      id: 13,
      title: "Set Domain Progress",
      instruction:
        "Click 'Set Progress' on any Domain card to update your current domain.",
      proTip:
        "Setting progress updates your domain filter across all tools in the application.",
      targetId: "#tutorial-domain-card-progress",
      tab: "skills",
    },
  ],
  inventory: [
    {
      id: 14,
      title: "Manage Owned Pool",
      instruction: "Track Digimon currently in your Digivice or Server Box.",
      proTip:
        "Adding owned Digimon automatically updates fodder badges to 🟢 Owned across all route steps.",
      targetId: "#tutorial-owned-pool",
      tab: "inventory",
    },
  ],
};
