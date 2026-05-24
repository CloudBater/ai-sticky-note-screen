import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  DashboardAllocationPreview,
  DashboardViewModel,
  LatestRateCard,
} from "./dashboard";
import {
  Code,
  DisclaimerPanel,
  Eyebrow,
  Num,
  RateCard,
  Slider,
  Tab,
} from "./components";
import {
  addCurrencyToWatchlist,
  buildCurrencyWatchlistEntries,
  normalizeCurrencyCodeInput,
} from "./currency-watchlist";
import { previewPortfolioAllocation } from "../shared/portfolio-preview";
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

type DashboardAppProps = {
  viewModel: DashboardViewModel;
};

type DashboardSection = "overview" | "trend" | "simulation" | "history";
type CurrencyTransitionState = "idle" | "exiting" | "entering";
type TrendDirection = "up" | "down" | "flat";
type TrendWindowDays = 7 | 14 | 30;

export function DashboardApp({ viewModel }: DashboardAppProps) {
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
  const selectorCurrencies = useMemo(
    () =>
      viewModel.latestRates.cards.length > 0
        ? viewModel.latestRates.cards.map((card) => card.currency)
        : watchlistCurrencies,
    [viewModel.latestRates.cards, watchlistCurrencies],
  );
  const currencyCatalog = viewModel.currencyCatalog ?? {};
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
  const selectedChartSeries = useMemo(
    () =>
      viewModel.historicalTrend.allSeries.find(
        (series) => series.symbol === displayedCurrency,
      ) ?? { symbol: displayedCurrency, points: [] },
    [displayedCurrency, viewModel.historicalTrend.allSeries],
  );
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

  const handleSimulationBalanceChange = (input: string) => {
    setSimulationBalanceInput(input);
    setSimulationBalanceAmount((currentAmount) =>
      normalizeSimulationBalanceInput(input, currentAmount),
    );
  };

  const handleAddCurrency = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedCurrency = normalizeCurrencyCodeInput(
      watchlistCurrencyInput,
    );

    if (normalizedCurrency === null) {
      return;
    }

    setWatchlistCurrencies((currentCurrencies) =>
      addCurrencyToWatchlist(currentCurrencies, normalizedCurrency),
    );
    setWatchlistCurrencyInput("");
  };

  return (
    <main className="app-shell">
      {/* Header */}
      <header className="app-header" id="overview">
        <div className="header-copy-block">
          <div aria-label="MarketMage brand" className="brand-lockup">
            <span aria-hidden="true" className="brand-mark">M</span>
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
            {watchlistEntries.map((entry) => (
              <span
                aria-label={
                  entry.supported ? entry.label : `${entry.currency} unsupported`
                }
                className={
                  entry.supported
                    ? "currency-pill currency-pill-supported"
                    : "currency-pill currency-pill-unsupported"
                }
                key={entry.currency}
                title={entry.label}
              >
                <Code>{entry.currency}</Code>
              </span>
            ))}
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
                            setWatchlistCurrencies((current) =>
                              addCurrencyToWatchlist(current, code),
                            );
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
          className="panel data-coverage-panel"
          aria-labelledby="data-coverage-heading"
          hidden={!showOverview}
        >
          <div className="section-heading">
            <p className="eyebrow">Upstream data</p>
            <h2 id="data-coverage-heading">Frankfurter ECB reference</h2>
          </div>
          <p className="meta">
            Daily reference rates, updated once per business day.
          </p>
          <p className="meta-dim">
            Not suitable for transactions.
          </p>
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
                    const card = viewModel.latestRates.cards.find(c => c.currency === code);
                    return (
                      <RateCard
                        code={code}
                        key={code}
                        label={card?.label ?? `1 ${viewModel.latestRates.baseCurrency} = ??? ${code}`}
                        onClick={() => setSelectedCurrency(code)}
                        selected={code === selectedCurrency}
                        value={card ? formatRate(card.rate) : "---"}
                      />
                    );
                  })}
                  {watchlistCurrencies.map((code) => {
                    const card = viewModel.latestRates.cards.find(c => c.currency === code);
                    return (
                      <RateCard
                        code={code}
                        key={`${code}-dup`}
                        label={card?.label ?? `1 ${viewModel.latestRates.baseCurrency} = ??? ${code}`}
                        onClick={() => setSelectedCurrency(code)}
                        selected={code === selectedCurrency}
                        value={card ? formatRate(card.rate) : "---"}
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
                    baseCurrency={viewModel.latestRates.baseCurrency}
                    card={displayedRateCard}
                    points={displayedChartPoints}
                    selectedWindowDays={trendWindowDays}
                    symbol={displayedCurrency}
                    trendDirection={trendDirection}
                    onWindowChange={setTrendWindowDays}
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
          <AllocationPreviewCard
            key={viewModel.allocationPreview.status}
            preview={viewModel.allocationPreview}
            startingAmount={simulationBalanceAmount}
          />
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
          sourceCurrency: baseCurrency,
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
              defaultValue={baseCurrency}
            >
              <option value={baseCurrency}>{baseCurrency}</option>
            </select>
          </label>
          <label>
            <span>Target currency</span>
            <select
              aria-label="Simulated conversion target currency"
              name="simulated-conversion-target-currency"
              onChange={(event) => setTargetCurrency(event.target.value)}
              value={targetCurrency}
            >
              {[baseCurrency, ...latestRates.map((rate) => rate.currency)].map(
                (currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ),
              )}
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
              step="100"
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

/* Allocation preview card */
function AllocationPreviewCard({
  preview,
  startingAmount,
}: {
  preview: DashboardAllocationPreview;
  startingAmount: number;
}) {
  const [firstCurrency, setFirstCurrency] = useState(
    preview.allocations[0]?.currency ?? preview.baseCurrency,
  );
  const [secondCurrency, setSecondCurrency] = useState(
    preview.allocations[1]?.currency ??
      preview.currencyOptions.find((option) => option.currency !== firstCurrency)
        ?.currency ??
      preview.baseCurrency,
  );
  const [firstPercent, setFirstPercent] = useState(
    preview.allocations[0]?.percent ?? 50,
  );
  const configuredPreview = buildConfiguredAllocationPreview({
    firstCurrency,
    firstPercent,
    preview,
    secondCurrency,
    startingAmount,
  });
  const canConfigure =
    preview.status === "ready" && preview.currencyOptions.length >= 2;

  return (
    <article className="allocation-preview-card" data-layout-slot="allocation-history">
      <div className="section-heading">
        <p className="eyebrow">Allocation history</p>
        <h3>Allocation history preview</h3>
      </div>
      <p className="meta">
        {configuredPreview.summary}
      </p>
      {canConfigure ? (
        <fieldset className="allocation-controls">
          <legend>Choose currencies and allocation</legend>
          <label>
            <span>First currency</span>
            <select
              aria-label="First allocation currency"
              name="first-allocation-currency"
              onChange={(event) => setFirstCurrency(event.target.value)}
              value={firstCurrency}
            >
              {preview.currencyOptions.map((option) => (
                <option key={option.currency} value={option.currency}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Second currency</span>
            <select
              aria-label="Second allocation currency"
              name="second-allocation-currency"
              onChange={(event) => setSecondCurrency(event.target.value)}
              value={secondCurrency}
            >
              {preview.currencyOptions.map((option) => (
                <option key={option.currency} value={option.currency}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="allocation-slider">
            <span>{firstPercent}% first currency</span>
            <Slider
              aria-label="First allocation percent"
              ariaLabel="First allocation percent"
              max="95"
              min="5"
              name="first-allocation-percent"
              onChange={(event) => setFirstPercent(Number(event.target.value))}
              step="5"
              value={firstPercent}
            />
          </label>
        </fieldset>
      ) : null}
      {configuredPreview.status === "ready" ? (
        <>
          <div className="allocation-pills">
            {configuredPreview.allocations.map((allocation) => (
              <span key={allocation.currency}>{allocation.label}</span>
            ))}
          </div>
          <div className="allocation-chart-window">
            <AllocationHistoryLineChart
              points={configuredPreview.points}
              summary={configuredPreview.allocations
                .map((allocation) => allocation.label)
                .join(" / ")}
            />
          </div>
          <div className="allocation-summary-row">
            <span>
              {configuredPreview.points[0]?.date} to{" "}
              {configuredPreview.points[configuredPreview.points.length - 1]?.date}
            </span>
            <span>
              Latest simulated value{" "}
              <strong>
                {
                  configuredPreview.points[configuredPreview.points.length - 1]
                    ?.label
                }
              </strong>
            </span>
            <span>Historical reference only.</span>
          </div>
        </>
      ) : (
        <p className="empty-state">
          Historical allocation preview will appear after daily history loads.
        </p>
      )}
    </article>
  );
}

/* Allocation history line chart */
function AllocationHistoryLineChart({
  points,
  summary,
}: {
  points: { date: string; value: number; label: string }[];
  summary: string;
}) {
  if (points.length === 0) {
    return null;
  }

  const width = 720;
  const height = 220;
  const paddingX = 0;
  const paddingY = 16;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  const coordinates = points.map((point, index) => {
    const x =
      paddingX + (index / Math.max(points.length - 1, 1)) * chartWidth;
    const y =
      paddingY +
      chartHeight -
      ((point.value - minValue) / valueRange) * chartHeight;

    return { ...point, x, y };
  });
  const polylinePoints = coordinates
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const areaD =
    `M${coordinates.map((c) => `${c.x},${c.y}`).join(" L")} ` +
    `L${width},${height} L0,${height} Z`;
  const gridYs = [0.25, 0.5, 0.75].map(
    (pct) => paddingY + chartHeight * pct,
  );

  return (
    <svg
      aria-label="Historical allocation value line chart"
      className="allocation-history-chart"
      data-chart-type="allocation-history-line"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="alloc-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-glow)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      {gridYs.map((y, i) => (
        <line
          key={i}
          className="allocation-chart-grid"
          x1={paddingX}
          x2={width - paddingX}
          y1={y}
          y2={y}
          strokeDasharray="2 4"
        />
      ))}
      <path d={areaD} fill="url(#alloc-area-grad)" />
      <polyline
        className="allocation-chart-line"
        fill="none"
        points={polylinePoints}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coordinates.map((point) => (
        <g className="allocation-chart-point" key={point.date} tabIndex={0}>
          <circle cx={point.x} cy={point.y} r="4" />
          <title>{`${point.date}: ${point.label} - ${summary}`}</title>
          <text
            className="allocation-chart-tooltip"
            x={Math.min(point.x + 10, width - 190)}
            y={Math.max(point.y - 12, 24)}
          >
            {point.date}: {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* Overview trend card */
function OverviewTrendCard({
  baseCurrency,
  card,
  onWindowChange,
  points,
  selectedWindowDays,
  symbol,
  trendDirection,
}: {
  baseCurrency: string;
  card: LatestRateCard | undefined;
  onWindowChange: (windowDays: TrendWindowDays) => void;
  points: { date: string; rate: number }[];
  selectedWindowDays: TrendWindowDays;
  symbol: string;
  trendDirection: TrendDirection;
}) {
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  return (
    <article className="currency-detail-card" data-overview-trend={symbol}>
      <div className="overview-trend-header">
        <div>
          <p className="eyebrow">Selected daily trend</p>
          <h3>
            {baseCurrency} to {symbol}
          </h3>
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
          {card.label}
        </p>
      ) : null}
      <MarketStatus direction={trendDirection} />
    </article>
  );
}

/* Market status */
function MarketStatus({ direction }: { direction: TrendDirection }) {
  if (direction === "flat") {
    return (
      <p className="market-status market-status-flat">
        <span className="market-status-note">Historical reference only.</span>
      </p>
    );
  }

  const arrow = direction === "up" ? "��" : "��";

  return (
    <p className={`market-status market-status-${direction}`}>
      <span aria-hidden="true" className="market-pct">{arrow}</span>
      {direction === "up" ? "Moved up" : "Moved down"}
      <span aria-hidden="true" className="market-status-note"> �P </span>
      <span className="market-status-note">Historical reference only.</span>
    </p>
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
      <circle cx={lowPoint.x} cy={lowPoint.y} r="3.5" fill="var(--accent)" />
    </svg>
  );
}

/* Utility helpers */

function buildConfiguredAllocationPreview({
  firstCurrency,
  firstPercent,
  preview,
  secondCurrency,
  startingAmount,
}: {
  firstCurrency: string;
  firstPercent: number;
  preview: DashboardAllocationPreview;
  secondCurrency: string;
  startingAmount: number;
}): DashboardAllocationPreview {
  const secondPercent = 100 - firstPercent;

  if (
    preview.status !== "ready" ||
    firstCurrency === secondCurrency ||
    firstPercent <= 0 ||
    secondPercent <= 0
  ) {
    return preview;
  }

  try {
    const configuredPreview = previewPortfolioAllocation({
      baseCurrency: preview.baseCurrency,
      startingAmount,
      allocations: [
        { currency: firstCurrency, percent: firstPercent },
        { currency: secondCurrency, percent: secondPercent },
      ],
      referenceRatesByDate: preview.referenceRatesByDate,
    });
    const points = configuredPreview.points.map((point) => {
      const value = roundDisplayAmount(point.value);

      return {
        date: point.date,
        value,
        label: formatDisplayAmount(value, preview.baseCurrency),
      };
    });
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    if (firstPoint === undefined || lastPoint === undefined) {
      return preview;
    }

    return {
      ...preview,
      summary: `Manual ${firstPercent}% ${firstCurrency} / ${secondPercent}% ${secondCurrency} allocation moved from ${firstPoint.label} to ${lastPoint.label}. Historical reference only.`,
      allocations: [
        {
          currency: firstCurrency,
          percent: firstPercent,
          label: `${firstPercent}% ${firstCurrency}`,
        },
        {
          currency: secondCurrency,
          percent: secondPercent,
          label: `${secondPercent}% ${secondCurrency}`,
        },
      ],
      points,
    };
  } catch {
    return preview;
  }
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

function roundDisplayAmount(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatDisplayAmount(value: number, currency: string): string {
  return `${value.toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })} ${currency}`;
}
