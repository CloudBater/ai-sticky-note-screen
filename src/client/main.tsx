import React from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <main>
      <h1>MarketMage</h1>
      <p>Daily reference rates, not real-time quotes.</p>
    </main>
  </React.StrictMode>,
);
