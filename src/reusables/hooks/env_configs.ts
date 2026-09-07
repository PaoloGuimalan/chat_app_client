declare global {
  interface Window {
    _env_?: Record<string, string>;
  }
}

// Runtime values win over build-time ones. docker-entrypoint.sh writes
// window._env_ from the container's environment at startup, so changing config
// is a redeploy rather than a rebuild. import.meta.env stays as the fallback for
// local dev, where nothing populates window._env_.
//
// Each key is spelled out twice on purpose: Vite substitutes import.meta.env.X
// by static string replacement at build time and does not resolve dynamic
// lookups, so import.meta.env[key] would come back undefined in the bundle.
const runtime = window._env_ ?? {};

// Returns "" rather than undefined when a value is missing. import.meta.env is
// typed as any, so consumers already treat these as plain strings; widening the
// result to string | undefined would break every call site instead.
const pick = (key: string, fallback: string | undefined): string =>
  runtime[key] || fallback || "";

const envs = {
  GOOGLE_CLIENT_ID: pick("VITE_GOOGLE_CLIENT_ID", import.meta.env.VITE_GOOGLE_CLIENT_ID),
  CHATTERLOOP_API: pick("VITE_CHATTERLOOP_API", import.meta.env.VITE_CHATTERLOOP_API),
  USER_SERVICE_API: pick("VITE_CHATTERLOOP_USER_SERVICE_API", import.meta.env.VITE_CHATTERLOOP_USER_SERVICE_API),
  SECRET: pick("VITE_JWT_SECRET", import.meta.env.VITE_JWT_SECRET),
  OPEN_ROUTE_API: pick("VITE_OPEN_ROUTE_API", import.meta.env.VITE_OPEN_ROUTE_API),
  OPEN_ROUTE_API_KEY: pick("VITE_OPEN_ROUTE_API_KEY", import.meta.env.VITE_OPEN_ROUTE_API_KEY),
  TURN_SERVER_URL: pick("VITE_TURN_SERVER_URL", import.meta.env.VITE_TURN_SERVER_URL),
  TURN_SERVER_USERNAME: pick("VITE_TURN_SERVER_USERNAME", import.meta.env.VITE_TURN_SERVER_USERNAME),
  TURN_SERVER_CREDENTIAL: pick("VITE_TURN_SERVER_CREDENTIAL", import.meta.env.VITE_TURN_SERVER_CREDENTIAL),
  MAX_UPLOAD_FILE_SIZE_MB: pick("VITE_MAX_UPLOAD_FILE_SIZE_MB", import.meta.env.VITE_MAX_UPLOAD_FILE_SIZE_MB),
  APP_VERSION: pick("VITE_APP_VERSION", import.meta.env.VITE_APP_VERSION) || "dev",
};

export default envs;
