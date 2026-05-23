import type { ReactNode } from "react";

import { DashboardApp } from "./DashboardApp";
import { loadDashboardViewModel } from "./dashboard-loader";
import {
  buildDashboardViewModel,
  type DashboardViewModel,
} from "./dashboard-view-model";

type MountDashboardOptions = {
  render: (node: ReactNode) => void;
  loadViewModel?: () => Promise<DashboardViewModel>;
};

const REQUESTED_CURRENCIES = ["USD", "EUR", "JPY", "TWD", "GBP", "CNY", "SGD"];

export async function mountDashboard({
  render,
  loadViewModel = () =>
    loadDashboardViewModel({
      simulationBalance: 10_000,
      requestedCurrencies: REQUESTED_CURRENCIES,
    }),
}: MountDashboardOptions): Promise<void> {
  render(<DashboardApp viewModel={buildFallbackViewModel()} />);
  render(<DashboardApp viewModel={await loadViewModel()} />);
}

function buildFallbackViewModel(): DashboardViewModel {
  return buildDashboardViewModel({
    simulationBalance: 10_000,
    baseCurrency: "USD",
    dataDate: "Loading...",
    requestedCurrencies: REQUESTED_CURRENCIES,
    supportedCurrencies: {},
    latestRates: {},
  });
}
