import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { mountDashboard } from "../src/client/dashboard-bootstrap";
import type { DashboardViewModel } from "../src/client/dashboard-view-model";

const fallbackViewModel: DashboardViewModel = {
  title: "MarketMage",
  simulationBalanceLabel: "Hypothetical starting balance",
  simulationBalance: {
    amount: 10_000,
    currency: "USD",
  },
  trustMessages: [
    "Daily reference rates, not real-time quotes.",
    "Historical reference only.",
    "Not investment advice.",
    "No deposits, withdrawals, or trades.",
    "No trades are executed.",
  ],
  navigationItems: [
    { id: "overview", label: "Overview" },
    { id: "trend", label: "Historical Trend" },
    { id: "simulation", label: "Simulation" },
    { id: "history", label: "History" },
  ],
  currencySupport: {
    supported: [],
    unsupported: ["USD", "EUR", "JPY", "TWD", "GBP", "CNY", "SGD"],
  },
  latestRates: {
    baseCurrency: "USD",
    dataDate: "Loading...",
    cards: [],
  },
};

const loadedViewModel: DashboardViewModel = {
  ...fallbackViewModel,
  currencySupport: {
    supported: ["USD", "EUR", "JPY"],
    unsupported: ["TWD"],
  },
  latestRates: {
    baseCurrency: "USD",
    dataDate: "2024-08-23",
    cards: [{ currency: "EUR", label: "1 USD = 0.901 EUR", rate: 0.901 }],
  },
};

describe("mountDashboard", () => {
  it("renders an honest fallback before replacing it with backend data", async () => {
    const renderedViewModels: DashboardViewModel[] = [];

    await mountDashboard({
      render: (node: ReactNode) => {
        const props = (node as { props: { viewModel: DashboardViewModel } })
          .props;
        renderedViewModels.push(props.viewModel);
      },
      loadViewModel: async () => loadedViewModel,
    });

    expect(renderedViewModels).toEqual([fallbackViewModel, loadedViewModel]);
  });
});
