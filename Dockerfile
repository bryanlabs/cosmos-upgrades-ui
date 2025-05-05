# Build stage with necessary dependencies
FROM node:18-alpine AS build

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
# Use --ignore-scripts to skip native module compilation during initial install
RUN npm ci --ignore-scripts

# Manually run the graz generation script that would normally run during postinstall
RUN npx graz generate -g

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# 👇 Run migrations after schema + code are available
RUN npx prisma migrate deploy

# Build with --no-lint flag to skip TypeScript checks
RUN npm run build -- --no-lint

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV production
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
ENV HOSTNAME 0.0.0.0

# Run the Next.js server
CMD ["node", "server.js"]
