# syntax=docker/dockerfile:1

# ---------- Build stage ----------
# Full toolchain: install all deps, generate the Prisma client, compile to dist.
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
# build = prisma generate (cjs client) && tsc && tsc-alias.
# prisma.config.ts resolves DATABASE_URL eagerly, but generation never connects,
# so a build-only placeholder satisfies it. The real URL is injected at runtime.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npm run build

# ---------- Development stage ----------
# Used by docker-compose for the hot-reload workflow: it carries the full
# toolchain (tsx, prisma CLI) so compose's command override
# (prisma generate && db push && npm run dev) works. Source is bind-mounted at
# runtime by compose; this image just supplies node_modules.
FROM node:22-alpine AS development
WORKDIR /app
ENV NODE_ENV=development

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

# ---------- Production stage ----------
# Slim runtime: production deps only + the compiled output. No source, no tsx,
# no dev toolchain.
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Only runtime dependencies (the compiled Prisma client ships inside dist/).
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled application (dist/src + dist/prisma/generated).
COPY --from=build /app/dist ./dist

# Drop root privileges.
USER node

EXPOSE 4000

# Liveness probe for the container runtime (Node 22 has global fetch). Uses the
# runtime PORT (Render injects its own) and falls back to 4000 for local runs.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const p=process.env.PORT||4000; fetch('http://localhost:'+p+'/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# node as PID 1 receives SIGTERM directly, so graceful shutdown works.
CMD ["node", "dist/src/index.js"]
