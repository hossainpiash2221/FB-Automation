require("dotenv").config?.();

const express = require("express");
const crypto = require("crypto");
const { getSheetData } = require("../src/services/googleSheets");
const { findProduct, formatProductMessage } = require("../src/services/productService");
const { processCustomerMessage } = require("../src/utils/messageParser");
const { sendMessengerMessage } = require("../src/services/metaMessenger");

const app = express();

app.use(express.json({
  limit: "1mb",
  verify: (req, res, buffer) => {
    req.rawBody = Buffer.from(buffer);
  }
}));

function verifyMetaSignature(req) {
  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    // During initial setup signature validation is skipped.
    // Set META_APP_SECRET before production use.
    return true;
  }

  const signature = req.headers["x-hub-signature-256"];
  if (!signature || !req.rawBody) return false;

  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Product Catalog Messenger Automation",
    endpoints: ["/health", "/test-sheet", "/product/P011", "/process-message", "/webhook"]
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "online", message: "Backend is running" });
});

app.get("/test-sheet", async (req, res) => {
  try {
    const data = await getSheetData();
    res.json({
      status: "success",
      headers: data.headers,
      totalProducts: data.products.length,
      sampleProducts: data.products.slice(0, 2)
    });
  } catch (error) {
    console.error("Sheet error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/product/:code", async (req, res) => {
  try {
    const product = await findProduct(req.params.code);
    if (!product) return res.status(404).json({ status: "error", message: "Product not found" });
    if (!isActive(product)) return res.status(404).json({ status: "error", message: "Product unavailable" });
    res.json({
      status: "success",
      product,
      formattedMessage: formatProductMessage(product)
    });
  } catch (error) {
    console.error("Product error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

function isActive(product) {
  return String(product.status || "").trim().toLowerCase() === "active";
}

app.post("/process-message", async (req, res) => {
  try {
    const message = req.body && req.body.message;
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ status: "error", message: "message is required" });
    }
    const result = await processCustomerMessage(message);
    res.json(result);
  } catch (error) {
    console.error("Message processing error:", error);
    res.status(500).json({ status: "error", message: "Could not process message" });
  }
});

// Meta webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" &&
      process.env.META_VERIFY_TOKEN &&
      token === process.env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Meta sends events here
app.post("/webhook", async (req, res) => {
  if (!verifyMetaSignature(req)) {
    return res.sendStatus(401);
  }

  if (!req.body || req.body.object !== "page") {
    return res.sendStatus(404);
  }

  // Acknowledge after processing to avoid dropping work in a serverless function.
  try {
    for (const entry of req.body.entry || []) {
      for (const event of entry.messaging || []) {
        if (event.message?.is_echo) continue;

        const senderId = event.sender?.id;
        const text = event.message?.text;

        // This starter project handles text messages only.
        if (!senderId || typeof text !== "string" || !text.trim()) continue;

        const result = await processCustomerMessage(text);
        if (result.reply) {
          await sendMessengerMessage(senderId, result.reply);
        }
      }
    }
    return res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(200).send("EVENT_RECEIVED");
  }
});

module.exports = app;

// Local development support
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Backend running at http://localhost:${port}`));
}
