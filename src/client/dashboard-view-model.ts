import { splitRequestedCurrenciesBySupport } from "../shared/currency-support";

export type DashboardViewModelInput = {
  simulationBalance: number;
  baseCurrency: string;
  dataDate: string;
  requestedCurrencies: string[];
  supportedCurrencies: Record<string, string>;
  latestRates: Record<string, number>;
};

export type DashboardViewModel = {
  title: "MarketMage";
  simulationBalanceLabel: "Hypothetical starting balance";
  simulationBalance: {
    amount: number;
    currency: string;
  };
  trustMessages: string[];
  navigationItems: NavigationItem[];
  currencySupport: {
    supported: string[];
    unsupported: string[];
  };
  latestRates: {
    baseCurrency: string;
    dataDate: string;
    cards: LatestRateCard[];
  };
};

export type LatestRateCard = {
  currency: string;
  label: string;
  rate: number;
};

export type NavigationItem = {
  id: "overview" | "trend" | "simulation" | "history";
  label: string;
};

export function buildDashboardViewModel(
  input: DashboardViewModelInput,
): DashboardViewModel {
  const baseCurrency = input.baseCurrency.toUpperCase();
  const currencySupport = splitRequestedCurrenciesBySupport(
    input.requestedCurrencies,
    input.supportedCurrencies,
  );
  const cards = Object.entries(input.latestRates)
    .sort(([leftCurrency], [rightCurrency]) =>
      leftCurrency.localeCompare(rightCurrency),
    )
    .map(([currency, rate]) => {
      const normalizedCurrency = currency.toUpperCase();

      return {
        currency: normalizedCurrency,
        label: `1 ${baseCurrency} = ${rate} ${normalizedCurrency}`,
        rate,
      };
    });

  return {
    title: "MarketMage",
    simulationBalanceLabel: "Hypothetical starting balance",
    simulationBalance: {
      amount: input.simulationBalance,
      currency: baseCurrency,
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
    currencySupport,
    latestRates: {
      baseCurrency,
      dataDate: input.dataDate,
      cards,
    },
  };
}
