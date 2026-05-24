import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";

import type {
  DashboardAllocationPreview,
  DashboardViewModel,
  LatestRateCard,
} from "./dashboard";
import marketMageIconUrl from "../resources/MarketMage-icon.jpg";
import { previewPortfolioAllocation } from "../shared/portfolio-preview";
import {
  cardHoverMotion,
  chartSwitchTransition,
  currencyContentTransition,
  currencyTabTransition,
} from "./motion";
import {
  getInitialDashboardTheme,
  persistDashboardTheme,
  type DashboardTheme,
} from "./dashboard-theme";
import {
  MAX_SIMULATION_BALANCE,
  MIN_SIMULATION_BALANCE,
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
type CssVars = CSSProperties & Record<`--${string}`, string | number>;
type TrendDirection = "up" | "down" | "flat";
type TrendWindowDays = 7 | 14 | 30;

export function DashboardApp({ viewModel }: DashboardAppProps) {
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("overview");
  const [theme, setTheme] = useState<DashboardTheme>(getInitialDashboardTheme);
  const [simulationBalanceAmount, setSimulationBalanceAmount] = useState(
    viewModel.simulationBalance.amount,
  );
  const [simulationBalanceInput, setSimulationBalanceInput] = useState(
    String(viewModel.simulationBalance.amount),
  );
  const [simulationHistoryEntries, setSimulationHistoryEntries] = useState<
    SimulationHistoryEntry[]
  >(viewModel.simulationHistory.entries);
  const watchlistCurrencies = useMemo(
    () => [
      ...viewModel.currencySupport.supported,
      ...viewModel.currencySupport.unsupported,
    ],
    [viewModel.currencySupport.supported, viewModel.currencySupport.unsupported],
  );
  const selectorCurrencies = useMemo(
    () =>
      viewModel.latestRates.cards.length > 0
        ? viewModel.latestRates.cards.map((card) => card.currency)
        : watchlistCurrencies,
    [viewModel.latestRates.cards, watchlistCurrencies],
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
  const selectedCurrencyIndex = Math.max(
    selectorCurrencies.indexOf(selectedCurrency),
    0,
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
  const appMotionStyle: CssVars = {
    "--currency-tab-duration": `${currencyTabTransition.durationMs}ms`,
    "--currency-content-exit": `${currencyContentTransition.exitMs}ms`,
    "--currency-content-enter": `${currencyContentTransition.enterMs}ms`,
    "--chart-switch-duration": `${chartSwitchTransition.durationMs}ms`,
    "--card-hover-duration": `${cardHoverMotion.durationMs}ms`,
    "--card-hover-y": `${cardHoverMotion.translateY}px`,
    "--card-hover-scale": cardHoverMotion.scale,
    "--motion-ease": currencyTabTransition.easing,
  };
  const selectorStyle: CssVars = {
    "--currency-count": Math.max(selectorCurrencies.length, 1),
    "--active-currency-index": selectedCurrencyIndex,
  };

  useEffect(() => {
    if (
      selectorCurrencies.length > 0 &&
      !selectorCurrencies.includes(selectedCurrency)
    ) {
      setSelectedCurrency(selectorCurrencies[0]);
    }
  }, [selectedCurrency, selectorCurrencies]);

  useEffect(() => {
    persistDashboardTheme(theme);
  }, [theme]);

  const handleSimulationBalanceChange = (input: string) => {
    setSimulationBalanceInput(input);
    setSimulationBalanceAmount((currentAmount) =>
      normalizeSimulationBalanceInput(input, currentAmount),
    );
  };

  return (
    <main className="app-shell" data-theme={theme} style={appMotionStyle}>
      <header className="app-header" id="overview">
        <div className="header-copy-block">
          <div aria-label="MarketMage brand" className="brand-lockup">
            <img
              alt=""
              aria-hidden="true"
              className="brand-icon"
              src={marketMageIconUrl}
            />
            <h1>{viewModel.title}</h1>
          </div>
          <p className="hero-copy">
            Daily FX reference rates and non-executing simulations.
          </p>
        </div>
        <div className="header-actions">
          <button
            aria-label="Toggle dashboard theme"
            aria-pressed={theme === "dark"}
            className="theme-toggle"
            onClick={() =>
              setTheme((currentTheme) =>
                currentTheme === "light" ? "dark" : "light",
              )
            }
            type="button"
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
          <div className="metric-card simulation-balance-card">
            <span>Simulation balance</span>
            <strong>
              {simulationBalanceAmount.toLocaleString("en-US")}{" "}
              {viewModel.simulationBalance.currency}
            </strong>
          </div>
        </div>
      </header>

      <nav
        aria-label="Dashboard sections"
        className="top-nav"
        data-top-nav-shell="true"
      >
        <div className="top-nav-inner">
          {viewModel.navigationItems.map((item) => (
            <button
              aria-current={activeSection === item.id ? "page" : undefined}
              data-section-target={item.id}
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <section aria-label="Reference and safety notes" className="trust-strip">
        <p className="eyebrow">Reference &amp; Safety</p>
        <p className="disclaimer-title">What this product is, and isn't.</p>
        <ul className="trust-list">
          {viewModel.trustMessages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </section>

      <div className="dashboard-grid">
        <section
          className="panel watchlist-panel"
          aria-labelledby="watchlist-heading"
          hidden={!showOverview}
        >
          <div className="section-heading">
            <p className="eyebrow">Watchlist</p>
            <h2 id="watchlist-heading">Selected currencies</h2>
          </div>
          <div className="currency-pills">
            {watchlistCurrencies.map((currency) => (
              <span key={currency}>{currency}</span>
            ))}
          </div>
        </section>

        <section
          className="panel support-panel"
          aria-labelledby="currency-support-heading"
          hidden={!showOverview}
        >
          <div className="section-heading">
            <p className="eyebrow">Reference coverage</p>
            <h2 id="currency-support-heading">Supported currencies</h2>
          </div>
          <p className="support-list">
            {viewModel.currencySupport.supported.join(", ") || "Loading..."}
          </p>
          <h3>Unsupported requested currencies</h3>
          <p className="warning-text">
            {viewModel.currencySupport.unsupported.join(", ") || "None"}
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
            <p className="data-date">
              Data date: {viewModel.latestRates.dataDate}
            </p>
          </div>

          {selectorCurrencies.length > 0 ? (
            <div
              className="currency-selector"
              data-currency-selector="true"
              style={selectorStyle}
            >
              <span
                aria-hidden="true"
                className="currency-active-indicator"
                data-motion-role="active-currency-indicator"
              />
              {selectorCurrencies.map((currency) => (
                <button
                  aria-pressed={selectedCurrency === currency}
                  className="currency-tab"
                  key={currency}
                  onClick={() => setSelectedCurrency(currency)}
                  type="button"
                >
                  {currency}
                </button>
              ))}
            </div>
          ) : null}

          {viewModel.latestRates.cards.length > 0 ? (
            <>
              <div className="rate-grid">
                {viewModel.latestRates.cards.map((card) => (
                  <button
                    className="rate-card"
                    data-active={
                      card.currency === selectedCurrency ? "true" : undefined
                    }
                    key={card.currency}
                    onClick={() => setSelectedCurrency(card.currency)}
                    type="button"
                  >
                    <span>{card.currency}</span>
                    <strong>{formatRate(card.rate)}</strong>
                    <small>{card.label}</small>
                  </button>
                ))}
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

        <section className="panel trend-panel" hidden={!showTrend} id="trend">
          <div className="section-heading">
            <p className="eyebrow">Historical preview</p>
            <h2>Historical line chart</h2>
          </div>
          {selectedChartSeries.points.length > 0 ? (
            <>
              <div className="trend-kpi-row">
                <div>
                  <span>Pair</span>
                  <strong>
                    {viewModel.historicalTrend.baseCurrency}/{displayedCurrency}
                  </strong>
                </div>
                <div>
                  <span>Date range</span>
                  <strong>
                    {selectedChartSeries.points[0]?.date} to{" "}
                    {
                      selectedChartSeries.points[
                        selectedChartSeries.points.length - 1
                      ]?.date
                    }
                  </strong>
                </div>
                <div>
                  <span>Latest rate</span>
                  <strong>
                    {formatRate(
                      selectedChartSeries.points[
                        selectedChartSeries.points.length - 1
                      ]?.rate ?? 0,
                    )}
                  </strong>
                </div>
              </div>
              <div
                className="chart-window"
                data-chart-currency={displayedCurrency}
                data-transition-state={transitionState}
              >
                <HistoricalLineChart points={selectedChartSeries.points} />
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
          <p>
            Historical movement for {displayedCurrency} is shown as a daily
            line chart, not candlesticks.
          </p>
          <p className="trend-summary">{viewModel.historicalTrend.summary}</p>
        </section>

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
              <strong>
                {simulationBalanceAmount.toLocaleString("en-US")}{" "}
                {viewModel.simulationBalance.currency}
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
              onAddPreview={(preview) =>
                setSimulationHistoryEntries((existingEntries) =>
                  addSimulatedConversionToHistory({
                    existingEntries,
                    preview,
                  }),
                )
              }
              simulationBalanceAmount={simulationBalanceAmount}
            />
          </div>
          <AllocationPreviewCard
            key={viewModel.allocationPreview.status}
            preview={viewModel.allocationPreview}
            startingAmount={simulationBalanceAmount}
          />
        </section>

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

function SimulatedConversionPreviewCard({
  baseCurrency,
  dataDate,
  latestRates,
  onAddPreview,
  simulationBalanceAmount,
}: {
  baseCurrency: string;
  dataDate: string;
  latestRates: LatestRateCard[];
  onAddPreview: (preview: SimulatedConversionPreview) => void;
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
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPreviewError(null);
    setIsPreviewing(true);

    try {
      setPreview(
        await previewSimulatedConversionViaBackend({
          sourceCurrency: baseCurrency,
          targetCurrency,
          amount: Number(amount),
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
              min="1"
              name="simulated-conversion-amount"
              onChange={(event) => setAmount(event.target.value)}
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
          <button disabled={isPreviewing} type="submit">
            {isPreviewing ? "Previewing..." : "Preview simulated conversion"}
          </button>
          <button
            disabled={preview === null}
            onClick={() => {
              if (preview) {
                onAddPreview(preview);
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
          {preview.sourceAmount.toLocaleString("en-US")} {preview.sourceCurrency} =
          {" "}
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
        <span>View simulation history in the History tab.</span>
      </p>
      <p className="empty-state">
        Preview only. No trades are executed.
      </p>
    </article>
  );
}

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
      <p>{configuredPreview.summary}</p>
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
            <input
              aria-label="First allocation percent"
              max="95"
              min="5"
              name="first-allocation-percent"
              onChange={(event) => setFirstPercent(Number(event.target.value))}
              step="5"
              type="range"
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
  const paddingX = 18;
  const paddingY = 18;
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

  return (
    <svg
      aria-label="Historical allocation value line chart"
      className="allocation-history-chart"
      data-chart-type="allocation-history-line"
      viewBox={`0 0 ${width} ${height}`}
    >
      <line
        className="allocation-chart-grid"
        x1={paddingX}
        x2={width - paddingX}
        y1={height - paddingY}
        y2={height - paddingY}
      />
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
      {card ? <p>{card.label}</p> : null}
      <MarketStatus direction={trendDirection} />
    </article>
  );
}

function MarketStatus({ direction }: { direction: TrendDirection }) {
  if (direction === "flat") {
    return (
      <p className="market-status market-status-flat">
        <span className="market-status-note">Historical reference only.</span>
      </p>
    );
  }

  const arrow = direction === "up" ? "↑" : "↓";

  return (
    <p className={`market-status market-status-${direction}`}>
      <span aria-hidden="true" className="market-pct">{arrow}</span>
      {direction === "up" ? "Moved up" : "Moved down"}
      <span aria-hidden="true" className="market-status-note"> · </span>
      <span className="market-status-note">Historical reference only.</span>
    </p>
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

function HistoricalLineChart({
  ariaLabel = "Historical daily rate line chart",
  points,
}: {
  ariaLabel?: string;
  points: { date: string; rate: number }[];
}) {
  if (points.length === 0) {
    return null;
  }

  const width = 600;
  const height = 200;
  const paddingX = 0;
  const paddingY = 16;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const rates = points.map((point) => point.rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const rateRange = maxRate - minRate || 1;
  const polylinePoints = points
    .map((point, index) => {
      const x = paddingX + (index / Math.max(points.length - 1, 1)) * chartWidth;
      const y =
        paddingY +
        chartHeight -
        ((point.rate - minRate) / rateRange) * chartHeight;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      data-chart-type="historical-line"
      viewBox={`0 0 ${width} ${height}`}
      className="historical-line-chart"
      aria-label={ariaLabel}
    >
      <polyline
        fill="none"
        points={polylinePoints}
        stroke="var(--accent)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function roundDisplayAmount(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatDisplayAmount(value: number, currency: string): string {
  return `${value.toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })} ${currency}`;
}
