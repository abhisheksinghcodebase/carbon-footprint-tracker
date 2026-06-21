# ==========================================
# STAGE 1: Build Frontend
# ==========================================
FROM node:22-slim AS frontend-builder
WORKDIR /build

# Install dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# Copy source and build
COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Backend & Runner
# ==========================================
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production

# Install backend dependencies
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --only=production

# Copy backend files
COPY backend/ ./

# Copy built frontend assets
COPY --from=frontend-builder /build/dist ./frontend/dist

# Expose port (default Cloud Run port is 8080, server.js handles process.env.PORT)
EXPOSE 8080
ENV PORT=8080

CMD ["node", "server.js"]
