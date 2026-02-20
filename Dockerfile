FROM node:20.20.0

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY public ./public
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Environment variables
ENV PORT=8000
ENV HOST=0.0.0.0

# Expose port
EXPOSE 8000

# Start server
CMD ["npm", "start"]
