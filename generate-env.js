// Renders dist/index.html from index.html.tpl, inlining the public runtime
// config as window._env_. Run once at container start by docker-entrypoint.sh.
//
// Inlining rather than writing a separate dist/env-config.js means there is no
// standalone URL to fetch: the values are still readable in view-source, but
// they are not sitting at a guessable path for scanners to collect.
//
// PUBLIC_KEYS is an allowlist, not a VITE_* sweep. Anything not named here
// never reaches the browser through this path, so adding a sensitive variable
// to the env file cannot publish it by accident.
const fs = require("fs");

const PUBLIC_KEYS = [
  // Public by nature: these are URLs and identifiers that are meant to be
  // visible to the browser.
  "VITE_CHATTERLOOP_API",
  "VITE_CHATTERLOOP_USER_SERVICE_API",
  "VITE_GOOGLE_CLIENT_ID",
  "VITE_OPEN_ROUTE_API",
  "VITE_TURN_SERVER_URL",
  "VITE_MAX_UPLOAD_FILE_SIZE_MB",
  "VITE_APP_VERSION",

  // Should NOT be here, and are only listed because the browser code still
  // reads them. They are already in the built bundle, so publishing them here
  // exposes nothing new - but leaving them out would have split config across
  // two mechanisms, where these four came from the build and everything else
  // came from the stack file. Changing one of them in the env file would then
  // silently do nothing.
  //
  // Delete each line as its consumer moves server-side:
  //   VITE_JWT_SECRET             - signs sessions; same value as the server's
  //                                 JWT_SECRET, so anyone reading it can forge
  //                                 a token for any user. Highest priority.
  //   VITE_OPEN_ROUTE_API_KEY     - proxy the ORS call through the backend.
  //   VITE_TURN_SERVER_USERNAME   - switch coturn to use-auth-secret so the
  //   VITE_TURN_SERVER_CREDENTIAL   server issues short-lived HMAC credentials.
  "VITE_JWT_SECRET",
  "VITE_OPEN_ROUTE_API_KEY",
  "VITE_TURN_SERVER_USERNAME",
  "VITE_TURN_SERVER_CREDENTIAL",
];

const TEMPLATE = "/app/index.html.tpl";
const OUTPUT = "/app/dist/index.html";
const PLACEHOLDER = "/*__ENV__*/";

const config = {};
for (const key of PUBLIC_KEYS) {
  if (process.env[key] !== undefined) config[key] = process.env[key];
}

const template = fs.readFileSync(TEMPLATE, "utf8");
if (!template.includes(PLACEHOLDER)) {
  console.error(`[env] placeholder ${PLACEHOLDER} not found in ${TEMPLATE}`);
  process.exit(1);
}

// Replace via a function: passing the string directly would let "$&" and other
// replacement patterns inside a config value be interpreted rather than copied.
const inline = `window._env_ = ${JSON.stringify(config)};`;
fs.writeFileSync(OUTPUT, template.replace(PLACEHOLDER, () => inline));

console.log(`[env] inlined ${Object.keys(config).length} public values`);
