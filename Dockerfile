FROM node:18-alpine

# Install SQLite
RUN apk add --no-cache sqlite

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Create data directory
RUN mkdir -p data

EXPOSE 3000

CMD ["npm", "start"]