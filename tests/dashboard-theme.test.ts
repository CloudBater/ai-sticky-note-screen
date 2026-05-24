import { describe, expect, it } from "vitest";

import {
  DASHBOARD_THEME_STORAGE_KEY,
  getInitialDashboardTheme,
  persistDashboardTheme,
} from "../src/client/dashboard-theme";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("dashboard theme preference", () => {
  it("uses a persisted dashboard theme before system preference", () => {
    const storage = new MemoryStorage();

    storage.setItem(DASHBOARD_THEME_STORAGE_KEY, "dark");

    expect(
      getInitialDashboardTheme({
        matchMedia: () => ({ matches: false }),
        storage,
      }),
    ).toBe("dark");
  });

  it("falls back to system dark preference when no valid stored theme exists", () => {
    const storage = new MemoryStorage();

    storage.setItem(DASHBOARD_THEME_STORAGE_KEY, "blue");

    expect(
      getInitialDashboardTheme({
        matchMedia: () => ({ matches: true }),
        storage,
      }),
    ).toBe("dark");
  });

  it("persists the selected dashboard theme", () => {
    const storage = new MemoryStorage();

    persistDashboardTheme("light", storage);

    expect(storage.getItem(DASHBOARD_THEME_STORAGE_KEY)).toBe("light");
  });
});
