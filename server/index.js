import { createApp } from "./app.js";

const port = Number(process.env.PORT || 3001);

createApp().listen(port, () => {
  console.log(`MarketMage API listening on http://127.0.0.1:${port}`);
});
