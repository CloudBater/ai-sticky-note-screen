export const ONBOARDING_VISITED_KEY = "marketmage.onboarding.visited";

type SimpleStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export type OnboardingStorage = {
  hasVisited: () => boolean;
  markVisited: () => void;
};

export function createOnboardingStorage(
  storage: SimpleStorage,
): OnboardingStorage {
  return {
    hasVisited() {
      try {
        return storage.getItem(ONBOARDING_VISITED_KEY) !== null;
      } catch {
        return false;
      }
    },
    markVisited() {
      try {
        storage.setItem(ONBOARDING_VISITED_KEY, "1");
      } catch {
        // Storage blocked (private browsing etc.) — silently ignore
      }
    },
  };
}

export function createBrowserOnboardingStorage(): OnboardingStorage {
  if (typeof window === "undefined" || !window.localStorage) {
    return { hasVisited: () => false, markVisited: () => {} };
  }
  return createOnboardingStorage(window.localStorage);
}
