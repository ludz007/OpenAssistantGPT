###########################
# 1) BUILD STAGE
###########################
FROM node:18 AS builder
WORKDIR /app

# 1.1) Copy package.json + lockfile, install dependencies.
#      (We assume you use npm; if you use yarn or pnpm, adjust accordingly.)
COPY package.json package-lock.json* ./
RUN npm ci

# 1.2) Copy the rest of your source code
COPY . .

# 1.3) Override Prisma’s DATABASE_URL (and related vars) at build time
#      so that `npm run build` (and `prisma generate`) does NOT try to reach
#      your real Postgres on openassistant-oagptdb-teq3ot:5432.
#      Instead, Prisma sees a “valid‐looking” but non‐existent local DB.
ENV DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public"
ENV POSTGRES_PRISMA_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public"
ENV POSTGRES_DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public"

# 1.4) Run your build. This will run `prisma generate` under the hood,
#      but Prisma will only see the “dummy” URL above—so it will not attempt
#      to connect to openassistant-oagptdb-teq3ot:5432.
RUN npm run build

###########################
# 2) RUNNER (PRODUCTION) STAGE
###########################
FROM node:18-alpine AS runner
WORKDIR /app

# 2.1) Copy over only the build artifacts and node_modules from the builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# 2.2) Clear out the “dummy” build‐time environment variables
#      so that at runtime, Prisma picks up your REAL credentials
#      (which you will supply via a .env file or dokploy UI).
ENV DATABASE_URL=""
ENV POSTGRES_PRISMA_URL=""
ENV POSTGRES_DIRECT_URL=""

# 2.3) Ensure NODE_ENV=production in the final image
ENV NODE_ENV=production
ENV PORT=3000

# 2.4) Expose the port and run
EXPOSE 3000
CMD ["npm", "start"]
