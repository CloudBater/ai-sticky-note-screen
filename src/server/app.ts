import type { IncomingMessage, ServerResponse } from "node:http";

export function createApp() {
  return (request: IncomingMessage, response: ServerResponse) => {
    if (request.method === "GET" && request.url === "/api/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ status: "ok" }));
      return;
    }

    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
  };
}
