export const DASHBOARD_THEME_STORAGE_KEY = "marketmage.dashboard.theme";

export type DashboardTheme = "light" | "dark";

type ThemeStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

type ThemeEnvironment = {
  matchMedia?: (query: string) => { matches: boolean };
  storage?: ThemeStorage | null;
};

export function getInitialDashboardTheme(
  environment: ThemeEnvironment = readBrowserThemeEnvironment(),
): DashboardTheme {
  const storedTheme = readStoredDashboardTheme(environment.storage);

  if (storedTheme) {
    return storedTheme;
  }

  return environment.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function persistDashboardTheme(
  theme: DashboardTheme,
  storage: ThemeStorage | null | undefined = readBrowserThemeEnvironment()
    .storage,
): void {
  try {
    storage?.setItem(DASHBOARD_THEME_STORAGE_KEY, theme);
  } catch {
    // Some browsers can deny storage access; theme switching should still work.
  }
}

function readStoredDashboardTheme(
  storage: ThemeStorage | null | undefined,
): DashboardTheme | null {
  try {
    const theme = storage?.getItem(DASHBOARD_THEME_STORAGE_KEY);

    return theme === "light" || theme === "dark" ? theme : null;
  } catch {
    return null;
  }
}

function readBrowserThemeEnvironment(): ThemeEnvironment {
  if (typeof window === "undefined") {
    return {};
  }

  return {
    matchMedia: window.matchMedia.bind(window),
    storage: window.localStorage,
  };
}
