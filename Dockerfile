FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY server.js lib.js ./
COPY views/ ./views/

# config.json and data.json are not baked in — mount them at runtime:
#   docker run -v /host/config.json:/app/config.json \
#              -v /host/data.json:/app/data.json \
#              -p 3000:3000 strng
#
# NOTE: the container writes to data.json, so it currently runs as root to keep
# writes to the mounted volume working unchanged. Running as a non-root user is
# a recommended follow-up (requires the data volume to be writable by that user).

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/login >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
