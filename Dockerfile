FROM node:lts-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY server.js ./
COPY views/ ./views/

# config.json and data.json are not baked in — mount them at runtime:
#   docker run -v /host/config.json:/app/config.json \
#              -v /host/data.json:/app/data.json \
#              -p 3000:3000 strng

EXPOSE 3000

CMD ["node", "server.js"]
