# Use Node.js 18 as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy webhook-server directory
COPY webhook-server/ ./webhook-server/

# Copy .env file if it exists (for environment variables)
COPY .env* ./

# Install dependencies
WORKDIR /app/webhook-server
RUN npm install

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
