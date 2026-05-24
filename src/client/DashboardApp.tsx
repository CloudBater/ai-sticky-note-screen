import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type { DashboardViewModel, LatestRateCard } from "./dashboard";
import {
  Code,
  DisclaimerPanel,
  Eyebrow,
  Num,
  RateCard,
  Tab,
} from "./components";
import {
  addCurrencyToWatchlist,
  buildCurrencyWatchlistEntries,
  normalizeCurrencyCodeInput,
} from "./currency-watchlist";
import { currencyContentTransition } from "./motion";
import {
  applySimulatedConversionToBalance,
  MAX_SIMULATION_BALANCE,
  MIN_SIMULATION_BALANCE,
  normalizeSimulatedConversionAmountInput,
  normalizeSimulationBalanceInput,
} from "./simulation-balance";
import { previewSimulatedConversionViaBackend } from "./simulated-conversion-client";
import {
  addSimulatedConversionToHistory,
  type SimulationHistoryEntry,
} from "./simulation-history";
import type { SimulatedConversionPreview } from "../shared/conversion-preview";
import marketMageIconUrl from "../resources/MarketMage-icon.jpg";

type DashboardAppProps = {
  viewModel: DashboardViewModel;
  onBaseCurrencyChange?: (baseCurrency: string, currencies: string[]) => void;
  onWatchlistChange?: (currencies: string[]) => void;
};

type DashboardSection = "overview" | "trend" | "simulation" | "history";
type CurrencyTransitionState = "idle" | "exiting" | "entering";
type TrendDirection = "up" | "down" | "flat";
type TrendWindowDays = 7 | 14 | 30;

export function DashboardApp({
  viewModel,
  onBaseCurrencyChange,
  onWatchlistChange,
}: DashboardAppProps) {
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("overview");
  const [simulationBalanceAmount, setSimulationBalanceAmount] = useState(
    viewModel.simulationBalance.amount,
  );
  const [simulationBalanceInput, setSimulationBalanceInput] = useState(
    String(viewModel.simulationBalance.amount),
  );
  const [watchlistCurrencies, setWatchlistCurrencies] = useState<string[]>(
    () => [
      ...viewModel.currencySupport.supported,
      ...viewModel.currencySupport.unsupported,
    ],
  );
  const [watchlistCurrencyInput, setWatchlistCurrencyInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownFilter, setDropdownFilter] = useState("");
  const [simulationHistoryEntries, setSimulationHistoryEntries] = useState<
    SimulationHistoryEntry[]
  >(viewModel.simulationHistory.entries);
  const currencyCatalog = viewModel.currencyCatalog ?? {};
  const selectorCurrencies = useMemo(
    () => {
      const baseCurrency = viewModel.latestRates.baseCurrency;
      const selectableCurrencies = new Set(
        viewModel.latestRates.cards.map((card) => card.currency),
      );

      watchlistCurrencies.forEach((currency) => {
        if (currency !== baseCurrency && currencyCatalog[currency]) {
          selectableCurrencies.add(currency);
        }
      });

      return selectableCurrencies.size > 0
        ? [...selectableCurrencies]
        : watchlistCurrencies.filter((currency) => currency !== baseCurrency);
    },
    [
      currencyCatalog,
      viewModel.latestRates.baseCurrency,
      viewModel.latestRates.cards,
      watchlistCurrencies,
    ],
  );
  const watchlistEntries = useMemo(
    () => {
      const supportedCurrencyCodes = new Set(
        viewModel.currencySupport.supported,
      );
      const unsupportedCurrencyCodes = new Set(
        viewModel.currencySupport.unsupported,
      );

      return buildCurrencyWatchlistEntries(
        watchlistCurrencies,
        currencyCatalog,
      ).map((entry) => {
        if (supportedCurrencyCodes.has(entry.currency)) {
          return {
            ...entry,
            supported: true,
          };
        }

        if (unsupportedCurrencyCodes.has(entry.currency)) {
          return {
            ...entry,
            supported: false,
          };
        }

        return entry;
      });
    },
    [
      currencyCatalog,
      viewModel.currencySupport.supported,
      viewModel.currencySupport.unsupported,
      watchlistCurrencies,
    ],
  );
  const [selectedBaseCurrency, setSelectedBaseCurrency] = useState(
    viewModel.latestRates.baseCurrency,
  );
  const [selectedCurrency, setSelectedCurrency] = useState(
    selectorCurrencies[0] ?? viewModel.latestRates.baseCurrency,
  );
  const [trendWindowDays, setTrendWindowDays] = useState<TrendWindowDays>(30);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { displayedCurrency, transitionState } = useDeferredCurrency(
    selectedCurrency,
    prefersReducedMotion,
  );
  const selectedRateCard = findRateCard(
    viewModel.latestRates.cards,
    selectedCurrency,
  );
  const displayedRateCard =
    findRateCard(viewModel.latestRates.cards, displayedCurrency) ??
    selectedRateCard;
  const rateCardsByCurrency = useMemo(
    () =>
      new Map(
        viewModel.latestRates.cards.map((card) => [card.currency, card]),
      ),
    [viewModel.latestRates.cards],
  );
  const conversionExposure = useMemo(
    () =>
      summarizeConversionExposure({
        baseCurrency: viewModel.latestRates.baseCurrency,
        entries: simulationHistoryEntries,
        latestRates: rateCardsByCurrency,
      }),
    [
      rateCardsByCurrency,
      simulationHistoryEntries,
      viewModel.latestRates.baseCurrency,
    ],
  );
  const selectedChartSeries = useMemo(() => {
    const originalBase = viewModel.latestRates.baseCurrency;
    
    // A reference series to get dates if both are originalBase
    const refSeries = viewModel.historicalTrend.allSeries[0] ?? { points: [] };

    // Get target series
    const targetSeries = displayedCurrency === originalBase
      ? { points: refSeries.points.map(p => ({ date: p.date, rate: 1 })) }
      : viewModel.historicalTrend.allSeries.find(
          (series) => series.symbols[0] === displayedCurrency,
        );

    // Get base series
    const baseSeries = selectedBaseCurrency === originalBase
      ? { points: refSeries.points.map(p => ({ date: p.date, rate: 1 })) }
      : viewModel.historicalTrend.allSeries.find(
          (series) => series.symbols[0] === selectedBaseCurrency,
        );

    if (!targetSeries || !baseSeries || !baseSeries.points) {
      return { symbol: displayedCurrency, points: [] };
    }

    const points = targetSeries.points.map((tPoint, index) => {
      const bPoint = baseSeries.points[index];
      const rate = bPoint && bPoint.rate !== 0 ? tPoint.rate / bPoint.rate : 0;
      return { date: tPoint.date, rate };
    });

    return { symbol: displayedCurrency, points };
  }, [displayedCurrency, selectedBaseCurrency, viewModel.historicalTrend.allSeries, viewModel.latestRates.baseCurrency]);
  const displayedChartPoints = useMemo(
    () => selectedChartSeries.points.slice(-trendWindowDays),
    [selectedChartSeries.points, trendWindowDays],
  );
  const trendDirection = getTrendDirection(
    viewModel.historicalTrend.summary,
    displayedRateCard?.currency ?? displayedCurrency,
  );
  const showOverview = activeSection === "overview";
  const showTrend = activeSection === "trend";
  const showSimulation = activeSection === "simulation";
  const showHistory = activeSection === "history";
  useEffect(() => {
    if (
      selectorCurrencies.length > 0 &&
      !selectorCurrencies.includes(selectedCurrency)
    ) {
      setSelectedCurrency(selectorCurrencies[0]);
    }
  }, [selectedCurrency, selectorCurrencies]);

  useEffect(() => {
    setSelectedBaseCurrency(viewModel.latestRates.baseCurrency);
  }, [viewModel.latestRates.baseCurrency]);

  const handleGlobalBaseCurrencyChange = (currency: string) => {
    setSelectedBaseCurrency(currency);
    onBaseCurrencyChange?.(currency, watchlistCurrencies);
  };

  const handleSimulationBalanceChange = (input: string) => {
    setSimulationBalanceInput(input);
    setSimulationBalanceAmount((currentAmount) =>
      normalizeSimulationBalanceInput(input, currentAmount),
    );
  };

  const commitWatchlistCurrency = (currency: string): boolean => {
    const normalizedCurrency = normalizeCurrencyCodeInput(currency);

    if (normalizedCurrency === null) {
      return false;
    }

    const nextCurrencies = addCurrencyToWatchlist(
      watchlistCurrencies,
      normalizedCurrency,
    );

    if (nextCurrencies.length === watchlistCurrencies.length) {
      return false;
    }

    setWatchlistCurrencies(nextCurrencies);
    setSelectedCurrency(normalizedCurrency);
    onWatchlistChange?.(nextCurrencies);

    return true;
  };

  const handleAddCurrency = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!commitWatchlistCurrency(watchlistCurrencyInput)) {
      return;
    }

    setWatchlistCurrencyInput("");
  };

  return (
    <main className="app-shell">
      {/* Header */}
      <header className="app-header" id="overview">
        <div className="header-copy-block">
          <div aria-label="MarketMage brand" className="brand-lockup">
            <span aria-hidden="true" className="brand-icon-frame">
              <img
                alt=""
                className="brand-icon"
                src={marketMageIconUrl}
              />
            </span>
            <h1>{viewModel.title}</h1>
          </div>
          <p className="hero-copy">
            Daily FX reference rates and non-executing simulations.
          </p>
        </div>
        <div className="header-actions">
          <div className="metric-card simulation-balance-card">
            <Eyebrow>Simulation balance</Eyebrow>
            <strong>
              <Num size="m" value={simulationBalanceAmount.toLocaleString("en-US")} />{" "}
              <Code>{viewModel.simulationBalance.currency}</Code>
            </strong>
          </div>
        </div>
      </header>

      {/* Top nav */}
      <nav
        aria-label="Dashboard sections"
        className="tabs"
        data-top-nav-shell="true"
      >
        {viewModel.navigationItems.map((item) => (
          <Tab
            active={activeSection === item.id}
            data-section-target={item.id}
            key={item.id}
            onClick={() => setActiveSection(item.id)}
          >
            {item.label}
          </Tab>
        ))}
      </nav>

      {/* Disclaimer is always visible on every tab. */}
      <DisclaimerPanel />

      {/* Dashboard grid */}
      <div className="dashboard-grid">

        {/* Overview tab */}
        <section
          className="panel watchlist-panel"
          aria-labelledby="watchlist-heading"
          hidden={!showOverview}
        >
          <div className="section-heading">
            <p className="eyebrow">Watchlist</p>
            <h2 id="watchlist-heading">Selected currencies</h2>
          </div>
          <form className="currency-watchlist-form" onSubmit={handleAddCurrency}>
            <label>
              <span>Add currency code</span>
              <input
                aria-label="Add currency to selected currencies"
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={3}
                name="watchlist-currency"
                onChange={(event) => setWatchlistCurrencyInput(event.target.value)}
                placeholder="e.g. CAD"
                spellCheck={false}
                type="text"
                value={watchlistCurrencyInput}
              />
            </label>
            <button type="submit">Add currency</button>
          </form>
          <p className="meta-dim watchlist-note">
            Enter a 3-letter code or select from available currencies below. Unsupported currencies stay visible but muted.
          </p>
          <div className="currency-pills" style={{ marginBottom: "var(--space-4)" }}>
            {watchlistEntries.map((entry) => {
              if (entry.supported) {
                const isBaseCurrency =
                  entry.currency === viewModel.latestRates.baseCurrency;

                return (
                  <button
                    aria-label={`Set ${entry.currency} as base currency`}
                    className="currency-pill currency-pill-supported"
                    data-base-currency={isBaseCurrency ? entry.currency : undefined}
                    key={entry.currency}
                    onClick={() => {
                      setSelectedBaseCurrency(entry.currency);
                      onBaseCurrencyChange?.(entry.currency, watchlistCurrencies);
                    }}
                    title={entry.label}
                    type="button"
                  >
                    <Code>{entry.currency}</Code>
                  </button>
                );
              }

              return (
                <span
                  aria-label={`${entry.currency} unsupported`}
                  className="currency-pill currency-pill-unsupported"
                  key={entry.currency}
                  title={entry.label}
                >
                  <Code>{entry.currency}</Code>
                </span>
              );
            })}
          </div>

          <div className="available-currencies-dropdown">
            <button
              aria-controls="available-currencies-list"
              aria-expanded={isDropdownOpen}
              className="dropdown-toggle"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              type="button"
            >
              Available currencies
              <span className="dropdown-chevron" aria-hidden="true" data-open={isDropdownOpen}>▼</span>
            </button>
            <div
              className="dropdown-content-wrapper"
              data-open={isDropdownOpen}
            >
              <div className="dropdown-content">
                <input
                  aria-label="Filter available currencies"
                  className="dropdown-filter"
                  onChange={(e) => setDropdownFilter(e.target.value)}
                  placeholder="Filter currencies..."
                  type="text"
                  value={dropdownFilter}
                />
                <ul className="dropdown-list" id="available-currencies-list">
                  {Object.entries(currencyCatalog)
                    .filter(([code, name]) => {
                      if (watchlistCurrencies.includes(code)) return false;
                      if (!dropdownFilter) return true;
                      const filterLower = dropdownFilter.toLowerCase();
                      return (
                        code.toLowerCase().includes(filterLower) ||
                        name.toLowerCase().includes(filterLower)
                      );
                    })
                    .map(([code, name]) => (
                      <li key={code}>
                        <button
                          className="dropdown-list-item"
                          onClick={() => {
                            commitWatchlistCurrency(code);
                            setIsDropdownOpen(false);
                            setDropdownFilter("");
                          }}
                          type="button"
                        >
                          <Code>{code}</Code>
                          <span className="currency-name">{name}</span>
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section
          className="panel conversion-exposure-panel"
          aria-labelledby="conversion-exposure-heading"
          hidden={!showOverview}
        >
          <div className="section-heading">
            <p className="eyebrow">Simulation history</p>
            <h2 id="conversion-exposure-heading">Simulated conversion exposure</h2>
          </div>
          {conversionExposure ? (
            <>
              <div className="exposure-summary-grid">
                <div className="exposure-metric exposure-metric-primary">
                  <span className="eyebrow">Amount</span>
                  <strong>
                    <Num
                      size="m"
                      value={formatExposureAmount(
                        conversionExposure.amount,
                      )}
                    />{" "}
                    <Code>{conversionExposure.currency}</Code>
                  </strong>
                </div>
                <div className="exposure-metric">
                  <span className="eyebrow">Avg cost</span>
                  <strong>
                    <Num
                      size="s"
                      value={formatRate(conversionExposure.averageCost)}
                    />{" "}
                    <Code>{conversionExposure.baseCurrency}</Code>
                  </strong>
                </div>
                <div className="exposure-metric">
                  <span className="eyebrow">Reference P/L</span>
                  <strong data-profit-state={conversionExposure.profitState}>
                    <Num
                      size="s"
                      value={formatSignedAmount(
                        conversionExposure.referenceProfit,
                      )}
                    />{" "}
                    <Code>{conversionExposure.baseCurrency}</Code>
                  </strong>
                </div>
              </div>
              <p className="meta-dim">
                {conversionExposure.entryCount} simulated entries. Historical reference only.
              </p>
            </>
          ) : (
            <>
              <p className="empty-state">No simulated conversions yet.</p>
              <p className="meta-dim">
                Preview simulated conversions to see amount, average cost, and reference P/L here.
              </p>
            </>
          )}
          <p className="data-date">
            Data date: <Num size="s" value={viewModel.latestRates.dataDate} />
          </p>
        </section>

        <section
          className="panel rates-panel"
          aria-labelledby="latest-rates-heading"
          data-selected-currency={selectedCurrency}
          hidden={!showOverview}
        >
          <div className="section-heading">
            <p className="eyebrow">Daily reference</p>
            <h2 id="latest-rates-heading">Latest daily reference rates</h2>
          </div>

          {viewModel.latestRates.cards.length > 0 && watchlistCurrencies.length > 0 ? (
            <>
              <div className="rate-grid marquee-container">
                <div className="marquee-content">
                  {watchlistCurrencies.map((code) => {
                    const card = getDisplayRateCard(
                      code,
                      viewModel.latestRates.baseCurrency,
                      rateCardsByCurrency,
                    );
                    return (
                      <RateCard
                        code={code}
                        key={code}
                        label={card.label}
                        onClick={() => setSelectedCurrency(code)}
                        selected={code === selectedCurrency}
                        value={card.value}
                      />
                    );
                  })}
                  {watchlistCurrencies.map((code) => {
                    const card = getDisplayRateCard(
                      code,
                      viewModel.latestRates.baseCurrency,
                      rateCardsByCurrency,
                    );
                    return (
                      <RateCard
                        code={code}
                        key={`${code}-dup`}
                        label={card.label}
                        onClick={() => setSelectedCurrency(code)}
                        selected={code === selectedCurrency}
                        value={card.value}
                      />
                    );
                  })}
                </div>
              </div>
              <div
                className="currency-detail-frame"
                data-transition-state={transitionState}
              >
                {displayedChartPoints.length > 0 ? (
                  <OverviewTrendCard
                      availableCurrencies={watchlistCurrencies}
                      baseCurrency={selectedBaseCurrency}
                      card={displayedRateCard}
                      onBaseCurrencyChange={handleGlobalBaseCurrencyChange}
                      onSymbolChange={setSelectedCurrency}
                      onWindowChange={setTrendWindowDays}
                      points={displayedChartPoints}
                      selectedWindowDays={trendWindowDays}
                      symbol={displayedCurrency}
                      trendDirection={trendDirection}
                    />
                ) : (
                  <p className="empty-state">
                    Historical chart data will appear after daily reference
                    rates load.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="empty-state">No latest reference rates are available.</p>
          )}
        </section>

        {/* Trend tab */}
        <section className="panel trend-panel" hidden={!showTrend} id="trend">
          <div className="section-heading">
            <p className="eyebrow">Historical preview</p>
            <h2>Historical line chart</h2>
          </div>
          {selectedChartSeries.points.length > 0 ? (
            <>
              <div className="trend-kpi-row">
                <div>
                  <span className="eyebrow">Pair</span>
                  <strong>
                    {viewModel.historicalTrend.baseCurrency}/{displayedCurrency}
                  </strong>
                </div>
                <div>
                  <span className="eyebrow">Window</span>
                  <strong>
                    {selectedChartSeries.points.length} daily points
                  </strong>
                </div>
                <div>
                  <span className="eyebrow">Latest reference</span>
                  <strong className="latest-reference-value">
                    {formatRate(
                      selectedChartSeries.points[
                        selectedChartSeries.points.length - 1
                      ]?.rate ?? 0,
                    )}
                  </strong>
                </div>
              </div>
              <div className="trend-layout">
                <div
                  className="chart-window"
                  data-chart-currency={displayedCurrency}
                  data-transition-state={transitionState}
                >
                  <HistoricalLineChart
                    gradientId="trend-area-grad"
                    points={selectedChartSeries.points}
                  />
                </div>
                <TrendStatsColumn points={selectedChartSeries.points} />
              </div>
              <p className="chart-date-range">
                {selectedChartSeries.points[0]?.date} to{" "}
                {selectedChartSeries.points[selectedChartSeries.points.length - 1]?.date}
              </p>
            </>
          ) : (
            <p className="empty-state">
              Historical chart data will appear after daily reference rates
              load.
            </p>
          )}
          <p className="trend-summary">
            Historical movement for {displayedCurrency} is shown as a daily
            line chart, not candlesticks.
          </p>
          <p className="trend-summary">{viewModel.historicalTrend.summary}</p>
        </section>

        {/* Simulation tab */}
        <section
          className="panel simulation-panel"
          hidden={!showSimulation}
          id="simulation"
        >
          <div className="section-heading">
            <p className="eyebrow">Simulation</p>
            <h2>Simulated conversion preview</h2>
          </div>
          <div className="simulation-control-row">
            <article className="simulation-balance-editor" data-layout-slot="amount-left">
              <div className="section-heading">
                <p className="eyebrow">Simulation balance</p>
                <h3>Adjust simulation amount</h3>
              </div>
              <strong className="display-num">
                {simulationBalanceAmount.toLocaleString("en-US")}
                <span className="display-num-unit">
                  {viewModel.simulationBalance.currency}
                </span>
              </strong>
              <label>
                <span>Amount</span>
                <input
                  aria-label="Adjust simulation amount"
                  max={MAX_SIMULATION_BALANCE}
                  min={MIN_SIMULATION_BALANCE}
                  name="simulation-balance-amount"
                  onChange={(event) =>
                    handleSimulationBalanceChange(event.target.value)
                  }
                  step="100"
                  type="number"
                  value={simulationBalanceInput}
                />
              </label>
              <small>Hypothetical amount only.</small>
            </article>
            <SimulatedConversionPreviewCard
              key={viewModel.latestRates.dataDate}
              baseCurrency={viewModel.latestRates.baseCurrency}
              dataDate={viewModel.latestRates.dataDate}
              latestRates={viewModel.latestRates.cards}
              onAddPreview={(preview) => {
                setSimulationHistoryEntries((existingEntries) =>
                  addSimulatedConversionToHistory({
                    existingEntries,
                    preview,
                  }),
                );
                setSimulationBalanceAmount((currentAmount) => {
                  const nextAmount = applySimulatedConversionToBalance(
                    currentAmount,
                    preview.sourceAmount,
                  );

                  setSimulationBalanceInput(String(nextAmount));
                  return nextAmount;
                });
              }}
              onViewHistory={() => setActiveSection("history")}
              simulationBalanceAmount={simulationBalanceAmount}
            />
          </div>
        </section>

        {/* History tab */}
        <section className="panel history-panel" hidden={!showHistory} id="history">
          <div className="section-heading">
            <p className="eyebrow">Review</p>
            <h2>Simulation history</h2>
          </div>
          {simulationHistoryEntries.length > 0 ? (
            <ul className="history-list">
              {simulationHistoryEntries.map((entry) => (
                <li key={entry.id}>
                  <strong>
                    {entry.sourceAmount.toLocaleString("en-US")}{" "}
                    {entry.sourceCurrency}
                  </strong>
                  <span>
                    {entry.convertedAmount.toLocaleString("en-US")}{" "}
                    {entry.targetCurrency}
                  </span>
                  <small>
                    {entry.date} - reference rate {entry.rate}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">
              No simulated conversion entries yet. Preview a simulated
              conversion to build a history.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

/* Trend stats column */
function TrendStatsColumn({
  points,
}: {
  points: { date: string; rate: number }[];
}) {
  if (points.length === 0) return null;

  const highPoint = points.reduce((max, p) => (p.rate > max.rate ? p : max));
  const lowPoint = points.reduce((min, p) => (p.rate < min.rate ? p : min));
  const avg = points.reduce((sum, p) => sum + p.rate, 0) / points.length;

  return (
    <div className="trend-stats">
      <div className="trend-stat-item">
        <p className="stat-label eyebrow">High</p>
        <p className="stat-value">{formatRate(highPoint.rate)}</p>
        <p className="stat-date">{highPoint.date}</p>
      </div>
      <div className="trend-stat-item">
        <p className="stat-label eyebrow">Low</p>
        <p className="stat-value">{formatRate(lowPoint.rate)}</p>
        <p className="stat-date">{lowPoint.date}</p>
      </div>
      <div className="trend-stat-item">
        <p className="stat-label eyebrow">Average</p>
        <p className="stat-value">{formatRate(avg)}</p>
      </div>
    </div>
  );
}

/* Simulated conversion preview card */
function SimulatedConversionPreviewCard({
  baseCurrency,
  dataDate,
  latestRates,
  onAddPreview,
  onViewHistory,
  simulationBalanceAmount,
}: {
  baseCurrency: string;
  dataDate: string;
  latestRates: LatestRateCard[];
  onAddPreview: (preview: SimulatedConversionPreview) => void;
  onViewHistory: () => void;
  simulationBalanceAmount: number;
}) {
  const defaultTargetCurrency = latestRates[0]?.currency ?? baseCurrency;
  const conversionCurrencyOptions = useMemo(
    () => [
      ...new Set([baseCurrency, ...latestRates.map((rate) => rate.currency)]),
    ],
    [baseCurrency, latestRates],
  );
  const [sourceCurrency, setSourceCurrency] = useState(baseCurrency);
  const [targetCurrency, setTargetCurrency] = useState(defaultTargetCurrency);
  const [amount, setAmount] = useState(
    String(Math.min(simulationBalanceAmount, 2500)),
  );
  const [referenceDate, setReferenceDate] = useState(
    dataDate === "Unavailable" || dataDate === "Loading..." ? "" : dataDate,
  );
  const [preview, setPreview] = useState<SimulatedConversionPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [hasAddedToHistory, setHasAddedToHistory] = useState(false);
  const maxConversionAmount = Math.max(0, simulationBalanceAmount);
  const minConversionAmount = simulationBalanceAmount > 0 ? 1 : 0;

  useEffect(() => {
    setAmount((currentAmount) =>
      String(
        normalizeSimulatedConversionAmountInput(
          currentAmount,
          simulationBalanceAmount,
          Math.min(simulationBalanceAmount, 2500),
        ),
      ),
    );
  }, [simulationBalanceAmount]);

  useEffect(() => {
    if (sourceCurrency !== targetCurrency) {
      return;
    }

    const nextTargetCurrency =
      conversionCurrencyOptions.find((currency) => currency !== sourceCurrency) ??
      sourceCurrency;

    setTargetCurrency(nextTargetCurrency);
  }, [conversionCurrencyOptions, sourceCurrency, targetCurrency]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPreviewError(null);
    setIsPreviewing(true);

    const normalizedAmount = normalizeSimulatedConversionAmountInput(
      amount,
      simulationBalanceAmount,
      Math.min(simulationBalanceAmount, 2500),
    );

    setAmount(String(normalizedAmount));

    try {
      setPreview(
        await previewSimulatedConversionViaBackend({
          sourceCurrency,
          targetCurrency,
          amount: normalizedAmount,
          date: referenceDate,
        }),
      );
    } catch {
      setPreview(null);
      setPreviewError("Unable to preview simulated conversion.");
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <article className="conversion-preview-card" data-layout-slot="conversion-right">
      <div className="section-heading">
        <p className="eyebrow">Conversion preview</p>
        <h3>Preview simulated conversion</h3>
      </div>
      <form aria-label="Preview simulated conversion form" onSubmit={handleSubmit}>
        <fieldset className="conversion-controls">
          <legend>No trades are executed.</legend>
          <label>
            <span>Source currency</span>
            <select
              aria-label="Simulated conversion source currency"
              name="simulated-conversion-source-currency"
              onChange={(event) => {
                setSourceCurrency(event.target.value);
                setPreview(null);
                setHasAddedToHistory(false);
              }}
              value={sourceCurrency}
            >
              {conversionCurrencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Target currency</span>
            <select
              aria-label="Simulated conversion target currency"
              name="simulated-conversion-target-currency"
              onChange={(event) => {
                setTargetCurrency(event.target.value);
                setPreview(null);
                setHasAddedToHistory(false);
              }}
              value={targetCurrency}
            >
              {conversionCurrencyOptions
                .filter((currency) => currency !== sourceCurrency)
                .map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
            </select>
          </label>
          <label>
            <span>Amount</span>
            <input
              aria-label="Simulated conversion amount"
              max={maxConversionAmount}
              min={minConversionAmount}
              name="simulated-conversion-amount"
              onChange={(event) => {
                setAmount(event.target.value);
                setPreview(null);
                setHasAddedToHistory(false);
              }}
              step="1"
              type="number"
              value={amount}
            />
          </label>
          <label>
            <span>Reference date</span>
            <input
              aria-label="Simulated conversion reference date"
              name="simulated-conversion-reference-date"
              onChange={(event) => setReferenceDate(event.target.value)}
              type="date"
              value={referenceDate}
            />
          </label>
        </fieldset>
        <div className="conversion-actions">
          <button disabled={isPreviewing || simulationBalanceAmount <= 0} type="submit">
            {isPreviewing ? "Previewing..." : "Preview simulated conversion"}
          </button>
          <button
            disabled={preview === null}
            onClick={() => {
              if (preview) {
                onAddPreview(preview);
                setPreview(null);
                setHasAddedToHistory(true);
              }
            }}
            type="button"
          >
            Add to simulation history
          </button>
        </div>
      </form>
      {preview ? (
        <p className="conversion-result">
          {preview.sourceAmount.toLocaleString("en-US")} {preview.sourceCurrency} ={" "}
          {preview.convertedAmount.toLocaleString("en-US")}{" "}
          {preview.targetCurrency} at daily reference rate {preview.rate}.
        </p>
      ) : null}
      {previewError ? <p className="warning-text">{previewError}</p> : null}
      <p
        aria-live="polite"
        className="conversion-added-confirm"
        hidden={!hasAddedToHistory}
      >
        Added to simulation history.{" "}
        <button
          className="history-link-button"
          data-section-target="history"
          onClick={onViewHistory}
          type="button"
        >
          View simulation history
        </button>
      </p>
      <p className="empty-state">
        Available simulation balance only. Preview only. No trades are executed.
      </p>
    </article>
  );
}

/* Overview trend card */
function OverviewTrendCard({
  availableCurrencies,
  baseCurrency,
  card,
  onBaseCurrencyChange,
  onSymbolChange,
  onWindowChange,
  points,
  selectedWindowDays,
  symbol,
  trendDirection,
}: {
  availableCurrencies: string[];
  baseCurrency: string;
  card: LatestRateCard | undefined;
  onBaseCurrencyChange: (currency: string) => void;
  onSymbolChange: (currency: string) => void;
  onWindowChange: (windowDays: TrendWindowDays) => void;
  points: { date: string; rate: number }[];
  selectedWindowDays: TrendWindowDays;
  symbol: string;
  trendDirection: TrendDirection;
}) {
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  let percentageChange = 0;
  if (firstPoint && lastPoint && firstPoint.rate !== 0) {
    percentageChange = ((lastPoint.rate - firstPoint.rate) / firstPoint.rate) * 100;
  }
  const pctString = percentageChange > 0 ? "+" + percentageChange.toFixed(2) + "%" : percentageChange.toFixed(2) + "%";
  const pctClass = percentageChange > 0 ? "percentage-up" : percentageChange < 0 ? "percentage-down" : "percentage-flat";

  return (
    <article className="currency-detail-card" data-overview-trend={symbol}>
      <div className="overview-trend-header">
        <div>
          <p className="eyebrow">Selected daily trend</p>
          <div className="trend-pair-selector">
            <select
              aria-label="Select base currency"
              className="currency-select"
              onChange={(e) => onBaseCurrencyChange(e.target.value)}
              value={baseCurrency}
            >
              {availableCurrencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="to-text">to</span>
            <select
              aria-label="Select target currency"
              className="currency-select"
              onChange={(e) => onSymbolChange(e.target.value)}
              value={symbol}
            >
              {availableCurrencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className={`trend-percentage ${pctClass}`}>{pctString}</span>
          </div>
        </div>
        <label className="trend-window-control">
          <span>Trend window</span>
          <select
            aria-label="Historical trend range"
            onChange={(event) =>
              onWindowChange(Number(event.target.value) as TrendWindowDays)
            }
            value={selectedWindowDays}
          >
            <option value="7">Last 7 daily points</option>
            <option value="14">Last 14 daily points</option>
            <option value="30">Last 30 daily points</option>
          </select>
        </label>
      </div>
      <div
        className="overview-chart-window"
        data-chart-currency={symbol}
        data-chart-window-days={selectedWindowDays}
      >
        <HistoricalLineChart
          ariaLabel="Overview daily rate trend chart"
          gradientId="overview-area-grad"
          points={points}
        />
      </div>
      <div className="overview-trend-meta">
        <p>
          {firstPoint?.date} to {lastPoint?.date}
        </p>
        <p>
          Latest daily reference:{" "}
          <strong>{formatRate(lastPoint?.rate ?? card?.rate ?? 0)}</strong>
        </p>
      </div>
      {card ? (
        <p className="meta-dim">
          {card.label} &middot; Historical reference only.
        </p>
      ) : (
        <p className="meta-dim">
          Historical reference only.
        </p>
      )}
    </article>
  );
}



/* Historical line chart with area fill, grid lines, and high/low marks */
function HistoricalLineChart({
  ariaLabel = "Historical daily rate line chart",
  gradientId = "hist-area-grad",
  points,
}: {
  ariaLabel?: string;
  gradientId?: string;
  points: { date: string; rate: number }[];
}) {
  if (points.length === 0) {
    return null;
  }

  const width = 800;
  const height = 280;
  const paddingX = 0;
  const paddingY = 16;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const rates = points.map((point) => point.rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const rateRange = maxRate - minRate || 1;

  const coords = points.map((point, index) => {
    const x =
      paddingX + (index / Math.max(points.length - 1, 1)) * chartWidth;
    const y =
      paddingY +
      chartHeight -
      ((point.rate - minRate) / rateRange) * chartHeight;
    return { ...point, x, y };
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const areaD =
    `M${coords.map((c) => `${c.x},${c.y}`).join(" L")} ` +
    `L${width},${height} L0,${height} Z`;

  const gridYs = [0.25, 0.5, 0.75].map(
    (pct) => paddingY + chartHeight * pct,
  );

  const highPoint = coords.reduce((max, p) =>
    p.rate > max.rate ? p : max,
  );
  const lowPoint = coords.reduce((min, p) =>
    p.rate < min.rate ? p : min,
  );

  return (
    <svg
      data-chart-type="historical-line"
      viewBox={`0 0 ${width} ${height}`}
      className="historical-line-chart"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-glow)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      {gridYs.map((y, i) => (
        <line
          key={i}
          x1="0"
          y1={y}
          x2={width}
          y2={y}
          stroke="var(--border-subtle)"
          strokeDasharray="2 4"
        />
      ))}
      <path d={areaD} fill={`url(#${gradientId})`} />
      <polyline
        className="chart-line"
        fill="none"
        points={polylinePoints}
        stroke="var(--accent-dim)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <circle cx={highPoint.x} cy={highPoint.y} r="3.5" fill="var(--accent)" />
      <text x={Math.min(highPoint.x + 8, width - 40)} y={Math.max(highPoint.y - 8, 12)} fill="var(--text-primary)" fontSize="12" fontWeight="bold">
        {formatRate(highPoint.rate)}
      </text>
      <circle cx={lowPoint.x} cy={lowPoint.y} r="3.5" fill="var(--accent)" />
      <text x={Math.min(lowPoint.x + 8, width - 40)} y={Math.min(lowPoint.y + 16, height - 4)} fill="var(--text-primary)" fontSize="12" fontWeight="bold">
        {formatRate(lowPoint.rate)}
      </text>
    </svg>
  );
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(query.matches);

    updatePreference();
    query.addEventListener("change", updatePreference);

    return () => query.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

function useDeferredCurrency(
  selectedCurrency: string,
  reducedMotion: boolean,
): {
  displayedCurrency: string;
  transitionState: CurrencyTransitionState;
} {
  const [displayedCurrency, setDisplayedCurrency] = useState(selectedCurrency);
  const [transitionState, setTransitionState] =
    useState<CurrencyTransitionState>("idle");

  useEffect(() => {
    if (selectedCurrency === displayedCurrency) {
      return;
    }

    if (reducedMotion || typeof window === "undefined") {
      setDisplayedCurrency(selectedCurrency);
      setTransitionState("idle");
      return;
    }

    let enterTimer: number | undefined;
    setTransitionState("exiting");

    const exitTimer = window.setTimeout(() => {
      setDisplayedCurrency(selectedCurrency);
      setTransitionState("entering");
      enterTimer = window.setTimeout(
        () => setTransitionState("idle"),
        currencyContentTransition.enterMs,
      );
    }, currencyContentTransition.exitMs);

    return () => {
      window.clearTimeout(exitTimer);

      if (enterTimer) {
        window.clearTimeout(enterTimer);
      }
    };
  }, [displayedCurrency, reducedMotion, selectedCurrency]);

  return { displayedCurrency, transitionState };
}

function findRateCard(
  cards: LatestRateCard[],
  currency: string,
): LatestRateCard | undefined {
  return cards.find((card) => card.currency === currency);
}

function getDisplayRateCard(
  currency: string,
  baseCurrency: string,
  cardsByCurrency: Map<string, LatestRateCard>,
): { label: string; value: string } {
  if (currency === baseCurrency) {
    return {
      label: `1 ${baseCurrency} = 1 ${baseCurrency}`,
      value: formatRate(1),
    };
  }

  const card = cardsByCurrency.get(currency);

  return {
    label: card?.label ?? `1 ${baseCurrency} = ??? ${currency}`,
    value: card ? formatRate(card.rate) : "---",
  };
}

type ConversionExposureSummary = {
  amount: number;
  averageCost: number;
  baseCurrency: string;
  currency: string;
  entryCount: number;
  profitState: "gain" | "loss" | "flat";
  referenceProfit: number;
};

function summarizeConversionExposure({
  baseCurrency,
  entries,
  latestRates,
}: {
  baseCurrency: string;
  entries: SimulationHistoryEntry[];
  latestRates: Map<string, LatestRateCard>;
}): ConversionExposureSummary | undefined {
  const groups = new Map<
    string,
    {
      amount: number;
      cost: number;
      entryCount: number;
    }
  >();

  entries.forEach((entry) => {
    if (entry.sourceCurrency !== baseCurrency) {
      return;
    }

    if (!latestRates.has(entry.targetCurrency)) {
      return;
    }

    const group = groups.get(entry.targetCurrency) ?? {
      amount: 0,
      cost: 0,
      entryCount: 0,
    };

    group.amount += entry.convertedAmount;
    group.cost += entry.sourceAmount;
    group.entryCount += 1;
    groups.set(entry.targetCurrency, group);
  });

  const [currency, group] =
    [...groups.entries()].sort(
      ([leftCurrency, left], [rightCurrency, right]) =>
        right.cost - left.cost || leftCurrency.localeCompare(rightCurrency),
    )[0] ?? [];

  if (currency === undefined || group === undefined || group.amount === 0) {
    return undefined;
  }

  const latestRate = latestRates.get(currency)?.rate;

  if (latestRate === undefined || latestRate === 0) {
    return undefined;
  }

  const latestReferenceValue = group.amount / latestRate;
  const referenceProfit = latestReferenceValue - group.cost;
  const profitState =
    Math.abs(referenceProfit) < 0.01
      ? "flat"
      : referenceProfit > 0
        ? "gain"
        : "loss";

  return {
    amount: group.amount,
    averageCost: group.cost / group.amount,
    baseCurrency,
    currency,
    entryCount: group.entryCount,
    profitState,
    referenceProfit,
  };
}

function formatExposureAmount(value: number): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function formatSignedAmount(value: number): string {
  const roundedValue = Math.round(value * 100) / 100;
  const sign = roundedValue > 0 ? "+" : "";

  return `${sign}${roundedValue.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

function formatRate(value: number, decimals = getRateDecimals(value)): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getRateDecimals(value: number): number {
  return Math.abs(value) >= 10 ? 2 : 4;
}

function getTrendDirection(summary: string, currency: string): TrendDirection {
  const normalizedSummary = summary.toLowerCase();
  const normalizedCurrency = currency.toLowerCase();

  if (!normalizedSummary.includes(normalizedCurrency)) {
    return "flat";
  }

  if (normalizedSummary.includes("moved up")) {
    return "up";
  }

  if (normalizedSummary.includes("moved down")) {
    return "down";
  }

  return "flat";
}
