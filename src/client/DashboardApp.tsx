import type { DashboardViewModel } from "./dashboard-view-model";

type DashboardAppProps = {
  viewModel: DashboardViewModel;
};

export function DashboardApp({ viewModel }: DashboardAppProps) {
  return (
    <main>
      <header>
        <h1>{viewModel.title}</h1>
        <p>
          {viewModel.simulationBalanceLabel}:{" "}
          {viewModel.simulationBalance.amount.toLocaleString("en-US")}{" "}
          {viewModel.simulationBalance.currency}
        </p>
      </header>

      <section aria-label="Trust notes">
        <ul>
          {viewModel.trustMessages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="currency-support-heading">
        <h2 id="currency-support-heading">Supported currencies</h2>
        <p>{viewModel.currencySupport.supported.join(", ")}</p>
        <h3>Unsupported requested currencies</h3>
        <p>{viewModel.currencySupport.unsupported.join(", ") || "None"}</p>
      </section>

      <section aria-labelledby="latest-rates-heading">
        <h2 id="latest-rates-heading">Latest daily reference rates</h2>
        <p>Data date: {viewModel.latestRates.dataDate}</p>
        <ul>
          {viewModel.latestRates.cards.map((card) => (
            <li key={card.currency}>{card.label}</li>
          ))}
        </ul>
      </section>

      <nav aria-label="Dashboard sections">
        {viewModel.navigationItems.map((item) => (
          <a href={`#${item.id}`} key={item.id}>
            {item.label}
          </a>
        ))}
      </nav>
    </main>
  );
}
