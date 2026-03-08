FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@9.12.0

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build server + web app
FROM deps AS builder
COPY . .
# Build the backend server
RUN pnpm build
# Build the Expo web app
RUN npx expo export --platform web --output-dir web-dist

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm@9.12.0

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/web-dist ./web-dist

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# Run server (serves both API and web app)
CMD ["sh", "-c", "node dist/index.js"]
