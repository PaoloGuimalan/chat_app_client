FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json yarn.lock ./

RUN yarn

COPY . .

ENV VITE_CHATTERLOOP_API=https://api.chatterloop.app
ENV VITE_JWT_SECRET=chatterloop12345678

RUN yarn build

FROM node:22-alpine

RUN yarn global add serve

WORKDIR /app

COPY --from=build /app/dist ./dist

EXPOSE 3004

CMD ["serve", "-s", "dist", "-l", "3004"]