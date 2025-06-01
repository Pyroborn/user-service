FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Create data directory for JSON storage
RUN mkdir -p /app/data

# Expose the port the app runs on
EXPOSE 3003

# Command to run the application
CMD ["node", "index.js"] 