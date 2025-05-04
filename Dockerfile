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

# Build with --no-lint flag to skip TypeScript checks
RUN npm run build -- --no-lint

# Production stage
FROM nginx:stable-alpine

# Copy build output from previous stage
# Adjust this path depending on Next.js output directory (.next/out or similar)
COPY --from=build /app/out /usr/share/nginx/html

# Copy custom nginx config if needed
# COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
