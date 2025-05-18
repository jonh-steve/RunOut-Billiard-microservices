FROM node:20-alpine

WORKDIR /usr/src/app

# Cài đặt Python và build tools sử dụng apk (Alpine package manager)
RUN apk add --no-cache python3 g++ make git

COPY package*.json ./
# Install dependencies
RUN npm install --include=dev

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV SERVICE_NAME=product-service

# Use port 3002 (adjust for each service)
EXPOSE 3002

# Install lightweight init system tini
RUN apk add --no-cache tini

# Use tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "src/index.js"]