# ============================================================
# Multi-Stage Dockerfile — Remittance Corridor Analyzer
# Stage 1: Build Next.js frontend
# Stage 2: Production Next.js runner
# Stage 3: FastAPI backend
# ============================================================

# ── Stage 1: Build frontend ──────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --legacy-peer-deps

COPY frontend/ .

ARG NEXT_PUBLIC_API_URL=http://backend:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_MAPBOX_TOKEN=""
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN

# Ensure public/ exists even if not in repo
RUN mkdir -p /app/frontend/public

RUN npm run build

# ── Stage 2: Production frontend runner ──────────────────
FROM node:20-alpine AS frontend

WORKDIR /app/frontend
ENV NODE_ENV=production

COPY --from=frontend-builder /app/frontend/public ./public
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]

# ── Stage 3: FastAPI backend ──────────────────────────────
FROM python:3.11-slim AS backend

WORKDIR /app/backend

# curl needed for healthcheck, libgdal-dev for geopandas/shapely
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgdal-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY .env .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]