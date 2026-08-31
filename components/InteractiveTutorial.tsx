"use client";

import { useState, useEffect } from "react";
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
  currentParent1,
  currentParent2,
}: Props) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const steps: InteractiveStep[] =
    GUIDED_TUTORIAL_STEPS[activeTab] || GUIDED_TUTORIAL_STEPS.calculator;
  const step: InteractiveStep = steps[currentStepIdx] || steps[0];

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIdx(0);
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen || !step) return;

    onTabChange(step.tab);

    const updatePosition = () => {
      const el = document.querySelector(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    const timer = setTimeout(updatePosition, 150);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [currentStepIdx, isOpen, step, onTabChange]);

  // Auto-advance step on matching input
  useEffect(() => {
    if (!isOpen || activeTab !== "calculator") return;

    if (step.id === 1 && currentParent1.toLowerCase() === "gururumon") {
      setCurrentStepIdx(1);
    } else if (step.id === 2 && currentParent2.toLowerCase() === "myotismon") {
      setCurrentStepIdx(2);
    }
  }, [currentParent1, currentParent2, step.id, isOpen, activeTab]);

  if (!isOpen || !step) return null;

  const isLastStep = currentStepIdx === steps.length - 1;

  return (
    <>
      {/* 
        1. Clean SVG Hole Mask Backdrop:
        This draws a full screen dark overlay WITH an actual transparent cutout hole
        directly over the active target box!
      */}
      {targetRect && (
        <svg className="fixed inset-0 z-40 w-full h-full pointer-events-none">
          <defs>
            <mask id="spotlight-mask">
              {/* White fills everything (Darkened background) */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black cuts out the spotlight hole (100% bright target) */}
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
            fill="rgba(2, 6, 23, 0.85)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      )}

      {/* 2. Glowing Animated Border Ring around the clear target */}
      {targetRect && (
        <div
          style={{
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
          className="absolute z-50 rounded-2xl border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.95)] transition-all duration-300 ease-in-out pointer-events-none animate-pulse"
        />
      )}

      {/* 3. Floating Interactive Guidance Box Anchored Directly Below Target */}
      {targetRect && (
        <div
          style={{
            top: `${targetRect.top + targetRect.height + 16}px`,
            left: `${Math.max(16, targetRect.left)}px`,
            maxWidth: `${Math.min(420, targetRect.width)}px`,
          }}
          className="absolute z-50 w-full bg-slate-900 border border-amber-500/50 p-4 rounded-2xl shadow-2xl space-y-3 transition-all duration-300 ease-in-out pointer-events-auto"
        >
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase">
              {activeTab.toUpperCase()} • STEP {step.id} / {steps.length}
            </span>
            <span className="text-xs font-bold text-slate-100">
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
              onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
              disabled={currentStepIdx === 0}
              className="text-xs text-slate-400 hover:text-white disabled:opacity-30 font-semibold"
            >
              ← Back
            </button>

            {isLastStep ? (
              <button
                onClick={onClose}
                className="bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs hover:bg-amber-300 transition-all"
              >
                Done 🎉
              </button>
            ) : (
              <button
                onClick={() => setCurrentStepIdx(currentStepIdx + 1)}
                className="bg-slate-800 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-slate-700 transition-all"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
