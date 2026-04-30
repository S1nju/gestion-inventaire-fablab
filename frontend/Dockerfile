# Build stage
FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
	bash \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev) for building, skip prepare script
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Remove dev dependencies, keep only production
RUN npm prune --omit=dev

# Production stage
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
	bash \
	dumb-init \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/*

# Copy built app and node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json .

EXPOSE 3000

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

# Use dumb-init to handle graceful shutdown
ENTRYPOINT ["dumb-init", "--"]

CMD ["npm", "start"]
