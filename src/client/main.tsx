import React from "react";
import { createRoot } from "react-dom/client";

import { DashboardApp } from "./DashboardApp";
import { buildDashboardViewModel } from "./dashboard-view-model";

const viewModel = buildDashboardViewModel({
  simulationBalance: 10_000,
  baseCurrency: "USD",
  dataDate: "2026-05-23",
  requestedCurrencies: ["USD", "EUR", "JPY", "TWD", "GBP", "CNY", "SGD"],
  supportedCurrencies: {},
  latestRates: {},
});

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DashboardApp viewModel={viewModel} />
  </React.StrictMode>,
);
