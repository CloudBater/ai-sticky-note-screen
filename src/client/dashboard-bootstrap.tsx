import type { ReactNode } from "react";

import { DashboardApp } from "./DashboardApp";
import {
  buildDashboardViewModel,
  loadDashboardViewModel,
  type DashboardViewModel,
} from "./dashboard";

type MountDashboardOptions = {
  render: (node: ReactNode) => void;
  loadViewModel?: (
    requestedCurrencies?: string[],
    baseCurrency?: string,
  ) => Promise<DashboardViewModel>;
};

const REQUESTED_CURRENCIES = ["USD", "EUR", "JPY", "TWD", "GBP", "CNY", "SGD"];

export async function mountDashboard({
  render,
  loadViewModel = (requestedCurrencies = REQUESTED_CURRENCIES, baseCurrency = "USD") =>
    loadDashboardViewModel({
      baseCurrency,
      simulationBalance: 10_000,
      requestedCurrencies,
    }),
}: MountDashboardOptions): Promise<void> {
  render(<DashboardApp viewModel={buildFallbackViewModel()} />);

  let currentViewModel: DashboardViewModel;
  let currentBaseCurrency = "USD";

  const renderDashboard = (viewModel: DashboardViewModel) => {
    render(
      <DashboardApp
        viewModel={viewModel}
        onBaseCurrencyChange={async (baseCurrency, currencies) => {
          currentBaseCurrency = baseCurrency;

          try {
            const nextViewModel = await loadViewModel(
              currencies,
              currentBaseCurrency,
            );
            currentViewModel = nextViewModel;
            renderDashboard(currentViewModel);
          } catch {
            // Ignore for now
          }
        }}
        onWatchlistChange={async (currencies) => {
          try {
            const nextViewModel = await loadViewModel(
              currencies,
              currentBaseCurrency,
            );
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
    currentViewModel = await loadViewModel(REQUESTED_CURRENCIES, currentBaseCurrency);
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
