# ── Stage 1: install & build ───────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci

# Copy source and build the frontend
COPY . .
RUN npm run build

# ── Stage 2: production image ──────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# Install all deps (tsx is a devDependency needed to run the TS backend)
COPY package*.json ./
RUN npm ci

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy backend source and config
COPY src ./src
COPY tsconfig.json ./
COPY index.html ./

EXPOSE 3000

ENV PORT=3000

CMD ["npx", "tsx", "src/server/serve.ts"]
