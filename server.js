// /app/server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Redis = require("ioredis");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
const DIST_DIR = path.resolve(__dirname, "dist");

// ------------------------------------------------------------------------
// LAYER 0: TEMPLATE STRUCTURAL MEMORY FILE READING
// ------------------------------------------------------------------------

// Read static template files into memory once at container startup
const TEMPLATE_PATH = path.join(__dirname, "index.html.tpl");
const RATE_LIMIT_TEMPLATE_PATH = path.join(__dirname, "rate-limited.html");

let template = "";
let rateLimitedHtml = "";

try {
  template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  rateLimitedHtml = fs.readFileSync(RATE_LIMIT_TEMPLATE_PATH, "utf8");
} catch (err) {
  console.error(`[security-boot] Critical layout file loading error:`, err);
  process.exit(1);
}

const PLACEHOLDER = "/*__ENV__*/";
if (!template.includes(PLACEHOLDER)) {
  console.error(`[security-boot] Placeholder ${PLACEHOLDER} missing from index.html.tpl.`);
  process.exit(1);
}

// ------------------------------------------------------------------------
// LAYER 1: DATA NETWORK ROUTING & DYNAMIC MULTI-ORIGIN CORS
// ------------------------------------------------------------------------

// Parse the comma-separated allowed origins string from your process environment into an array list
const allowedOriginsEnv = process.env.ALLOWED_ORIGIN || "https://chatterloop.app";
const allowedOriginsList = allowedOriginsEnv.split(",").map(origin => origin.trim().toLowerCase());

const corsOptions = {
  origin: (origin, callback) => {
    // !origin covers server-to-server or local machine terminal curls/fetches
    if (!origin) {
      return callback(null, true);
    }

    const currentOrigin = origin.trim().toLowerCase();

    // Verify if incoming request origin matches your explicit array allowlist configuration rules
    if (allowedOriginsList.includes(currentOrigin)) {
      return callback(null, true);
    } else {
      console.warn(`[security-alert] Blocked unauthorized CORS request from Origin: ${origin}`);
      return callback(new Error('Not allowed by strict Chatterloop CORS configuration policies.'));
    }
  },
  methods: ["GET", "HEAD", "POST", "OPTIONS"], // 💡 Explicitly added OPTIONS for pre-flight safety mapping
  allowedHeaders: ["Content-Type", "Authorization"], // 💡 Explicitly declare headers used by your React app
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// ------------------------------------------------------------------------
// LAYER 2: ZONE PROTECTION RATE LIMITERS
// ------------------------------------------------------------------------

// ZONE A: Loose asset limiter to let the browser request all static .js and .css chunks smoothly
const assetLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 150,
  standardHeaders: false,
  legacyHeaders: false,
});

// ZONE B: Tight HTML page load limiter to prevent bots from flooding your active Redis cache engine
const htmlLimiter = rateLimit({
  windowMs: 30 * 1000, // 30-second sliding window
  max: 5, // Maximum 5 hard page loads/refreshes per 30s per IP address
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429);
    res.setHeader("Content-Type", "text/html");
    // Serve your clean, cached out-of-file structural rate-limited webpage layout cleanly
    res.send(rateLimitedHtml); 
  }
});

// ------------------------------------------------------------------------
// LAYER 3: AUTHENTICATED REDIS STORAGE ENGINE INITIALIZATION
// ------------------------------------------------------------------------

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  }
});

redis.on("connect", () => console.log("[redis] Successfully authenticated and connected."));
redis.on("error", (err) => console.error("[redis] Connection cluster failure:", err));

// ------------------------------------------------------------------------
// LAYER 4: CORE APPLICATION DYNAMIC HANDSHAKE PIPELINE CONTROLLERS
// ------------------------------------------------------------------------

const handleDynamicHtmlDelivery = async (req, res) => {
  try {
    const publicConfig = {};
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("VITE_PUBLIC_")) publicConfig[key] = process.env[key];
    }

    const fullKeyString = crypto.randomBytes(32).toString("hex");
    const keyHalfA = fullKeyString.substring(0, 32);
    const keyHalfB = fullKeyString.substring(32, 64);

    const redisNonce = crypto.randomBytes(32).toString("hex");
    const sessionData = { keyHalfA, keyHalfB };

    // Locked down token registration set strictly to your custom 10s TTL
    await redis.setex(
      `bootstrap_session:${redisNonce}`,
      10,
      JSON.stringify(sessionData),
    );

    const inlineScript = `
      window._bootstrap = {
        nonce: "${redisNonce}",
        keyHalfA: "${keyHalfA}",
        public: ${JSON.stringify(publicConfig)}
      };
    `;

    res.setHeader("Content-Type", "text/html");
    return res.send(template.replace(PLACEHOLDER, () => inlineScript));
  } catch (err) {
    console.error("[security-boot] HTML delivery crash:", err);
    res.status(500).send("Security Boot Failure.");
  }
};

// --- API BOOTSTRAP HANDSHAKE DECRYPTION LOOP ---
app.post("/api/bootstrap", async (req, res) => {
  const { nonce, keyHalfA } = req.body;
  if (!nonce || !keyHalfA) {
    return res
      .status(400)
      .json({ error: "Missing required cryptographic handshake parameters." });
  }

  const redisKey = `bootstrap_session:${nonce}`;

  try {
    const replies = await redis.multi().get(redisKey).del(redisKey).exec();
  
    // Extract the result from the first operation (.get())
    const getReply = replies && replies[0] ? replies[0][1] : null;

    if (!getReply) {
      return res
        .status(403)
        .json({ error: "Handshake window has expired or been consumed." });
    }

    const sessionData = JSON.parse(getReply);

    if (sessionData.keyHalfA !== keyHalfA) {
      return res
        .status(401)
        .json({ error: "Cryptographic signature mismatch." });
    }

    // Map configuration directly out of your incoming .env settings variables profiles
    const sensitiveConfig = {
      VITE_SECRET_JWT_SECRET: process.env.VITE_SECRET_JWT_SECRET,
      VITE_SECRET_OPEN_ROUTE_API_KEY: process.env.VITE_SECRET_OPEN_ROUTE_API_KEY,
      VITE_SECRET_TURN_SERVER_USERNAME: process.env.VITE_SECRET_TURN_SERVER_USERNAME,
      VITE_SECRET_TURN_SERVER_CREDENTIAL: process.env.VITE_SECRET_TURN_SERVER_CREDENTIAL,
    };

    const payload = {
      exp: Date.now() + 10000, // Explicit 10-second validation threshold check
      envs: sensitiveConfig,
    };

    const fullMasterKey = keyHalfA + sessionData.keyHalfB;
    const secretBuffer = Buffer.from(fullMasterKey, "hex");

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", secretBuffer, iv);

    let encrypted = cipher.update(JSON.stringify(payload), "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return res.json({
      keyHalfB: sessionData.keyHalfB,
      payload: {
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
        ciphertext: encrypted,
      },
    });
  } catch (error) {
    console.error("[handshake-failure] Extraction crash:", error);
    return res
      .status(500)
      .json({ error: "Internal handshake verification mismatch." });
  }
});

// ------------------------------------------------------------------------
// LAYER 5: STATIC PACKAGING AND WILDCARD FALLBACK PRESETS
// ------------------------------------------------------------------------

// 1. Static Compilation Assets (.js, .css, images) go on top with loose asset limit protection
app.use(express.static(DIST_DIR, { index: false, immutable: true, maxAge: "1y" }), assetLimiter);

// 2. Base explicitly targeted root application entry navigation path
app.get("/", htmlLimiter, handleDynamicHtmlDelivery);

// 3. SPA Router Safety Fallback Route Catch-All
// Uses your working path regex wildcard syntax to comply with Express 5 constraints
app.get("/{*splat}", (req, res, next) => {
  const acceptsHtml = req.headers.accept && req.headers.accept.includes("text/html");
  if (acceptsHtml) {
    return htmlLimiter(req, res, () => handleDynamicHtmlDelivery(req, res));
  }
  next();
});

// 4. Asset Not Found 404 Fallback for invalid file paths
app.use((req, res) => {
  res.status(404).send("Asset Not Found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`[split-key-ssr] Server runtime spinning on port ${PORT}`),
);
