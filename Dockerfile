FROM node:18-alpine

# Install SQLite and create data directory
RUN apk add --no-cache sqlite && mkdir -p /data

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app /data
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]