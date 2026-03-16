FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@9.12.0

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build server and web app
FROM deps AS builder
COPY . .
# Build the web app first
RUN pnpm export
# Build the backend server
RUN pnpm build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm@9.12.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
# Copy pre-built web app (built locally and committed to repo)
COPY web-dist ./web-dist

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# Run server (serves both API and web app)
CMD ["node", "dist/index.js"]
