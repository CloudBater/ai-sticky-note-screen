import type { ReactNode } from "react";

import { DashboardApp } from "./DashboardApp";
import {
  buildDashboardViewModel,
  loadDashboardViewModel,
  type DashboardViewModel,
} from "./dashboard";

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

  try {
    render(<DashboardApp viewModel={await loadViewModel()} />);
  } catch {
    render(<p role="alert">Unable to load backend reference data.</p>);
  }
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
