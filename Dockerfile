FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn
COPY .env .env
COPY . .
RUN yarn build

FROM node:22-alpine
RUN yarn global add serve
WORKDIR /app
COPY --from=build /app/dist ./dist

EXPOSE 3000

# This command creates a JS file from all envs starting with VITE_ 
# and then starts the 'serve' tool.
CMD ["sh", "-c", "echo \"window._env_ = { $(env | grep VITE_ | awk -F= '{print \"\\\"\"$1\"\\\": \\\"\"$2\"\\\",\"}') };\" > ./dist/env-config.js && serve -s dist -l 3000"]
