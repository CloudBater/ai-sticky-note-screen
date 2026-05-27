FROM node:20-alpine AS build-fe
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json frontend/
COPY backend/package*.json backend/
RUN npm ci
COPY frontend/ frontend/
RUN npm run build --workspace=frontend

FROM node:20-alpine AS build-be
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json backend/
RUN npm ci
COPY backend/ backend/
RUN npm run build --workspace=backend

FROM node:20-alpine AS runtime
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json backend/
RUN npm ci --omit=dev --workspace=backend
COPY --from=build-be /app/backend/dist backend/dist
COPY --from=build-fe /app/frontend/dist frontend/dist
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "backend/dist/server.js"]
