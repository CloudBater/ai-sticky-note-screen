import type { ReactNode } from "react";

import { DashboardApp } from "./DashboardApp";
import {
  buildDashboardViewModel,
  loadDashboardViewModel,
  type DashboardViewModel,
} from "./dashboard";

type MountDashboardOptions = {
  render: (node: ReactNode) => void;
  loadViewModel?: (requestedCurrencies?: string[]) => Promise<DashboardViewModel>;
};

const REQUESTED_CURRENCIES = ["USD", "EUR", "JPY", "TWD", "GBP", "CNY", "SGD"];

export async function mountDashboard({
  render,
  loadViewModel = (requestedCurrencies = REQUESTED_CURRENCIES) =>
    loadDashboardViewModel({
      simulationBalance: 10_000,
      requestedCurrencies,
    }),
}: MountDashboardOptions): Promise<void> {
  render(<DashboardApp viewModel={buildFallbackViewModel()} />);

  let currentViewModel: DashboardViewModel;

  const renderDashboard = (viewModel: DashboardViewModel) => {
    render(
      <DashboardApp
        viewModel={viewModel}
        onWatchlistChange={async (currencies) => {
          try {
            const nextViewModel = await loadViewModel(currencies);
            currentViewModel = nextViewModel;
            renderDashboard(currentViewModel);
          } catch {
            // Ignore for now
          }
        }}
      />
    );
  };

  try {
    currentViewModel = await loadViewModel();
    renderDashboard(currentViewModel);
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
