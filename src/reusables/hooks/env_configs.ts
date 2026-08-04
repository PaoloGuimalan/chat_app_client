const envs = {
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  CHATTERLOOP_API: import.meta.env.VITE_CHATTERLOOP_API,
  USER_SERVICE_API: import.meta.env.VITE_CHATTERLOOP_USER_SERVICE_API,
  SECRET: import.meta.env.VITE_JWT_SECRET,
  OPEN_ROUTE_API: import.meta.env.VITE_OPEN_ROUTE_API,
  OPEN_ROUTE_API_KEY: import.meta.env.VITE_OPEN_ROUTE_API_KEY,
  TURN_SERVER_URL: import.meta.env.VITE_TURN_SERVER_URL,
  TURN_SERVER_USERNAME: import.meta.env.VITE_TURN_SERVER_USERNAME,
  TURN_SERVER_CREDENTIAL: import.meta.env.VITE_TURN_SERVER_CREDENTIAL,
  // Megabytes, optional - see reusables/vars/uploads.ts, which parses this and
  // falls back to a hardcoded default when it is unset or malformed. Should
  // match the server's own MAX_UPLOAD_FILE_SIZE_MB; a client cap that is
  // larger only means the user waits for the whole upload before being told no.
  MAX_UPLOAD_FILE_SIZE_MB: import.meta.env.VITE_MAX_UPLOAD_FILE_SIZE_MB,
};

export default envs;
