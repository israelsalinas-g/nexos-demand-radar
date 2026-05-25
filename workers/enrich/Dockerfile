FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
COPY package.json pnpm-workspace.yaml* pnpm-lock.yaml* ./
COPY packages/ packages/
COPY workers/enrich/ workers/enrich/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @radar/db db:generate
RUN pnpm --filter @radar/enrich-worker build

FROM node:20-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/workers/enrich/dist ./dist
COPY --from=builder /app/packages ./packages
CMD ["node", "dist/index.js"]
