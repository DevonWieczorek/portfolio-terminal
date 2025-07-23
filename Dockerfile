# Multi-stage build for Next.js application

# ----------------------------------------
# Stage 1: Dependencies
# ----------------------------------------
  FROM node:20-alpine AS deps
  RUN apk add --no-cache libc6-compat
  WORKDIR /app
  
  # Accept environment variables passed at build time
  ARG NEXT_PUBLIC_OPENAI_API_KEY
  ENV NEXT_PUBLIC_OPENAI_API_KEY=$NEXT_PUBLIC_OPENAI_API_KEY
  
  # Install dependencies based on the preferred package manager
  COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
  RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi
  
  # ----------------------------------------
  # Stage 2: Builder
  # ----------------------------------------
  FROM node:20-alpine AS builder
  WORKDIR /app
  
  # Accept and export the env var again in this stage
  ARG NEXT_PUBLIC_OPENAI_API_KEY
  ENV NEXT_PUBLIC_OPENAI_API_KEY=$NEXT_PUBLIC_OPENAI_API_KEY
  
  COPY --from=deps /app/node_modules ./node_modules
  COPY . .
  
  ENV NEXT_TELEMETRY_DISABLED 1
  
  RUN yarn build
  
  # ----------------------------------------
  # Stage 3: Runner
  # ----------------------------------------
  FROM node:20-alpine AS runner
  WORKDIR /app
  
  ENV NODE_ENV production
  ENV NEXT_TELEMETRY_DISABLED 1
  ENV PORT 3000
  ENV HOSTNAME "0.0.0.0"
  
  RUN addgroup --system --gid 1001 nodejs
  RUN adduser --system --uid 1001 nextjs
  
  COPY --from=builder /app/public ./public
  
  # Set the correct permission for prerender cache
  RUN mkdir .next
  RUN chown nextjs:nodejs .next
  
  # Output tracing for standalone mode
  COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
  COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
  
  USER nextjs
  
  EXPOSE 3000
  
  CMD ["node", "server.js"]
  
