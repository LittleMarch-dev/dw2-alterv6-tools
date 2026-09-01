"use client";

import { useState, useEffect, useLayoutEffect } from "react";

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: "calculator" | "routes" | "skills" | "inventory";
  onTabChange?: (tab: "calculator" | "routes" | "skills" | "inventory") => void;
}

export function HowToUseModal({
  isOpen,
  onClose,
  activeTab = "calculator",
  onTabChange,
}: HowToUseModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TUTORIAL_STEPS[currentStep] || TUTORIAL_STEPS[0];

  // Auto-switch tabs when step changes
  useEffect(() => {
    if (isOpen && step.tab && onTabChange && step.tab !== activeTab) {
      onTabChange(step.tab);
    }
  }, [isOpen, currentStep, step.tab, activeTab, onTabChange]);

  // Recalculate target position
  useLayoutEffect(() => {
    if (!isOpen) return;

    const updateRect = () => {
      if (step.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
          return;
        }
      }
      setTargetRect(null);
    };

    // Small delay ensures DOM renders tab transitions before measuring
    const timer = setTimeout(updateRect, 100);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, [isOpen, currentStep, step.targetId, activeTab]);

  useEffect(() => {
    if (isOpen) setCurrentStep(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const getCardStyle = () => {
    if (!targetRect) return {};

    const spaceBelow = window.innerHeight - targetRect.bottom;
    const renderAbove = spaceBelow < 220;

    return {
      top: renderAbove ? "auto" : `${targetRect.bottom + 16}px`,
      bottom: renderAbove
        ? `${window.innerHeight - targetRect.top + 16}px`
        : "auto",
      left: `${Math.max(16, Math.min(targetRect.left, window.innerWidth - 360))}px`,
    };
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* 1. SVG Cutout Mask */}
      {targetRect ? (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <mask id="tutorial-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
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
            fill="rgba(2, 6, 23, 0.75)"
            mask="url(#tutorial-spotlight-mask)"
            className="pointer-events-auto"
            onClick={onClose}
          />
        </svg>
      ) : (
        <div
          className="absolute inset-0 bg-slate-950/75 pointer-events-auto"
          onClick={onClose}
        />
      )}

      {/* 2. Glowing Ring */}
      {targetRect && (
        <div
          className="absolute z-50 border-2 border-amber-400 rounded-2xl shadow-[0_0_25px_rgba(251,191,36,0.9)] transition-all duration-300 pointer-events-none animate-pulse"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {/* 3. Floating Card */}
      <div
        style={getCardStyle()}
        className="fixed z-50 w-[calc(100vw-32px)] sm:w-80 pointer-events-auto transition-all duration-300 ease-out"
      >
        <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-4 shadow-2xl space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{step.icon}</span>
              <h3 className="text-xs font-black text-slate-100">
                {step.title}
              </h3>
            </div>
            <span className="text-[9px] font-mono font-extrabold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {currentStep + 1} / {TUTORIAL_STEPS.length}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
            {step.description}
          </p>

          <div className="flex justify-between items-center pt-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                currentStep === 0
                  ? "opacity-30 text-slate-600"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              Back
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] text-slate-500 hover:text-slate-300 font-semibold px-1.5 py-1"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] px-3.5 py-1 rounded-lg shadow-md transition-all active:scale-95"
              >
                {currentStep === TUTORIAL_STEPS.length - 1
                  ? "Finish 🚀"
                  : "Next ➔"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
