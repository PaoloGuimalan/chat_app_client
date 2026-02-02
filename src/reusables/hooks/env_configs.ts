const envs = {
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  CHATTERLOOP_API: import.meta.env.VITE_CHATTERLOOP_API,
  USER_SERVICE_API: import.meta.env.VITE_CHATTERLOOP_USER_SERVICE_API,
  SECRET: import.meta.env.VITE_JWT_SECRET,
  OPEN_ROUTE_API: import.meta.env.VITE_OPEN_ROUTE_API,
  OPEN_ROUTE_API_KEY: import.meta.env.VITE_OPEN_ROUTE_API_KEY,
};

export default envs;
