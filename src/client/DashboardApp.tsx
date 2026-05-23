import type { DashboardViewModel } from "./dashboard";

type DashboardAppProps = {
  viewModel: DashboardViewModel;
};

export function DashboardApp({ viewModel }: DashboardAppProps) {
  const watchlistCurrencies = [
    ...viewModel.currencySupport.supported,
    ...viewModel.currencySupport.unsupported,
  ];

  return (
    <main className="app-shell">
      <header className="hero-panel" id="overview">
        <div>
          <p className="eyebrow">Safe FX reference dashboard</p>
          <h1>{viewModel.title}</h1>
          <p className="hero-copy">
            Daily reference rates and simulations for understanding currency
            movement, with no execution path.
          </p>
        </div>
        <div className="metric-card">
          <span>{viewModel.simulationBalanceLabel}</span>
          <strong>
            {viewModel.simulationBalance.amount.toLocaleString("en-US")}{" "}
            {viewModel.simulationBalance.currency}
          </strong>
          <small>Simulation balance only</small>
        </div>
      </header>

      <section aria-label="Trust notes" className="trust-banner">
        <ul className="trust-list">
          {viewModel.trustMessages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </section>

      <section aria-label="Main actions" className="action-strip">
        <button className="secondary-action" type="button">
          View Historical Trend
        </button>
        <button className="secondary-action" type="button">
          Adjust Simulation Amount
        </button>
        <button className="primary-action" type="button">
          Preview Simulated Conversion
        </button>
        <button className="secondary-action" type="button">
          Review Simulation History
        </button>
      </section>

      <div className="dashboard-grid">
        <section className="panel watchlist-panel" aria-labelledby="watchlist-heading">
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
        >
          <div className="section-heading">
            <p className="eyebrow">Daily reference</p>
            <h2 id="latest-rates-heading">Latest daily reference rates</h2>
          </div>
          <p className="data-date">Data date: {viewModel.latestRates.dataDate}</p>
          {viewModel.latestRates.cards.length > 0 ? (
            <div className="rate-grid">
              {viewModel.latestRates.cards.map((card) => (
                <article className="rate-card" key={card.currency}>
                  <span>{card.currency}</span>
                  <strong>{card.rate.toLocaleString("en-US")}</strong>
                  <small>{card.label}</small>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">No latest reference rates are available.</p>
          )}
        </section>

        <section className="panel trend-panel" id="trend">
          <div className="section-heading">
            <p className="eyebrow">Historical preview</p>
            <h2>Historical line chart</h2>
          </div>
          <div className="line-chart-preview" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <p>
            Historical movement will be shown as a daily line chart, not
            candlesticks.
          </p>
          <p className="trend-summary">{viewModel.historicalTrend.summary}</p>
        </section>

        <section className="panel simulation-panel" id="simulation">
          <div className="section-heading">
            <p className="eyebrow">Simulation</p>
            <h2>Simulated conversion preview</h2>
          </div>
          <p>
            Preview a simulated conversion using daily reference rates before
            adding it to simulation history.
          </p>
        </section>

        <section className="panel history-panel" id="history">
          <div className="section-heading">
            <p className="eyebrow">Review</p>
            <h2>Simulation history</h2>
          </div>
          <p className="empty-state">
            No simulated conversion entries yet. Preview a simulated conversion
            to build a history.
          </p>
        </section>
      </div>

      <nav aria-label="Dashboard sections" className="bottom-nav">
        {viewModel.navigationItems.map((item) => (
          <a
            aria-current={item.id === "overview" ? "page" : undefined}
            href={`#${item.id}`}
            key={item.id}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </main>
  );
}
