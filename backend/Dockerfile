FROM node:18-alpine

WORKDIR /app

# production deps only
COPY package*.json ./
RUN npm ci --only=production

# copy source
COPY . .

EXPOSE 5000
CMD ["npm","start"]







# FROM node:18-alpine

# WORKDIR /app

# # Install curl for health checks
# RUN apk add --no-cache curl

# # Copy package files
# COPY package*.json ./

# # Install dependencies
# RUN npm ci --only=production

# # Copy source code
# COPY . .

# # Create a non-root user
# RUN addgroup -g 1001 -S nodejs
# RUN adduser -S nodejs -u 1001

# # Change ownership of the app directory
# RUN chown -R nodejs:nodejs /app
# USER nodejs

# # Expose port
# EXPOSE 5000

# # Start the application
# CMD ["npm", "start"]
