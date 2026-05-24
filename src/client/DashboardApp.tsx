import {
  useEffect,
  useMemo,
  useRef,
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
  numberTransition,
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
  const chartBars = useMemo(
    () => buildChartBars(displayedCurrency),
    [displayedCurrency],
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
      <header className="hero-panel" id="overview">
        <div className="hero-copy-block">
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
            Daily reference rates and simulations for understanding currency
            movement, with no execution path.
          </p>
        </div>
        <div className="hero-side">
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
          <div className="metric-card hero-balance-card">
            <span>{viewModel.simulationBalanceLabel}</span>
            <strong>
              {simulationBalanceAmount.toLocaleString("en-US")}{" "}
              {viewModel.simulationBalance.currency}
            </strong>
            <small>Simulation balance only</small>
            <label className="simulation-amount-control">
              <span>Adjust simulation amount</span>
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
              <small>Hypothetical amount only</small>
            </label>
          </div>
        </div>
      </header>

      <section aria-label="Trust notes" className="trust-banner">
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
                {displayedRateCard ? (
                  <CurrencyDetailCard
                    baseCurrency={viewModel.latestRates.baseCurrency}
                    card={displayedRateCard}
                    reducedMotion={prefersReducedMotion}
                    trendDirection={trendDirection}
                  />
                ) : (
                  <p className="empty-state">
                    Select a supported currency to preview the latest daily
                    reference rate.
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
          <div
            className="chart-window"
            data-chart-currency={displayedCurrency}
            data-transition-state={transitionState}
          >
            <div className="line-chart-preview" aria-hidden="true">
              {chartBars.map((height, index) => {
                const barStyle: CssVars = {
                  "--bar-height": `${height}%`,
                };

                return <span key={`${displayedCurrency}-${index}`} style={barStyle} />;
              })}
            </div>
          </div>
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
          <p>
            Preview a simulated conversion using daily reference rates before
            adding it to simulation history.
          </p>
          <div className="simulation-preview-layout">
            <AllocationPreviewCard
              preview={viewModel.allocationPreview}
              startingAmount={simulationBalanceAmount}
            />
            <SimulatedConversionPreviewCard
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

      <nav
        aria-label="Dashboard sections"
        className="bottom-nav"
        data-bottom-nav-shell="true"
      >
        <div className="bottom-nav-inner">
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
    dataDate === "Unavailable" ? "" : dataDate,
  );
  const [preview, setPreview] = useState<SimulatedConversionPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
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
      <p className="empty-state">
        Preview only. Daily reference rates are informational and no simulated
        conversion becomes a real transaction.
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
    <article className="allocation-preview-card" data-layout-slot="allocation-left">
      <div className="section-heading">
        <p className="eyebrow">Manual allocation</p>
        <h3>Manual allocation historical preview</h3>
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
          <div className="allocation-points">
            {configuredPreview.points.map((point) => (
              <span key={point.date}>
                <small>{point.date}</small>
                <strong>{point.label}</strong>
              </span>
            ))}
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

function CurrencyDetailCard({
  baseCurrency,
  card,
  reducedMotion,
  trendDirection,
}: {
  baseCurrency: string;
  card: LatestRateCard;
  reducedMotion: boolean;
  trendDirection: TrendDirection;
}) {
  return (
    <article className="currency-detail-card" data-currency-detail={card.currency}>
      <div>
        <p className="eyebrow">Selected rate</p>
        <h3>
          {baseCurrency} to {card.currency}
        </h3>
      </div>
      <AnimatedRate
        decimals={getRateDecimals(card.rate)}
        reducedMotion={reducedMotion}
        value={card.rate}
      />
      <p>{card.label}</p>
      <MarketStatus direction={trendDirection} />
    </article>
  );
}

function AnimatedRate({
  decimals,
  reducedMotion,
  value,
}: {
  decimals: number;
  reducedMotion: boolean;
  value: number;
}) {
  const animatedValue = useAnimatedNumber(
    value,
    numberTransition.durationMs,
    reducedMotion,
  );

  return (
    <strong className="animated-rate" data-rate-value={value}>
      {formatRate(animatedValue, decimals)}
    </strong>
  );
}

function MarketStatus({ direction }: { direction: TrendDirection }) {
  const label =
    direction === "up"
      ? "Historical move up"
      : direction === "down"
        ? "Historical move down"
        : "Historical movement pending";
  const marker = direction === "up" ? "+" : direction === "down" ? "-" : "=";

  return (
    <p className={`market-status market-status-${direction}`}>
      <span aria-hidden="true">{marker}</span>
      {label}. Historical reference only.
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

function useAnimatedNumber(
  value: number,
  durationMs: number,
  reducedMotion: boolean,
): number {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    if (reducedMotion || typeof window === "undefined") {
      previousValue.current = value;
      setDisplayValue(value);
      return;
    }

    const from = previousValue.current;
    const difference = value - from;
    const start = window.performance.now();
    let animationFrame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(from + difference * easedProgress);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(tick);
      } else {
        previousValue.current = value;
      }
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [durationMs, reducedMotion, value]);

  return displayValue;
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

function buildChartBars(currency: string): number[] {
  const seed = Array.from(currency).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return [38, 62, 48, 72, 58, 82].map(
    (height, index) => 28 + ((height + seed + index * 11) % 56),
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
