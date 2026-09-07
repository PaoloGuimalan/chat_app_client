FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn
COPY . .
RUN yarn build

FROM node:22-alpine
RUN yarn global add serve
WORKDIR /app
COPY --from=build /app/dist ./dist

# The template lives outside dist/ so it is never served directly.
# generate-env.js renders dist/index.html from it at every container start.
RUN mv /app/dist/index.html /app/index.html.tpl
COPY generate-env.js /app/generate-env.js
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

CMD ["docker-entrypoint.sh"]
