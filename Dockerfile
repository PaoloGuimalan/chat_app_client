FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn --frozen-lockfile
COPY . .
RUN yarn build

RUN mv /app/dist/index.html /app/index.html.tpl

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/index.html.tpl ./index.html.tpl

COPY rate-limited.html /app/rate-limited.html
COPY server.js /app/server.js
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN yarn add express ioredis cors express-rate-limit compression@1.8.1

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
