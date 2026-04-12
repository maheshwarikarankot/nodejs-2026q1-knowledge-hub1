# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files and Prisma schema first so the client can be generated
COPY package*.json ./
COPY prisma ./prisma

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client from the checked-in schema
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public" npx prisma generate

# Compile TypeScript
RUN npm run build

# Keep only production dependencies for the runtime image
RUN npm prune --omit=dev


###############################################


# Production stage
FROM node:24-alpine

# Set environment
ENV NODE_ENV=production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy compiled code and production-ready dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Copy package files
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "dist/main.js"]