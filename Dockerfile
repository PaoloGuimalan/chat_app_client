# builder
FROM node:16-alpine as build
WORKDIR /app
ARG TWYGR_UI_VITE_APP_API_ACCESS_TOKEN_SECRET
ARG VITE_APP_GOOGLE_CLIENT_SECRET
COPY package.json .
RUN yarn install
COPY . .
ENV VITE_API_URL=https://api.twygr.ai/v1/
ENV VITE_PUBLIC_API_URL=https://api.twygr.ai

ENV VITE_VC_API_URL=http://localhost:8000/
ENV VITE_NODE_VC_DIR_LIB=http://localhost:3003/
ENV VITE_VC_API_DIR=/

ENV VITE_APP_API_ACCESS_TOKEN_SECRET=$TWYGR_UI_VITE_APP_API_ACCESS_TOKEN_SECRET
ENV VITE_APP_BASENAME=
ENV VITE_APP_GOOGLE_CLIENT_ID=562917551456-48glgrapqh96p3okljistfegdqra1gfa.apps.googleusercontent.com
ENV VITE_APP_GOOGLE_CLIENT_SECRET=$VITE_APP_GOOGLE_CLIENT_SECRET
ENV VITE_APP_GOOGLE_USERINFO_API=https://www.googleapis.com/oauth2/v1/userinfo
ENV NODE_ENV=production
# RUN chown -R node: /app/node_modules
RUN yarn build

# runner
FROM nginx:1.21-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx-staging.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
