// /app/server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Redis = require("ioredis");
const cors = require("cors");

const app = express();
const DIST_DIR = path.resolve(__dirname, "dist");

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
});

const template = fs.readFileSync(
  path.join(__dirname, "index.html.tpl"),
  "utf8",
);

app.use(
  cors({ origin: process.env.ALLOWED_ORIGIN || "https://chatterloop.app" }),
);
app.use(express.json());

app.post("/api/bootstrap", async (req, res) => {
  const { nonce, keyHalfA } = req.body;
  if (!nonce || !keyHalfA) {
    return res
      .status(400)
      .json({ error: "Missing required cryptographic handshake parameters." });
  }

  const redisKey = `bootstrap_session:${nonce}`;

  try {
    const [getReply] = await redis.multi().get(redisKey).del(redisKey).exec();

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

    const sensitiveConfig = {
      VITE_SECRET_JWT_SECRET: process.env.REAL_JWT_SECRET,
      VITE_SECRET_OPEN_ROUTE_API_KEY: process.env.REAL_OPEN_ROUTE_API_KEY,
      VITE_SECRET_TURN_SERVER_USERNAME: process.env.REAL_TURN_SERVER_USERNAME,
      VITE_SECRET_TURN_SERVER_CREDENTIAL:
        process.env.REAL_TURN_SERVER_CREDENTIAL,
    };

    const payload = {
      exp: Date.now() + 10000,
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

app.get("/", async (req, res) => {
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
    return res.send(template.replace("/*__ENV__*/", () => inlineScript));
  } catch (err) {
    res.status(500).send("Security Boot Failure.");
  }
});

app.use(express.static(DIST_DIR, { index: false }));
app.get("*", (req, res) => res.redirect("/"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`[split-key-ssr] Server runtime spinning on port ${PORT}`),
);
