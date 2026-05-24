import {
  useEffect,
  useRef,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  DashboardViewModel,
  HistoricalTrendChartSeries,
  LatestRateCard,
} from "./dashboard";
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
import {
  buildLiveConversionPreview,
  type LiveConversionPreview,
} from "./live-conversion-preview";
import { OnboardingGuide } from "./OnboardingGuide";
import { LoadingScreen } from "./LoadingScreen";
import type { OnboardingStorage } from "./onboarding-visited";

type LoadingState = "loading" | "error" | "ready";

type DashboardAppProps = {
  viewModel: DashboardViewModel;
  loadingState?: LoadingState;
  onBaseCurrencyChange?: (baseCurrency: string, currencies: string[]) => void;
  onboardingStorage?: OnboardingStorage;
  onWatchlistChange?: (currencies: string[]) => void;
};

type DashboardSection = "overview" | "trend" | "simulation" | "history";
type CurrencyTransitionState = "idle" | "exiting" | "entering";
type TrendDirection = "up" | "down" | "flat";
type TrendWindowDays = 7 | 14 | 30;
type HistoryRangePreset = "1Y" | "6M" | "3M" | "1M" | "2W" | "1W";

const historyRangePresets: Array<{
  label: HistoryRangePreset;
  days: number;
}> = [
  { label: "1Y", days: 365 },
  { label: "6M", days: 183 },
  { label: "3M", days: 92 },
  { label: "1M", days: 31 },
  { label: "2W", days: 14 },
  { label: "1W", days: 7 },
];

export function DashboardApp({
  viewModel,
  loadingState,
  onBaseCurrencyChange,
  onboardingStorage,
  onWatchlistChange,
}: DashboardAppProps) {
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("overview");
  const navRef = useRef<HTMLElement>(null);

  // Drive the spring tab-slider indicator
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const activeBtn = nav.querySelector<HTMLButtonElement>(
      '[aria-current="page"]',
    );
    const slider = nav.querySelector<HTMLSpanElement>(".tab-slider");
    if (!activeBtn || !slider) return;

    const navRect = nav.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const x = btnRect.left - navRect.left + nav.scrollLeft;
    const w = btnRect.width;

    slider.style.setProperty("--tab-x", `${x}px`);
    slider.style.setProperty("--tab-w", `${w}px`);
    nav.dataset.sliderReady = "true";
  }, [activeSection]);
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
  const currencyCatalog = viewModel.currencyCatalog ?? EMPTY_CURRENCY_CATALOG;
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
      const supportedSet = new Set(viewModel.currencySupport.supported);
      const unsupportedSet = new Set(viewModel.currencySupport.unsupported);

      return buildCurrencyWatchlistEntries(
        watchlistCurrencies,
        currencyCatalog,
      ).map((entry) => {
        if (supportedSet.has(entry.currency)) {
          return { ...entry, supported: true };
        }
        if (unsupportedSet.has(entry.currency)) {
          return { ...entry, supported: false };
        }
        return entry;
      });
    },
    [watchlistCurrencies, currencyCatalog],
  );
  const [selectedBaseCurrency, setSelectedBaseCurrency] = useState(
    viewModel.latestRates.baseCurrency,
  );
  const [selectedCurrency, setSelectedCurrency] = useState(
    selectorCurrencies[0] ?? viewModel.latestRates.baseCurrency,
  );
  const initialHistoryEndDate = getLatestHistoricalDate(
    viewModel.historicalTrend.allSeries,
    viewModel.latestRates.dataDate,
  );
  const initialHistoryStartDate = getHistoryStartDateForPreset(
    initialHistoryEndDate,
    "1Y",
  );
  const [historyBaseCurrency, setHistoryBaseCurrency] = useState(
    viewModel.latestRates.baseCurrency,
  );
  const [historyVisibleCurrencies, setHistoryVisibleCurrencies] = useState<
    string[]
  >(() => {
    const defaultCurrency =
      selectorCurrencies.find((currency) => currency === "CNY") ??
      selectorCurrencies.find(
        (currency) => currency !== viewModel.latestRates.baseCurrency,
      );

    return defaultCurrency ? [defaultCurrency] : [];
  });
  const [historyRangePreset, setHistoryRangePreset] =
    useState<HistoryRangePreset>("1Y");
  const [historyStartDate, setHistoryStartDate] = useState(
    initialHistoryStartDate,
  );
  const [historyEndDate, setHistoryEndDate] = useState(initialHistoryEndDate);
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
  const historyCurrencyOptions = useMemo(() => {
    const currencies = new Set<string>([viewModel.latestRates.baseCurrency]);

    Object.keys(currencyCatalog).forEach((currency) =>
      currencies.add(currency.toUpperCase()),
    );
    viewModel.latestRates.cards.forEach((card) => currencies.add(card.currency));
    watchlistEntries.forEach((entry) => {
      if (entry.supported) {
        currencies.add(entry.currency);
      }
    });

    return Array.from(currencies).sort();
  }, [
    currencyCatalog,
    viewModel.latestRates.baseCurrency,
    viewModel.latestRates.cards,
    watchlistEntries,
  ]);
  const historyTargetOptions = useMemo(
    () =>
      historyCurrencyOptions.filter(
        (currency) => currency !== historyBaseCurrency,
      ),
    [historyBaseCurrency, historyCurrencyOptions],
  );
  const historyChartSeries = useMemo(
    () =>
      historyVisibleCurrencies
        .filter((currency) => historyTargetOptions.includes(currency))
        .map((currency) => ({
          currency,
          points: buildPairChartPoints({
            baseCurrency: viewModel.latestRates.baseCurrency,
            series: viewModel.historicalTrend.allSeries,
            sourceCurrency: historyBaseCurrency,
            targetCurrency: currency,
          }).filter(
            (point) =>
              point.date >= historyStartDate && point.date <= historyEndDate,
          ),
        }))
        .filter((series) => series.points.length > 0),
    [
      historyBaseCurrency,
      historyEndDate,
      historyStartDate,
      historyTargetOptions,
      historyVisibleCurrencies,
      viewModel.historicalTrend.allSeries,
      viewModel.latestRates.baseCurrency,
    ],
  );
  const conversionExposures = useMemo(
    () =>
      summarizeAllConversionExposures({
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
  // Keep the legacy single-currency accessor for any downstream that still uses it
  const conversionExposure = conversionExposures[0] as ConversionExposureSummary | undefined;
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
    setHistoryBaseCurrency(viewModel.latestRates.baseCurrency);
  }, [viewModel.latestRates.baseCurrency]);

  useEffect(() => {
    const nextEndDate = getLatestHistoricalDate(
      viewModel.historicalTrend.allSeries,
      viewModel.latestRates.dataDate,
    );

    setHistoryEndDate(nextEndDate);
    setHistoryStartDate(
      getHistoryStartDateForPreset(nextEndDate, historyRangePreset),
    );
  }, [
    historyRangePreset,
    viewModel.historicalTrend.allSeries,
    viewModel.latestRates.dataDate,
  ]);

  useEffect(() => {
    if (
      historyBaseCurrency !== viewModel.latestRates.baseCurrency &&
      !historyCurrencyOptions.includes(historyBaseCurrency)
    ) {
      setHistoryBaseCurrency(viewModel.latestRates.baseCurrency);
      return;
    }

    setHistoryVisibleCurrencies((currentCurrencies) => {
      const validCurrencies = currentCurrencies.filter((currency) =>
        historyTargetOptions.includes(currency),
      );

      if (validCurrencies.length > 0) {
        return arraysEqual(validCurrencies, currentCurrencies)
          ? currentCurrencies
          : validCurrencies;
      }

      const defaultCurrency =
        historyTargetOptions.find((currency) => currency === "CNY") ??
        historyTargetOptions[0];

      return defaultCurrency
        ? [defaultCurrency]
        : currentCurrencies.length === 0
          ? currentCurrencies
          : [];
    });
  }, [
    historyBaseCurrency,
    historyCurrencyOptions,
    historyTargetOptions,
    viewModel.latestRates.baseCurrency,
  ]);

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
    <>
      {(loadingState === "loading" || loadingState === "error") && (
        <LoadingScreen variant={loadingState} />
      )}
      <OnboardingGuide storage={onboardingStorage} />
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
            <Eyebrow>Simulation balance </Eyebrow>
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
        ref={navRef}
      >
        {viewModel.navigationItems.map((item, index) => (
          <Tab
            active={activeSection === item.id}
            data-section-index={index}
            data-section-target={item.id}
            key={item.id}
            onClick={() => setActiveSection(item.id)}
          >
            {item.label}
          </Tab>
        ))}
        <span aria-hidden="true" className="tab-slider" />
      </nav>

      {/* Disclaimer is always visible on every tab. */}
      <DisclaimerPanel />

      {/* Dashboard grid */}
      <div className="dashboard-grid">

        {/* Overview tab */}
        <section
          className="panel watchlist-panel"
          aria-labelledby="watchlist-heading"
          data-glass="true"
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
              <span className="dropdown-chevron" aria-hidden="true" data-open={isDropdownOpen}></span>
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
          data-glass="true"
          hidden={!showOverview}
        >
          <div className="section-heading">
            <p className="eyebrow">Simulation history</p>
            <h2 id="conversion-exposure-heading">Simulated conversion exposure</h2>
          </div>
          {conversionExposures.length > 0 ? (
            <ExposureGrid exposures={conversionExposures} />
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
          data-glass="true"
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
        <section className="panel trend-panel" data-glass="true" hidden={!showTrend} id="trend">
          <HistoryReferenceRatesPanel
            dataDate={viewModel.latestRates.dataDate}
            historyAllCurrencies={historyCurrencyOptions}
            historyBaseCurrency={historyBaseCurrency}
            historyChartSeries={historyChartSeries}
            historyEndDate={historyEndDate}
            historyRangePreset={historyRangePreset}
            historyStartDate={historyStartDate}
            historyTargetOptions={historyTargetOptions}
            historyVisibleCurrencies={historyVisibleCurrencies}
            onHistoryBaseCurrencyChange={setHistoryBaseCurrency}
            onHistoryEndDateChange={setHistoryEndDate}
            onHistoryRangePresetChange={setHistoryRangePreset}
            onHistoryStartDateChange={setHistoryStartDate}
            onHistoryVisibleCurrenciesChange={setHistoryVisibleCurrencies}
          />
        </section>

        {/* Simulation tab */}
        <section
          className="panel simulation-panel"
          data-glass="true"
          hidden={!showSimulation}
          id="simulation"
        >
          <div className="section-heading">
            <p className="eyebrow">Simulation</p>
            <h2>Simulated conversion preview</h2>
          </div>
          <SimulationWorkspace
            key={`${viewModel.latestRates.baseCurrency}-${viewModel.latestRates.dataDate}`}
            baseCurrency={viewModel.latestRates.baseCurrency}
            dataDate={viewModel.latestRates.dataDate}
            historicalSeries={viewModel.historicalTrend.allSeries}
            latestRates={viewModel.latestRates.cards}
            onAddPreview={(preview) => {
              setSimulationHistoryEntries((existingEntries) =>
                addSimulatedConversionToHistory({
                  existingEntries,
                  preview,
                }),
              );
              setSimulationBalanceAmount((currentAmount) => {
                if (preview.sourceCurrency !== viewModel.simulationBalance.currency) {
                  return currentAmount;
                }

                const nextAmount = applySimulatedConversionToBalance(
                  currentAmount,
                  preview.sourceAmount,
                );

                setSimulationBalanceInput(String(nextAmount));
                return nextAmount;
              });
            }}
            onViewHistory={() => setActiveSection("history")}
            onSimulationBalanceChange={handleSimulationBalanceChange}
            simulationBalanceAmount={simulationBalanceAmount}
            simulationBalanceCurrency={viewModel.simulationBalance.currency}
            simulationBalanceInput={simulationBalanceInput}
          />
        </section>

        {/* History tab */}
        <section className="panel history-panel" data-glass="true" hidden={!showHistory} id="history">
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
    </>
  );
}

const BADGE_OVERFLOW_THRESHOLD = 10;
const EMPTY_CURRENCY_CATALOG: Record<string, string> = {};

function HistoryReferenceRatesPanel({
  dataDate,
  historyAllCurrencies,
  historyBaseCurrency,
  historyChartSeries,
  historyEndDate,
  historyRangePreset,
  historyStartDate,
  historyTargetOptions,
  historyVisibleCurrencies,
  onHistoryBaseCurrencyChange,
  onHistoryEndDateChange,
  onHistoryRangePresetChange,
  onHistoryStartDateChange,
  onHistoryVisibleCurrenciesChange,
}: {
  dataDate: string;
  historyAllCurrencies: string[];
  historyBaseCurrency: string;
  historyChartSeries: Array<{
    currency: string;
    points: { date: string; rate: number }[];
  }>;
  historyEndDate: string;
  historyRangePreset: HistoryRangePreset;
  historyStartDate: string;
  historyTargetOptions: string[];
  historyVisibleCurrencies: string[];
  onHistoryBaseCurrencyChange: (currency: string) => void;
  onHistoryEndDateChange: (date: string) => void;
  onHistoryRangePresetChange: (preset: HistoryRangePreset) => void;
  onHistoryStartDateChange: (date: string) => void;
  onHistoryVisibleCurrenciesChange: (currencies: string[]) => void;
}) {
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowed = historyVisibleCurrencies.length > BADGE_OVERFLOW_THRESHOLD;
  const visibleBadges = overflowed
    ? historyVisibleCurrencies.slice(0, BADGE_OVERFLOW_THRESHOLD)
    : historyVisibleCurrencies;

  return (
    <div>
      <div className="section-heading">
        <p className="eyebrow">Historical reference</p>
        <h2>Reference rates trend</h2>
      </div>
      <div
        className="history-reference-workspace"
        data-history-chart="multi-currency"
      >
        <div className="history-currency-row">
          <label className="history-base-control">
            <span>Base currency</span>
            <select
              aria-label="History base currency"
              data-history-base-currency={historyBaseCurrency}
              onChange={(event) => {
                const nextBaseCurrency = event.target.value;
                onHistoryBaseCurrencyChange(nextBaseCurrency);
                onHistoryVisibleCurrenciesChange(
                  historyVisibleCurrencies.filter(
                    (currency) => currency !== nextBaseCurrency,
                  ),
                );
              }}
              value={historyBaseCurrency}
            >
              {historyAllCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
          <div className="history-target-control">
            <span>Target currencies</span>
            <div className="history-target-dropdown-wrapper">
              <button
                aria-label="Select target currencies"
                className="history-target-dropdown-trigger"
                onClick={() => setTargetDropdownOpen(!targetDropdownOpen)}
                type="button"
              >
                <span className="dropdown-label">
                  {historyVisibleCurrencies.length > 0
                    ? `${historyVisibleCurrencies.length} selected`
                    : "Target currencies"}
                </span>
                <span className="dropdown-arrow" aria-hidden="true" />
              </button>
              {targetDropdownOpen && (
                <div className="history-target-dropdown-menu">
                  {historyTargetOptions.map((currency) => {
                    const active = historyVisibleCurrencies.includes(currency);
                    return (
                      <button
                        aria-label={`Toggle ${currency} history line`}
                        className="history-target-dropdown-item"
                        data-history-currency={currency}
                        data-history-currency-active={active}
                        key={currency}
                        onClick={() => {
                          if (active) {
                            onHistoryVisibleCurrenciesChange(
                              historyVisibleCurrencies.filter(
                                (c) => c !== currency,
                              ),
                            );
                          } else {
                            onHistoryVisibleCurrenciesChange([
                              ...historyVisibleCurrencies,
                              currency,
                            ]);
                          }
                        }}
                        type="button"
                      >
                        <span className="dropdown-check" aria-hidden="true" data-checked={active} />
                        <Code>{currency}</Code>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {historyVisibleCurrencies.length > 0 && (
            <div className="history-selected-currencies">
              {historyVisibleCurrencies.map((currency) => (
                <span key={currency} className="selected-currency-badge">
                  {currency}
                </span>
              ))}
            </div>
          )}
          {historyVisibleCurrencies.length > 0 && (
            <button
              aria-label="Clear selected currencies"
              className="history-clear-button"
              onClick={() => onHistoryVisibleCurrenciesChange([])}
              type="button"
            />
          )}
        </div>
        <div className="history-range-controls">
          <div className="history-range-presets">
            {historyRangePresets.map((preset) => (
              <button
                aria-pressed={historyRangePreset === preset.label}
                key={preset.label}
                onClick={() => {
                  onHistoryRangePresetChange(preset.label);
                  onHistoryStartDateChange(
                    getHistoryStartDateForPreset(
                      historyEndDate,
                      preset.label,
                    ),
                  );
                }}
                type="button"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <label>
            <span>Start</span>
            <input
              aria-label="History start date"
              onChange={(event) => {
                onHistoryRangePresetChange("1Y");
                onHistoryStartDateChange(event.target.value);
              }}
              type="date"
              value={historyStartDate}
            />
          </label>
          <label>
            <span>End</span>
            <input
              aria-label="History end date"
              max={dataDate}
              onChange={(event) => {
                onHistoryRangePresetChange("1Y");
                onHistoryEndDateChange(event.target.value);
              }}
              type="date"
              value={historyEndDate}
            />
          </label>
        </div>
        {historyChartSeries.length > 0 ? (
          <>
            <div className="history-chart-window">
              <MultiLineHistoryChart
                baseCurrency={historyBaseCurrency}
                series={historyChartSeries}
              />
            </div>
            <div className="history-movement-grid">
              {historyChartSeries.map((series) => (
                <div className="history-movement-card" key={series.currency}>
                  <span className="eyebrow history-pair-label">
                    {historyBaseCurrency}/{series.currency}
                  </span>
                  <strong
                    data-history-movement={getMovementState(series.points)}
                  >
                    <Num
                      size="s"
                      value={formatPercentChange(
                        getPercentChange(series.points),
                      )}
                    />
                  </strong>
                  <small>Range movement</small>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="empty-state">
            Historical reference data will appear after supported currency
            rates load.
          </p>
        )}
        <p className="meta-dim">
          Daily reference rates over the selected range. Historical reference only.
        </p>
      </div>
    </div>
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

function SimulationWorkspace({
  baseCurrency,
  dataDate,
  historicalSeries,
  latestRates,
  onAddPreview,
  onSimulationBalanceChange,
  onViewHistory,
  simulationBalanceAmount,
  simulationBalanceCurrency,
  simulationBalanceInput,
}: {
  baseCurrency: string;
  dataDate: string;
  historicalSeries: HistoricalTrendChartSeries[];
  latestRates: LatestRateCard[];
  onAddPreview: (preview: SimulatedConversionPreview) => void;
  onSimulationBalanceChange: (input: string) => void;
  onViewHistory: () => void;
  simulationBalanceAmount: number;
  simulationBalanceCurrency: string;
  simulationBalanceInput: string;
}) {
  const defaultTargetCurrency = latestRates[0]?.currency ?? baseCurrency;
  const conversionCurrencyOptions = useMemo(
    () => [
      ...new Set([baseCurrency, ...latestRates.map((rate) => rate.currency)]),
    ],
    [baseCurrency, latestRates],
  );
  const defaultAmount = String(Math.min(simulationBalanceAmount, 2500));
  const defaultReferenceDate =
    dataDate === "Unavailable" || dataDate === "Loading..." ? "" : dataDate;
  const [forwardSourceCurrency, setForwardSourceCurrency] =
    useState(baseCurrency);
  const [forwardTargetCurrency, setForwardTargetCurrency] =
    useState(defaultTargetCurrency);
  const [forwardAmount, setForwardAmount] = useState(defaultAmount);
  const [forwardReferenceDate, setForwardReferenceDate] =
    useState(defaultReferenceDate);
  const [reverseSourceCurrency, setReverseSourceCurrency] =
    useState(defaultTargetCurrency);
  const [reverseTargetCurrency, setReverseTargetCurrency] =
    useState(baseCurrency);
  const [reverseAmount, setReverseAmount] = useState(defaultAmount);
  const [reverseReferenceDate, setReverseReferenceDate] =
    useState(defaultReferenceDate);

  useEffect(() => {
    const normalizeAmount = (currentAmount: string) =>
      String(
        normalizeSimulatedConversionAmountInput(
          currentAmount,
          simulationBalanceAmount,
          Math.min(simulationBalanceAmount, 2500),
        ),
      );

    setForwardAmount(normalizeAmount);
    setReverseAmount(normalizeAmount);
  }, [simulationBalanceAmount]);

  useEffect(() => {
    if (forwardSourceCurrency !== forwardTargetCurrency) {
      return;
    }

    setForwardTargetCurrency(
      conversionCurrencyOptions.find(
        (currency) => currency !== forwardSourceCurrency,
      ) ?? forwardSourceCurrency,
    );
  }, [conversionCurrencyOptions, forwardSourceCurrency, forwardTargetCurrency]);

  useEffect(() => {
    if (reverseSourceCurrency !== reverseTargetCurrency) {
      return;
    }

    setReverseTargetCurrency(
      conversionCurrencyOptions.find(
        (currency) => currency !== reverseSourceCurrency,
      ) ?? reverseSourceCurrency,
    );
  }, [conversionCurrencyOptions, reverseSourceCurrency, reverseTargetCurrency]);

  return (
    <div className="simulation-stack">
      <SimulatedConversionRow
        amount={forwardAmount}
        baseCurrency={baseCurrency}
        chartPoints={buildPairChartPoints({
          baseCurrency,
          series: historicalSeries,
          sourceCurrency: forwardSourceCurrency,
          targetCurrency: forwardTargetCurrency,
        })}
        conversionCurrencyOptions={conversionCurrencyOptions}
        dataLayoutPrefix="forward"
        latestRates={latestRates}
        onAddPreview={onAddPreview}
        onAmountChange={setForwardAmount}
        onReferenceDateChange={setForwardReferenceDate}
        onSourceCurrencyChange={setForwardSourceCurrency}
        onTargetCurrencyChange={setForwardTargetCurrency}
        onViewHistory={onViewHistory}
        referenceDate={forwardReferenceDate}
        simulationBalanceAmount={simulationBalanceAmount}
        simulationBalanceCurrency={simulationBalanceCurrency}
        sourceCurrency={forwardSourceCurrency}
        targetCurrency={forwardTargetCurrency}
        title="Forward simulated conversion"
      />
      <SimulatedConversionRow
        amount={reverseAmount}
        baseCurrency={baseCurrency}
        chartPoints={buildPairChartPoints({
          baseCurrency,
          series: historicalSeries,
          sourceCurrency: reverseSourceCurrency,
          targetCurrency: reverseTargetCurrency,
        })}
        conversionCurrencyOptions={conversionCurrencyOptions}
        dataLayoutPrefix="reverse"
        latestRates={latestRates}
        onAddPreview={onAddPreview}
        onAmountChange={setReverseAmount}
        onReferenceDateChange={setReverseReferenceDate}
        onSourceCurrencyChange={setReverseSourceCurrency}
        onTargetCurrencyChange={setReverseTargetCurrency}
        onViewHistory={onViewHistory}
        referenceDate={reverseReferenceDate}
        simulationBalanceAmount={simulationBalanceAmount}
        simulationBalanceCurrency={simulationBalanceCurrency}
        sourceCurrency={reverseSourceCurrency}
        targetCurrency={reverseTargetCurrency}
        title="Reverse simulated conversion"
      />
      <article
        className="simulation-balance-editor simulation-balance-editor-bottom"
        data-layout-slot="amount-bottom"
      >
        <div className="section-heading">
          <p className="eyebrow">Simulation balance</p>
          <h3>Adjust simulation amount</h3>
        </div>
        <strong className="display-num">
          {simulationBalanceAmount.toLocaleString("en-US")}
          <span className="display-num-unit">{simulationBalanceCurrency}</span>
        </strong>
        <label>
          <span>Amount</span>
          <input
            aria-label="Adjust simulation amount"
            max={MAX_SIMULATION_BALANCE}
            min={MIN_SIMULATION_BALANCE}
            name="simulation-balance-amount"
            onChange={(event) => onSimulationBalanceChange(event.target.value)}
            step="100"
            type="number"
            value={simulationBalanceInput}
          />
        </label>
        <small>Hypothetical amount only.</small>
      </article>
    </div>
  );
}

function SimulatedConversionRow({
  amount,
  baseCurrency,
  chartPoints,
  conversionCurrencyOptions,
  dataLayoutPrefix,
  latestRates,
  onAddPreview,
  onAmountChange,
  onReferenceDateChange,
  onSourceCurrencyChange,
  onTargetCurrencyChange,
  onViewHistory,
  referenceDate,
  simulationBalanceAmount,
  simulationBalanceCurrency,
  sourceCurrency,
  targetCurrency,
  title,
}: {
  amount: string;
  baseCurrency: string;
  chartPoints: { date: string; rate: number }[];
  conversionCurrencyOptions: string[];
  dataLayoutPrefix: "forward" | "reverse";
  latestRates: LatestRateCard[];
  onAddPreview: (preview: SimulatedConversionPreview) => void;
  onAmountChange: (amount: string) => void;
  onReferenceDateChange: (date: string) => void;
  onSourceCurrencyChange: (currency: string) => void;
  onTargetCurrencyChange: (currency: string) => void;
  onViewHistory: () => void;
  referenceDate: string;
  simulationBalanceAmount: number;
  simulationBalanceCurrency: string;
  sourceCurrency: string;
  targetCurrency: string;
  title: string;
}) {
  return (
    <div className="simulation-conversion-row" data-conversion-direction={dataLayoutPrefix}>
      <article
        className="simulation-rate-chart"
        data-layout-slot={`${dataLayoutPrefix}-chart-left`}
      >
        <div className="section-heading">
          <p className="eyebrow">Source vs target curve</p>
          <h3>
            <Code>{sourceCurrency}</Code> / <Code>{targetCurrency}</Code>
          </h3>
        </div>
        {/* Direction banner ??? lives on the chart side for visual pairing with the curve */}
        <div className="conversion-direction-banner" data-conversion-direction-label>
          <span className="conversion-direction-giving">
            <span className="eyebrow">Giving</span>
            <strong><Code>{sourceCurrency}</Code></strong>
          </span>
          <span className="conversion-direction-arrow" aria-hidden="true" />
          <span className="conversion-direction-receiving">
            <span className="eyebrow">Receiving</span>
            <strong><Code>{targetCurrency}</Code></strong>
          </span>
        </div>
        {chartPoints.length > 0 ? (
          <div className="simulation-chart-window">
            <HistoricalLineChart
              ariaLabel={`${sourceCurrency} to ${targetCurrency} daily reference line chart`}
              gradientId={`${dataLayoutPrefix}-simulation-area-grad`}
              points={chartPoints}
            />
          </div>
        ) : (
          <p className="empty-state">
            Daily reference curve will appear after historical rates load.
          </p>
        )}
        <p className="sim-disclaimer">
          Available simulation balance only. Preview only. No trades are executed.
        </p>
      </article>
      <SimulatedConversionPreviewCard
        amount={amount}
        baseCurrency={baseCurrency}
        conversionCurrencyOptions={conversionCurrencyOptions}
        dataLayoutPrefix={dataLayoutPrefix}
        latestRates={latestRates}
        onAddPreview={onAddPreview}
        onAmountChange={onAmountChange}
        onReferenceDateChange={onReferenceDateChange}
        onSourceCurrencyChange={onSourceCurrencyChange}
        onTargetCurrencyChange={onTargetCurrencyChange}
        onViewHistory={onViewHistory}
        referenceDate={referenceDate}
        simulationBalanceAmount={simulationBalanceAmount}
        simulationBalanceCurrency={simulationBalanceCurrency}
        sourceCurrency={sourceCurrency}
        targetCurrency={targetCurrency}
        title={title}
      />
    </div>
  );
}

/* Simulated conversion preview card */
function SimulatedConversionPreviewCard({
  baseCurrency,
  amount,
  conversionCurrencyOptions,
  dataLayoutPrefix,
  latestRates,
  onAddPreview,
  onAmountChange,
  onReferenceDateChange,
  onSourceCurrencyChange,
  onTargetCurrencyChange,
  onViewHistory,
  referenceDate,
  simulationBalanceAmount,
  simulationBalanceCurrency,
  sourceCurrency,
  targetCurrency,
  title,
}: {
  amount: string;
  baseCurrency: string;
  conversionCurrencyOptions: string[];
  dataLayoutPrefix: "forward" | "reverse";
  latestRates: LatestRateCard[];
  onAddPreview: (preview: SimulatedConversionPreview) => void;
  onAmountChange: (amount: string) => void;
  onReferenceDateChange: (date: string) => void;
  onSourceCurrencyChange: (currency: string) => void;
  onTargetCurrencyChange: (currency: string) => void;
  onViewHistory: () => void;
  referenceDate: string;
  simulationBalanceAmount: number;
  simulationBalanceCurrency: string;
  sourceCurrency: string;
  targetCurrency: string;
  title: string;
}) {
  const [preview, setPreview] = useState<SimulatedConversionPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [hasAddedToHistory, setHasAddedToHistory] = useState(false);

  // Compute how much of sourceCurrency the user can actually spend,
  // given that their balance is in simulationBalanceCurrency.
  const derivedBalance = computeDerivedBalance({
    balanceAmount: simulationBalanceAmount,
    balanceCurrency: simulationBalanceCurrency,
    baseCurrency,
    latestRates,
    sourceCurrency,
  });
  const isCrossCurrency =
    sourceCurrency.toUpperCase() !== simulationBalanceCurrency.toUpperCase();

  const maxConversionAmount = Math.max(0, derivedBalance);
  const minConversionAmount = derivedBalance > 0 ? 1 : 0;
  const livePreview = buildLiveConversionPreview({
    amount: Number(amount.replaceAll(",", "").trim()),
    baseCurrency,
    latestRates,
    sourceCurrency,
    targetCurrency,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPreviewError(null);
    setIsPreviewing(true);

    const normalizedAmount = normalizeSimulatedConversionAmountInput(
      amount,
      derivedBalance,
      Math.min(derivedBalance, 2500),
    );

    onAmountChange(String(normalizedAmount));

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
    <article
      className="conversion-preview-card"
      data-layout-slot={`${dataLayoutPrefix}-preview-right`}
    >
      <div className="section-heading">
        <p className="eyebrow">Conversion preview</p>
        <h3>{title}</h3>
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
                onSourceCurrencyChange(event.target.value);
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
                onTargetCurrencyChange(event.target.value);
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
            <span>Amount ({sourceCurrency})</span>
            <input
              aria-label="Simulated conversion amount"
              data-amount-currency={sourceCurrency}
              data-derived-balance={maxConversionAmount}
              max={maxConversionAmount}
              min={minConversionAmount}
              name="simulated-conversion-amount"
              onChange={(event) => {
                onAmountChange(event.target.value);
                setPreview(null);
                setHasAddedToHistory(false);
              }}
              step="1"
              type="number"
              value={amount}
            />
          </label>
          {isCrossCurrency && (
            <p className="from-balance-note" data-from-balance-note>
              Your{" "}
              <strong>
                {simulationBalanceAmount.toLocaleString("en-US")}{" "}
                <Code>{simulationBalanceCurrency}</Code>
              </strong>{" "}
              simulation balance converts to approximately{" "}
              <strong>
                {derivedBalance.toLocaleString("en-US")}{" "}
                <Code>{sourceCurrency}</Code>
              </strong>{" "}
              at the daily reference rate. Hypothetical only.
            </p>
          )}
        </fieldset>
        {/* Submit button (left) + reference date (right) share one row */}
        <div className="conversion-submit-row">
          <button
            className="conversion-submit-btn"
            disabled={isPreviewing || simulationBalanceAmount <= 0}
            type="submit"
          >
            {isPreviewing ? "Previewing..." : "Preview simulated conversion"}
          </button>
          <label className="conversion-date-label">
            <span>Reference date</span>
            <input
              aria-label="Simulated conversion reference date"
              name="simulated-conversion-reference-date"
              onChange={(event) => onReferenceDateChange(event.target.value)}
              type="date"
              value={referenceDate}
            />
          </label>
        </div>
      </form>
      {livePreview ? (
        <ConversionResult preview={livePreview} />
      ) : null}
      <div className="conversion-add-row">
        <button
          data-cta="add-to-history"
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
    </article>
  );
}

function ConversionResult({ preview }: { preview: LiveConversionPreview }) {
  return (
    <p className="conversion-result" data-live-preview="true">
      <span className="conversion-result-source">
        <Num size="s" value={preview.sourceAmount.toLocaleString("en-US")} />{" "}
        <Code>{preview.sourceCurrency}</Code>
      </span>{" "}
      ={" "}
      <span className="conversion-result-target">
        <Num
          size="s"
          value={preview.convertedAmount.toLocaleString("en-US")}
        />{" "}
        <Code>{preview.targetCurrency}</Code>
      </span>{" "}
      <span className="conversion-result-rate">
        Rate <Num size="s" value={formatRate(preview.rate)} />
      </span>
    </p>
  );
}

/* Exposure grid ??? 2??2 layout for simulated conversion exposure */
const EXPOSURE_OVERFLOW_THRESHOLD = 4; // overflow kicks in when count > this
const EXPOSURE_VISIBLE_WHEN_OVERFLOW = 3; // visible currency cells in overflow mode

function ExposureCurrencyCell({
  exposure,
}: {
  exposure: ConversionExposureSummary;
}) {
  return (
    <div className="exposure-grid-cell" data-exposure-grid-cell>
      <div className="exposure-cell-currency">
        <Code>{exposure.currency}</Code>
      </div>
      <div className="exposure-metric exposure-metric-primary">
        <span className="eyebrow">Amount</span>
        <strong>
          <Num size="m" value={formatExposureAmount(exposure.amount)} />{" "}
          <Code>{exposure.currency}</Code>
        </strong>
      </div>
      <div className="exposure-metric">
        <span className="eyebrow">Avg cost</span>
        <strong>
          <Num size="s" value={formatRate(exposure.averageCost)} />{" "}
          <Code>{exposure.baseCurrency}</Code>
        </strong>
      </div>
      <div className="exposure-metric">
        <span className="eyebrow">Reference P/L</span>
        <strong data-profit-state={exposure.profitState}>
          <Num size="s" value={formatSignedAmount(exposure.referenceProfit)} />{" "}
          <Code>{exposure.baseCurrency}</Code>
        </strong>
      </div>
      <p className="meta-dim">
        {exposure.entryCount} simulated{" "}
        {exposure.entryCount === 1 ? "entry" : "entries"}. Historical reference only.
      </p>
    </div>
  );
}

function ExposureGrid({
  exposures,
}: {
  exposures: ConversionExposureSummary[];
}) {
  const gridSize = exposures.length;
  const hasOverflow = gridSize > EXPOSURE_OVERFLOW_THRESHOLD;
  const visibleExposures = hasOverflow
    ? exposures.slice(0, EXPOSURE_VISIBLE_WHEN_OVERFLOW)
    : exposures;
  const overflowCount = hasOverflow
    ? gridSize - EXPOSURE_VISIBLE_WHEN_OVERFLOW
    : 0;

  return (
    <>
      <div
        className="exposure-multi-grid"
        data-exposure-grid-size={String(gridSize)}
      >
        {visibleExposures.map((exposure) => (
          <ExposureCurrencyCell key={exposure.currency} exposure={exposure} />
        ))}
        {overflowCount > 0 && (
          <div
            className="exposure-grid-cell exposure-grid-overflow"
            data-exposure-grid-cell
            data-exposure-overflow
          >
            <span className="exposure-overflow-count">+{overflowCount}</span>
            <span className="exposure-overflow-label">more currencies</span>
          </div>
        )}
      </div>
      <p className="meta-dim">
        Historical reference only. No trades are executed.
      </p>
    </>
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

function MultiLineHistoryChart({
  baseCurrency,
  series,
}: {
  baseCurrency: string;
  series: Array<{
    currency: string;
    points: { date: string; rate: number }[];
  }>;
}) {
  const allPoints = series.flatMap((chartSeries) => chartSeries.points);

  if (allPoints.length === 0) {
    return null;
  }

  const width = 800;
  const height = 320;
  const paddingX = 28;
  const paddingY = 24;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const rates = allPoints.map((point) => point.rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const rateRange = maxRate - minRate || 1;
  const palette = [
    "var(--text-primary)",
    "var(--up)",
    "var(--down)",
    "var(--text-secondary)",
    "var(--text-tertiary)",
  ];

  const maxY = paddingY + chartHeight - ((maxRate - minRate) / rateRange) * chartHeight;
  const minY = paddingY + chartHeight;

  return (
    <svg
      aria-label={`${baseCurrency} reference rates comparison line chart`}
      className="history-multi-line-chart"
      data-chart-type="history-multi-line"
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
    >
      {[0.25, 0.5, 0.75].map((pct) => (
        <line
          key={pct}
          stroke="var(--border-subtle)"
          strokeDasharray="2 4"
          x1={paddingX}
          x2={width - paddingX}
          y1={paddingY + chartHeight * pct}
          y2={paddingY + chartHeight * pct}
        />
      ))}
      <line
        stroke="var(--text-tertiary)"
        strokeDasharray="1 3"
        x1={paddingX}
        x2={width - paddingX}
        y1={maxY}
        y2={maxY}
      />
      <text
        fill="var(--text-tertiary)"
        fontFamily="var(--font-mono)"
        fontSize="10"
        x={paddingX + 4}
        y={maxY - 4}
      >
        High: {formatRate(maxRate)}
      </text>
      <line
        stroke="var(--text-tertiary)"
        strokeDasharray="1 3"
        x1={paddingX}
        x2={width - paddingX}
        y1={minY}
        y2={minY}
      />
      <text
        fill="var(--text-tertiary)"
        fontFamily="var(--font-mono)"
        fontSize="10"
        x={paddingX + 4}
        y={minY + 12}
      >
        Low: {formatRate(minRate)}
      </text>
      {series.map((chartSeries, seriesIndex) => {
        const points = chartSeries.points.map((point, pointIndex) => {
          const x =
            paddingX +
            (pointIndex / Math.max(chartSeries.points.length - 1, 1)) *
              chartWidth;
          const y =
            paddingY +
            chartHeight -
            ((point.rate - minRate) / rateRange) * chartHeight;

          return { ...point, x, y };
        });
        const polylinePoints = points
          .map((point) => `${point.x},${point.y}`)
          .join(" ");
        const lastPoint = points[points.length - 1];

        return (
          <g key={chartSeries.currency}>
            <polyline
              fill="none"
              points={polylinePoints}
              stroke={palette[seriesIndex % palette.length]}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            {lastPoint ? (
              <>
                <circle
                  cx={lastPoint.x}
                  cy={lastPoint.y}
                  fill={palette[seriesIndex % palette.length]}
                  r="3.5"
                />
                <text
                  fill="var(--text-primary)"
                  fontFamily="var(--font-mono)"
                  fontSize="12"
                  x={Math.min(lastPoint.x + 8, width - 72)}
                  y={Math.max(lastPoint.y - 8, 14)}
                >
                  {chartSeries.currency}
                </text>
              </>
            ) : null}
          </g>
        );
      })}
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
    label: card?.label ?? `1 ${baseCurrency} = ${currency}`,
    value: card ? formatRate(card.rate) : "---",
  };
}

function buildPairChartPoints({
  baseCurrency,
  series,
  sourceCurrency,
  targetCurrency,
}: {
  baseCurrency: string;
  series: HistoricalTrendChartSeries[];
  sourceCurrency: string;
  targetCurrency: string;
}): { date: string; rate: number }[] {
  const normalizedBase = baseCurrency.toUpperCase();
  const normalizedSource = sourceCurrency.toUpperCase();
  const normalizedTarget = targetCurrency.toUpperCase();
  const dates = [
    ...new Set(
      series.flatMap((chartSeries) =>
        chartSeries.points.map((point) => point.date),
      ),
    ),
  ].sort();

  return dates.flatMap((date) => {
    const sourceRate = readHistoricalRateForCurrency({
      baseCurrency: normalizedBase,
      currency: normalizedSource,
      date,
      series,
    });
    const targetRate = readHistoricalRateForCurrency({
      baseCurrency: normalizedBase,
      currency: normalizedTarget,
      date,
      series,
    });

    if (
      sourceRate === undefined ||
      targetRate === undefined ||
      sourceRate === 0
    ) {
      return [];
    }

    return [{ date, rate: targetRate / sourceRate }];
  });
}

function readHistoricalRateForCurrency({
  baseCurrency,
  currency,
  date,
  series,
}: {
  baseCurrency: string;
  currency: string;
  date: string;
  series: HistoricalTrendChartSeries[];
}): number | undefined {
  if (currency === baseCurrency) {
    return 1;
  }

  return series
    .find((chartSeries) => chartSeries.symbols[0]?.toUpperCase() === currency)
    ?.points.find((point) => point.date === date)?.rate;
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

function buildExposureGroups({
  baseCurrency,
  entries,
  latestRates,
}: {
  baseCurrency: string;
  entries: SimulationHistoryEntry[];
  latestRates: Map<string, LatestRateCard>;
}): ConversionExposureSummary[] {
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

  const sorted = [...groups.entries()].sort(
    ([leftCurrency, left], [rightCurrency, right]) =>
      right.cost - left.cost || leftCurrency.localeCompare(rightCurrency),
  );

  const result: ConversionExposureSummary[] = [];

  for (const [currency, group] of sorted) {
    if (group.amount === 0) continue;

    const latestRate = latestRates.get(currency)?.rate;
    if (latestRate === undefined || latestRate === 0) continue;

    const latestReferenceValue = group.amount / latestRate;
    const referenceProfit = latestReferenceValue - group.cost;
    const profitState =
      Math.abs(referenceProfit) < 0.01
        ? "flat"
        : referenceProfit > 0
          ? "gain"
          : "loss";

    result.push({
      amount: group.amount,
      averageCost: group.cost / group.amount,
      baseCurrency,
      currency,
      entryCount: group.entryCount,
      profitState,
      referenceProfit,
    });
  }

  return result;
}

function summarizeConversionExposure({
  baseCurrency,
  entries,
  latestRates,
}: {
  baseCurrency: string;
  entries: SimulationHistoryEntry[];
  latestRates: Map<string, LatestRateCard>;
}): ConversionExposureSummary | undefined {
  return buildExposureGroups({ baseCurrency, entries, latestRates })[0];
}

function summarizeAllConversionExposures({
  baseCurrency,
  entries,
  latestRates,
}: {
  baseCurrency: string;
  entries: SimulationHistoryEntry[];
  latestRates: Map<string, LatestRateCard>;
}): ConversionExposureSummary[] {
  return buildExposureGroups({ baseCurrency, entries, latestRates });
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

function getLatestHistoricalDate(
  series: HistoricalTrendChartSeries[],
  fallbackDate: string,
): string {
  const latestDate = series
    .flatMap((chartSeries) => chartSeries.points.map((point) => point.date))
    .sort()
    .at(-1);

  return latestDate ?? (isDateOnlyString(fallbackDate) ? fallbackDate : "");
}

function getHistoryStartDateForPreset(
  endDate: string,
  preset: HistoryRangePreset,
): string {
  if (!isDateOnlyString(endDate)) {
    return "";
  }

  const presetDays =
    historyRangePresets.find((option) => option.label === preset)?.days ?? 365;
  const parsedDate = new Date(`${endDate}T00:00:00.000Z`);

  parsedDate.setUTCDate(parsedDate.getUTCDate() - presetDays);

  return parsedDate.toISOString().slice(0, 10);
}

function getPercentChange(points: { rate: number }[]): number {
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  if (!firstPoint || !lastPoint || firstPoint.rate === 0) {
    return 0;
  }

  return ((lastPoint.rate - firstPoint.rate) / firstPoint.rate) * 100;
}

function formatPercentChange(value: number): string {
  const sign = value > 0 ? "+" : "";

  return `${sign}${value.toFixed(2)}%`;
}

function getMovementState(points: { rate: number }[]): "up" | "down" | "flat" {
  const percentChange = getPercentChange(points);

  if (Math.abs(percentChange) < 0.01) {
    return "flat";
  }

  return percentChange > 0 ? "up" : "down";
}

function isDateOnlyString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Compute how much of `sourceCurrency` is available given a balance in
 * `balanceCurrency`. When they match the raw balance is returned. When
 * they differ, the cross-rate is derived via the shared base currency.
 *
 * Example: 10 000 USD balance, source = EUR, base = USD, EUR rate = 0.901
 *   ??? 10 000 ?? (0.901 / 1.0) = 9 010 EUR available
 */
function computeDerivedBalance({
  balanceAmount,
  balanceCurrency,
  baseCurrency,
  latestRates,
  sourceCurrency,
}: {
  balanceAmount: number;
  balanceCurrency: string;
  baseCurrency: string;
  latestRates: LatestRateCard[];
  sourceCurrency: string;
}): number {
  const normalizedBalance = balanceCurrency.toUpperCase();
  const normalizedSource = sourceCurrency.toUpperCase();

  if (normalizedBalance === normalizedSource) {
    return balanceAmount;
  }

  // Build a map of [currency ??? units per base]
  const ratesByCode = new Map<string, number>([[baseCurrency.toUpperCase(), 1]]);
  latestRates.forEach((card) => {
    ratesByCode.set(card.currency.toUpperCase(), card.rate);
  });

  const balancePerBase = ratesByCode.get(normalizedBalance);
  const sourcePerBase = ratesByCode.get(normalizedSource);

  if (
    balancePerBase === undefined ||
    sourcePerBase === undefined ||
    balancePerBase <= 0
  ) {
    // Rate unknown ??? fall back to raw balance so the form stays usable
    return balanceAmount;
  }

  // cross-rate: how many sourceUnits per 1 balanceUnit
  const crossRate = sourcePerBase / balancePerBase;
  return Math.floor(balanceAmount * crossRate);
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
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
