FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Build the application (optional for dev)
# RUN npm run build

# Expose port
EXPOSE 3001

# Start in development mode
CMD ["npm", "run", "start:dev"]
