import { useState, useEffect, useCallback } from "react";
import type { OnboardingStorage } from "./onboarding-visited";
import { createBrowserOnboardingStorage } from "./onboarding-visited";

type OnboardingStep = {
  heading: string;
  body: string;
  eyebrow: string;
};

const STEPS: OnboardingStep[] = [
  {
    eyebrow: "1 / 4",
    heading: "Welcome to MarketMage",
    body: "A daily FX reference dashboard for safe hypothetical simulations and historical trends. No real-money trading — ever.",
  },
  {
    eyebrow: "2 / 4",
    heading: "Daily reference rates",
    body: "The Overview tab shows the latest ECB reference rates and a 30-day trend chart. Rates update once a day — not live market data.",
  },
  {
    eyebrow: "3 / 4",
    heading: "Simulate conversions safely",
    body: "Use the Simulate tab to preview what a hypothetical conversion would look like at today's reference rate. No trades are executed. No funds move.",
  },
  {
    eyebrow: "4 / 4",
    heading: "Build a simulation history",
    body: "Add previewed conversions to your Simulation History to track hypothetical P/L over time. All data stays local to your browser.",
  },
];

type OnboardingGuideProps = {
  storage?: OnboardingStorage;
};

export function OnboardingGuide({
  storage: storageProp,
}: OnboardingGuideProps) {
  const storage = storageProp ?? createBrowserOnboardingStorage();
  const [visible, setVisible] = useState(() => !storage.hasVisited());
  const [step, setStep] = useState(0);
  // "leaving" = exit animation in progress before final removal
  const [leaving, setLeaving] = useState(false);

  const dismiss = useCallback(() => {
    storage.markVisited();
    setLeaving(true);
    // Remove from DOM after exit transition (300 ms)
    setTimeout(() => setVisible(false), 300);
  }, [storage]);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }, [step, dismiss]);

  // Keyboard: Escape = dismiss, ArrowRight / Enter = next
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      if (e.key === "ArrowRight" || (e.key === "Enter" && e.target === document.body))
        next();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [visible, dismiss, next]);

  if (!visible) return null;

  const currentStep = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      aria-label="Welcome to MarketMage"
      aria-modal="true"
      className="onboarding-overlay"
      data-onboarding="true"
      data-onboarding-visible={leaving ? "false" : "true"}
      role="dialog"
    >
      <div className="onboarding-card">
        {/* Skip / close */}
        <button
          aria-label="Skip introduction"
          className="onboarding-skip"
          data-onboarding-dismiss
          onClick={dismiss}
          type="button"
        >
          Skip
        </button>

        {/* Step content */}
        <div className="onboarding-step" data-onboarding-step={step}>
          <p className="eyebrow onboarding-eyebrow">{currentStep.eyebrow}</p>
          <h2 className="onboarding-heading">{currentStep.heading}</h2>
          <p className="onboarding-body">{currentStep.body}</p>
        </div>

        {/* Footer: dots + next */}
        <div className="onboarding-footer">
          <div
            aria-label={`Step ${step + 1} of ${STEPS.length}`}
            className="onboarding-dots"
            data-onboarding-dots
          >
            {STEPS.map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="onboarding-dot"
                data-onboarding-dot
                data-active={i === step ? "true" : "false"}
              />
            ))}
          </div>

          <button
            className="onboarding-next"
            data-onboarding-next
            onClick={next}
            type="button"
          >
            {isLast ? "Start exploring" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
