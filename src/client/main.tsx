import React from "react";
import { createRoot } from "react-dom/client";

import { mountDashboard } from "./dashboard-bootstrap";

const root = createRoot(document.getElementById("root") as HTMLElement);

void mountDashboard({
  render: (node) => root.render(<React.StrictMode>{node}</React.StrictMode>),
});
