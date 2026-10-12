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

// 1. Pre-load your clean templates into memory once at server start
const TEMPLATE_PATH = path.join(__dirname, "index.html.tpl");
const RATE_LIMIT_TEMPLATE_PATH = path.join(__dirname, "rate-limited.html");

let template = fs.readFileSync(TEMPLATE_PATH, "utf8");
let rateLimitedHtml = fs.readFileSync(RATE_LIMIT_TEMPLATE_PATH, "utf8"); // Cached for lightning fast 429 delivery

const PLACEHOLDER = "/*__ENV__*/";

// ------------------------------------------------------------------------
// LAYER 1: CORS & ISOLATED DATA RATE LIMITERS
// ------------------------------------------------------------------------

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "https://chatterloop.app",
    methods: ["GET", "HEAD"],
    optionsSuccessStatus: 200,
  }),
);

const assetLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 150,
  standardHeaders: false,
  legacyHeaders: false,
});

// Tightened 5 requests per 30 seconds limiter feeding the external file template
const htmlLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429);
    res.setHeader("Content-Type", "text/html");
    // Serve your clean, cached out-of-file structural layout
    res.send(rateLimitedHtml);
  },
});

// ------------------------------------------------------------------------
// LAYER 2: ASSET ROUTING MATRIX
// ------------------------------------------------------------------------

app.use(
  express.static(DIST_DIR, { index: false, immutable: true, maxAge: "1y" }),
  assetLimiter,
);

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
});

const handleDynamicHtmlDelivery = async (req, res) => {
  try {
    const publicConfig = {};
    const sensitiveConfig = {};

    for (const key of Object.keys(process.env)) {
      if (key.startsWith("VITE_PUBLIC_")) {
        publicConfig[key] = process.env[key];
      } else if (key.startsWith("VITE_SECRET_")) {
        sensitiveConfig[key] = process.env[key];
      }
    }

    const bootstrapKey = crypto.randomBytes(32).toString("hex");
    const redisKey = `bootstrap_key:${bootstrapKey}`;

    // Secure 10-second TTL
    await redis.setex(redisKey, 10, "active");

    const payload = {
      exp: Date.now() + 10000,
      envs: sensitiveConfig,
    };

    const secretBuffer = Buffer.from(bootstrapKey, "hex");
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", secretBuffer, iv);

    let encrypted = cipher.update(JSON.stringify(payload), "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    const inlineScript = `
      window._bootstrap = {
        key: "${bootstrapKey}",
        public: ${JSON.stringify(publicConfig)},
        payload: ${JSON.stringify({ iv: iv.toString("hex"), authTag, ciphertext: encrypted })}
      };
    `;

    const finalHtml = template.replace(PLACEHOLDER, () => inlineScript);
    res.setHeader("Content-Type", "text/html");
    return res.send(finalHtml);
  } catch (error) {
    console.error("[security-boot] Pipeline failed:", error);
    res.status(500).send("Internal Security Boot Error.");
  }
};

app.get("/", htmlLimiter, handleDynamicHtmlDelivery);

app.get("*", (req, res, next) => {
  const acceptsHtml =
    req.headers.accept && req.headers.accept.includes("text/html");
  if (acceptsHtml) {
    return htmlLimiter(req, res, () => handleDynamicHtmlDelivery(req, res));
  }
  next();
});

app.use((req, res) => res.status(404).send("Asset Not Found"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(
    `[production-ssr] Shifting-window rate limiting engine active on port ${PORT}`,
  ),
);
