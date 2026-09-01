"use client";

import { useState, useEffect, useCallback } from "react";
import { GUIDED_TUTORIAL_STEPS, InteractiveStep } from "@/lib/tutorialData";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  activeTab: "calculator" | "routes" | "skills" | "inventory";
  onTabChange: (tab: "calculator" | "routes" | "skills" | "inventory") => void;
  currentParent1: string;
  currentParent2: string;
};

export function InteractiveTutorialModal({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
}: Props) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  // Flatten steps across all 4 tabs
  const allSteps = [
    ...GUIDED_TUTORIAL_STEPS.calculator,
    ...GUIDED_TUTORIAL_STEPS.routes,
    ...GUIDED_TUTORIAL_STEPS.skills,
    ...GUIDED_TUTORIAL_STEPS.inventory,
  ];

  const step: InteractiveStep | undefined = allSteps[currentStepIdx];
  const targetId = step?.targetId;

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIdx(0);
      onTabChange("calculator");
    }
  }, [isOpen, onTabChange]);

  const measureTarget = useCallback(() => {
    if (!targetId) return;
    const el = document.querySelector(targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setTargetRect(null);
    }
  }, [targetId]);

  useEffect(() => {
    if (!isOpen || !targetId) return;

    measureTarget();
    const t1 = setTimeout(measureTarget, 100);
    const t2 = setTimeout(measureTarget, 250);

    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget);
    };
  }, [isOpen, targetId, activeTab, measureTarget]);

  if (!isOpen || !step) return null;

  const isLastStep = currentStepIdx === allSteps.length - 1;

  const goToStep = (newIndex: number) => {
    const nextStep = allSteps[newIndex];
    if (nextStep) {
      if (nextStep.tab !== activeTab) {
        onTabChange(nextStep.tab);
      }
      setCurrentStepIdx(newIndex);
    }
  };

  const getCardStyle = () => {
    if (!targetRect)
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const spaceBelow =
      window.innerHeight -
      (targetRect.top - window.scrollY + targetRect.height);
    const renderAbove = spaceBelow < 250;

    return {
      top: renderAbove
        ? "auto"
        : `${targetRect.top + targetRect.height + 16}px`,
      bottom: renderAbove
        ? `${window.innerHeight - targetRect.top + 16}px`
        : "auto",
      left: `${Math.max(16, Math.min(targetRect.left, window.innerWidth - 360))}px`,
    };
  };

  return (
    <>
      {targetRect && (
        <svg className="fixed inset-0 z-40 w-full h-full pointer-events-none">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - window.scrollY - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="16"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(2, 6, 23, 0.8)"
            mask="url(#spotlight-mask)"
            className="pointer-events-auto"
            onClick={onClose}
          />
        </svg>
      )}

      {targetRect && (
        <div
          style={{
            top: `${targetRect.top - window.scrollY - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
          className="absolute z-50 rounded-2xl border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.95)] transition-all duration-300 ease-in-out pointer-events-none animate-pulse"
        />
      )}

      <div
        style={getCardStyle()}
        className="fixed z-50 w-[calc(100vw-32px)] sm:w-80 bg-slate-900 border border-amber-500/50 p-4 rounded-3xl shadow-2xl space-y-3 pointer-events-auto transition-all duration-300 ease-out"
      >
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase">
            {step.tab.toUpperCase()} • STEP {currentStepIdx + 1} /{" "}
            {allSteps.length}
          </span>
          <span className="text-xs font-bold text-slate-100 truncate max-w-[150px]">
            {step.title}
          </span>
        </div>

        <p className="text-xs text-amber-200 font-medium leading-relaxed">
          👉 {step.instruction}
        </p>

        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-[11px] text-slate-400">
          💡 <span className="text-slate-300">{step.proTip}</span>
        </div>

        <div className="flex justify-between items-center pt-1">
          <button
            onClick={() => goToStep(Math.max(0, currentStepIdx - 1))}
            disabled={currentStepIdx === 0}
            className="text-xs text-slate-400 hover:text-white disabled:opacity-30 font-semibold"
          >
            ← Back
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-300 font-semibold px-1 py-1"
            >
              Skip
            </button>
            {isLastStep ? (
              <button
                onClick={onClose}
                className="bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs hover:bg-amber-300 transition-all shadow-md"
              >
                Done 🎉
              </button>
            ) : (
              <button
                onClick={() => goToStep(currentStepIdx + 1)}
                className="bg-slate-800 text-slate-200 font-bold px-3.5 py-1.5 rounded-xl text-xs hover:bg-slate-700 transition-all shadow-md"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
