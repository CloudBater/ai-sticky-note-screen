import {
  fetchDashboardReferenceData,
  type DashboardReferenceData,
} from "./dashboard-api";
import {
  buildDashboardViewModel,
  type DashboardViewModel,
} from "./dashboard-view-model";

type FetchReferenceData = (input: {
  baseCurrency: string;
  symbols: string[];
}) => Promise<DashboardReferenceData>;

export type LoadDashboardViewModelInput = {
  simulationBalance: number;
  requestedCurrencies: string[];
  fetchReferenceData?: FetchReferenceData;
};

export async function loadDashboardViewModel(
  input: LoadDashboardViewModelInput,
): Promise<DashboardViewModel> {
  const baseCurrency = "USD";
  const symbols = input.requestedCurrencies
    .map((currency) => currency.toUpperCase())
    .filter((currency) => currency !== baseCurrency);
  const fetchReferenceData =
    input.fetchReferenceData ?? fetchDashboardReferenceData;
  const referenceData = await fetchReferenceData({
    baseCurrency,
    symbols,
  });

  return buildDashboardViewModel({
    simulationBalance: input.simulationBalance,
    baseCurrency: referenceData.latestRates.base,
    dataDate: referenceData.latestRates.date,
    requestedCurrencies: input.requestedCurrencies,
    supportedCurrencies: referenceData.currencies,
    latestRates: referenceData.latestRates.rates,
  });
}
