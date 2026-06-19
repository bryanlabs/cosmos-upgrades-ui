# Build stage with necessary dependencies
FROM node:18-alpine AS build
ARG NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
ENV NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=${NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID}
ARG NEXT_PUBLIC_AUTHENTIK_END_SESSION_URL
ENV NEXT_PUBLIC_AUTHENTIK_END_SESSION_URL=${NEXT_PUBLIC_AUTHENTIK_END_SESSION_URL}

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ git

WORKDIR /app
ENV DATABASE_URL=file:./prisma/dev.db

# Copy package files and install dependencies
COPY package*.json ./
# Use --ignore-scripts to skip native module compilation during initial install
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# 👇 Run migrations after schema + code are available
RUN npx prisma migrate deploy

# Build the optimized Next.js server
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
ARG NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/cosmos-upgrades-ui.db
ENV NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=${NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID}
# Uncomment the following line in case you need sharp installation
# RUN apk add --no-cache --virtual .sharp-deps vips

# Copy the standalone build output
COPY --from=build /app/.next/standalone ./
# Copy the static assets
COPY --from=build /app/.next/static ./.next/static
# Copy the public assets
COPY --from=build /app/public ./public

# Copy the Prisma schema and generated client
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Expose the port the app runs on (default 3000)
EXPOSE 3000

# Set the host to listen on all interfaces
ENV HOSTNAME=0.0.0.0

RUN mkdir -p /data

# Run the Next.js server
CMD ["node", "server.js"]
