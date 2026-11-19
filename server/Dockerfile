FROM node:24.13-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=120s --retries=5 CMD wget -qO- http://127.0.0.1:4000/ready || exit 1
CMD ["node", "src/server.js"]
