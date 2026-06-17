import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidGroup,
} from "@whiskeysockets/baileys";
import express from "express";
import { Boom } from "@hapi/boom";
import pino from "pino";
import qrcodeTerminal from "qrcode-terminal";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// ─── Load env from parent directory (.env of the hostel portal) ──────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const PORT = process.env.WHATSAPP_BOT_PORT || 5001;
const DEFAULT_GROUP_ID = process.env.WHATSAPP_GROUP_ID || "";

// ─── Logger (silent for Baileys internals, pretty for our logs) ──────────────
const logger = pino({ level: "silent" });
const log = (...args) => console.log("\x1b[32m[WhatsApp Bot]\x1b[0m", ...args);
const err = (...args) => console.error("\x1b[31m[WhatsApp Bot]\x1b[0m", ...args);

// ─── State ───────────────────────────────────────────────────────────────────
let sock = null;
let isConnected = false;
let qrCode = null;

// ─── Express Server ──────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: isConnected ? "connected" : "disconnected",
    message: isConnected
      ? "✅ WhatsApp bot is connected and ready."
      : qrCode
      ? "⏳ Waiting for QR scan — open /scan in your browser."
      : "⏳ Initializing...",
  });
});

// ── QR code scan page ─────────────────────────────────────────────────────────
app.get("/scan", (req, res) => {
  if (isConnected) {
    return res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#f0fdf4">
        <h1 style="color:#16a34a">✅ WhatsApp Connected!</h1>
        <p>Your WhatsApp is linked and the bot is running.</p>
      </body></html>
    `);
  }

  if (!qrCode) {
    return res.send(`
      <html>
        <head><meta http-equiv="refresh" content="3"></head>
        <body style="font-family:sans-serif;text-align:center;padding:60px;background:#fefce8">
          <h2>⏳ Generating QR Code...</h2>
          <p>Page will refresh automatically.</p>
        </body>
      </html>
    `);
  }

  // Render QR as a web page using qrcode.js CDN
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Scan WhatsApp QR</title>
      <meta http-equiv="refresh" content="30">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card {
          background: white;
          border-radius: 24px;
          padding: 48px 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.08);
          text-align: center;
          max-width: 400px;
          width: 90%;
        }
        .icon { font-size: 48px; margin-bottom: 16px; }
        h1 { color: #1a1a1a; font-size: 22px; font-weight: 700; margin-bottom: 8px; }
        p { color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        #qrcode { margin: 0 auto 24px; display: inline-block; padding: 12px; border: 1px solid #e5e7eb; border-radius: 12px; }
        .steps { text-align: left; background: #f9fafb; border-radius: 12px; padding: 16px 20px; }
        .step { font-size: 13px; color: #555; padding: 4px 0; }
        .badge {
          display: inline-block;
          background: #dcfce7;
          color: #166534;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">📱</div>
        <span class="badge">Scan Once • Always Connected</span>
        <h1>Link Your WhatsApp</h1>
        <p>Open WhatsApp on your phone → Linked Devices → Link a Device → Scan this code</p>
        <div id="qrcode"></div>
        <div class="steps">
          <div class="step">1️⃣ Open WhatsApp on your phone</div>
          <div class="step">2️⃣ Tap Menu → Linked Devices</div>
          <div class="step">3️⃣ Tap "Link a Device"</div>
          <div class="step">4️⃣ Scan the QR code above</div>
        </div>
      </div>
      <script>
        new QRCode(document.getElementById("qrcode"), {
          text: ${JSON.stringify(qrCode)},
          width: 220,
          height: 220,
          colorDark: "#000",
          colorLight: "#fff",
          correctLevel: QRCode.CorrectLevel.M
        });
      </script>
    </body>
    </html>
  `);
});

// ── Send notice endpoint (called by your hostel portal) ───────────────────────
app.post("/send-notice", async (req, res) => {
  if (!isConnected || !sock) {
    return res.status(503).json({
      success: false,
      error: "WhatsApp bot is not connected yet. Open http://localhost:5001/scan to link your device.",
    });
  }

  const { message, text, group_id, title, content, priority, category } = req.body;

  // Use message or text field (both are sent by the hostel portal)
  const noticeText = message || text;
  if (!noticeText) {
    return res.status(400).json({ success: false, error: "No message content provided" });
  }

  // Use group_id from request body, or fall back to env variable
  const targetGroupId = group_id || DEFAULT_GROUP_ID;
  if (!targetGroupId) {
    return res.status(400).json({
      success: false,
      error: "No group_id provided. Set WHATSAPP_GROUP_ID in your .env or pass group_id in the request body.",
    });
  }

  try {
    // Validate the group JID format
    const jid = targetGroupId.includes("@g.us") ? targetGroupId : `${targetGroupId}@g.us`;

    await sock.sendMessage(jid, { text: noticeText });

    log(`✅ Notice sent to group: ${jid}`);
    log(`   Title: ${title || "N/A"} | Priority: ${priority || "N/A"}`);

    res.json({ success: true, message: "Notice broadcast to WhatsApp group successfully", groupId: jid });
  } catch (e) {
    err("Failed to send message:", e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── List joined groups (helpful for finding your group_id) ────────────────────
app.get("/groups", async (req, res) => {
  if (!isConnected || !sock) {
    return res.status(503).json({ success: false, error: "Not connected yet" });
  }
  try {
    const groups = await sock.groupFetchAllParticipating();
    const list = Object.entries(groups).map(([id, meta]) => ({
      id,
      name: meta.subject,
      participants: meta.participants?.length || 0,
    }));
    res.json({ success: true, groups: list });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Baileys Connection ───────────────────────────────────────────────────────
async function connectToWhatsApp() {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, "auth_session")
  );

  sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ["HMS WhatsApp Bot", "Chrome", "120.0.0"],
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
  });

  // ── QR code generation ──────────────────────────────────────────────────────
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode = qr;
      qrcodeTerminal.generate(qr, { small: true });
      log("📱 QR Code generated! Open http://localhost:" + PORT + "/scan in your browser to scan it.");
    }

    if (connection === "open") {
      isConnected = true;
      qrCode = null;
      log("✅ WhatsApp connected successfully!");
      log("📋 To find your group IDs, visit: http://localhost:" + PORT + "/groups");
      log("🚀 Bot is ready to receive notices from your hostel portal.");
    }

    if (connection === "close") {
      isConnected = false;
      const shouldReconnect =
        lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
          : true;

      if (shouldReconnect) {
        log("🔄 Reconnecting to WhatsApp...");
        connectToWhatsApp();
      } else {
        err("❌ Logged out from WhatsApp. Delete the auth_session folder and restart.");
      }
    }
  });

  // ── Save credentials whenever updated ──────────────────────────────────────
  sock.ev.on("creds.update", saveCreds);
}

// ─── Start Everything ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  log(`🌐 Bot server running at http://localhost:${PORT}`);
  log(`🔗 Portal webhook → http://localhost:${PORT}/send-notice`);
  log("Connecting to WhatsApp...\n");
});

connectToWhatsApp().catch((e) => err("Fatal error:", e));
