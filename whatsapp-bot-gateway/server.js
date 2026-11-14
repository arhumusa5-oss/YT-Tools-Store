const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const zlib = require('zlib');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 3005;
const AUTH_DIR = path.join(__dirname, 'auth_session');

// Middleware
app.use(cors());
app.use(express.json());

// In-memory status
let sock = null;
let currentQr = null;
let currentQrDataUrl = null;
let connectionStatus = 'initializing'; // initializing, qr_ready, connecting, connected, disconnected
let connectedUser = null;
let isStarting = false;
let saveSessionTimeout = null;

// Ensure auth dir exists
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// -------------------------------------------------------------
// Database Connection (Neon PostgreSQL)
// -------------------------------------------------------------
function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const [k, ...v] = line.trim().split('=');
        if (k === 'DATABASE_URL' || k === 'POSTGRES_URL') {
          return v.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  } catch (e) {}
  return 'postgresql://neondb_owner:npg_u0W2dgHOLfTA@ep-bitter-flower-b868q2v7-pooler.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require';
}

const dbUrl = getDatabaseUrl();
let neonSql = null;
try {
  const { neon } = require('@neondatabase/serverless');
  neonSql = neon(dbUrl);
} catch (e) {
  console.error('[WhatsApp Bot] Failed to init Neon SQL client:', e.message);
}

// Ensure database tables exist for cloud persistence
async function ensureDatabaseTables() {
  if (!neonSql) return;
  try {
    await neonSql`
      CREATE TABLE IF NOT EXISTS whatsapp_cloud_session (
        id VARCHAR(50) PRIMARY KEY,
        session_data TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await neonSql`
      CREATE TABLE IF NOT EXISTS whatsapp_sent_orders (
        order_id VARCHAR(100) NOT NULL,
        notification_type VARCHAR(50) NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (order_id, notification_type)
      )
    `;
  } catch (err) {
    console.error('[WhatsApp Bot] Error ensuring DB tables:', err.message);
  }
}

// Restore session files from Neon DB if running fresh on Cloud/Render
async function restoreSessionFromCloud() {
  if (!neonSql) return false;
  try {
    const credsPath = path.join(AUTH_DIR, 'creds.json');
    if (fs.existsSync(credsPath)) {
      return true; // Already exists locally
    }

    console.log('[WhatsApp Bot] Checking Neon DB for saved cloud session...');
    const rows = await neonSql`SELECT session_data FROM whatsapp_cloud_session WHERE id = 'primary' LIMIT 1`;
    if (!rows || rows.length === 0 || !rows[0].session_data) {
      console.log('[WhatsApp Bot] No saved cloud session found in DB. Ready for initial QR scan.');
      return false;
    }

    const gzipped = Buffer.from(rows[0].session_data, 'base64');
    const jsonStr = zlib.gunzipSync(gzipped).toString('utf8');
    const bundle = JSON.parse(jsonStr);

    let restoredCount = 0;
    for (const [filename, content] of Object.entries(bundle)) {
      fs.writeFileSync(path.join(AUTH_DIR, filename), content, 'utf8');
      restoredCount++;
    }

    console.log(`[WhatsApp Bot] Restored ${restoredCount} session files from Neon DB cloud storage!`);
    return true;
  } catch (err) {
    console.error('[WhatsApp Bot] Error restoring session from cloud:', err.message);
    return false;
  }
}

// Save session files to Neon DB in compressed bundle (debounced)
function scheduleCloudSessionSave() {
  if (!neonSql) return;
  if (saveSessionTimeout) clearTimeout(saveSessionTimeout);

  saveSessionTimeout = setTimeout(async () => {
    try {
      if (!fs.existsSync(AUTH_DIR)) return;
      const files = fs.readdirSync(AUTH_DIR);
      if (files.length === 0) return;

      const credsPath = path.join(AUTH_DIR, 'creds.json');
      if (!fs.existsSync(credsPath)) return;

      const bundle = {};
      for (const f of files) {
        const fullPath = path.join(AUTH_DIR, f);
        if (fs.statSync(fullPath).isFile()) {
          bundle[f] = fs.readFileSync(fullPath, 'utf8');
        }
      }

      const gzipped = zlib.gzipSync(JSON.stringify(bundle));
      const base64 = gzipped.toString('base64');

      await neonSql`
        INSERT INTO whatsapp_cloud_session (id, session_data, updated_at)
        VALUES ('primary', ${base64}, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET session_data = EXCLUDED.session_data, updated_at = CURRENT_TIMESTAMP
      `;
      console.log(`[WhatsApp Bot Cloud Sync] Saved ${files.length} session files to Neon DB (${(base64.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error('[WhatsApp Bot Cloud Sync] Failed to sync session to DB:', err.message);
    }
  }, 4000);
}

// -------------------------------------------------------------
// Baileys WhatsApp Connection
// -------------------------------------------------------------
async function startWhatsAppBot() {
  if (isStarting) return;
  isStarting = true;

  try {
    await ensureDatabaseTables();
    await restoreSessionFromCloud();

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
      browser: ['YT Tools Store Bot', 'Chrome', '1.0.0'],
    });

    sock.ev.on('creds.update', async () => {
      await saveCreds();
      scheduleCloudSessionSave();
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQr = qr;
        try {
          currentQrDataUrl = await QRCode.toDataURL(qr);
          connectionStatus = 'qr_ready';
          console.log('[WhatsApp Bot] New QR Code generated. Scan via WhatsApp Linked Devices.');
        } catch (err) {
          console.error('[WhatsApp Bot] QR generation error:', err);
        }
      }

      if (connection === 'connecting') {
        connectionStatus = 'connecting';
        console.log('[WhatsApp Bot] Connecting to WhatsApp...');
      }

      if (connection === 'open') {
        connectionStatus = 'connected';
        currentQr = null;
        currentQrDataUrl = null;
        connectedUser = sock.user ? sock.user.id.split(':')[0] : 'Connected';
        console.log(`[WhatsApp Bot] Successfully CONNECTED! Logged in as: ${connectedUser}`);
        scheduleCloudSessionSave();
      }

      if (connection === 'close') {
        connectionStatus = 'disconnected';
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[WhatsApp Bot] Connection closed. Status code: ${statusCode}. Should reconnect: ${shouldReconnect}`);

        if (shouldReconnect) {
          isStarting = false;
          setTimeout(startWhatsAppBot, 3000);
        } else {
          console.log('[WhatsApp Bot] Logged out permanently. Clearing local & cloud session.');
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } catch (e) {}
          if (neonSql) {
            try {
              await neonSql`DELETE FROM whatsapp_cloud_session WHERE id = 'primary'`;
            } catch (e) {}
          }
          isStarting = false;
          setTimeout(startWhatsAppBot, 2000);
        }
      }
    });
  } catch (error) {
    console.error('[WhatsApp Bot] Error during startup:', error);
    isStarting = false;
    setTimeout(startWhatsAppBot, 5000);
  } finally {
    isStarting = false;
  }
}

// Format phone number to WhatsApp JID format
function formatWhatsAppJid(phone) {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/[^0-9]/g, '');

  if (cleaned.startsWith('03')) {
    cleaned = '92' + cleaned.slice(1);
  } else if (cleaned.startsWith('3') && cleaned.length === 10) {
    cleaned = '92' + cleaned;
  }

  return `${cleaned}@s.whatsapp.net`;
}

// -------------------------------------------------------------
// Database Order Poller (24/7 Automated Notifications)
// -------------------------------------------------------------
let isPolling = false;
let sentOrdersCache = new Set();
let pollerCacheLoaded = false;

async function checkDatabaseForNewOrders() {
  if (isPolling) return;
  if (connectionStatus !== 'connected' || !sock || !neonSql) return;

  isPolling = true;
  try {
    // 1. Load sent order IDs from database on first run
    if (!pollerCacheLoaded) {
      const sentRows = await neonSql`SELECT order_id, notification_type FROM whatsapp_sent_orders`;
      if (sentRows && sentRows.length > 0) {
        for (const row of sentRows) {
          sentOrdersCache.add(`${row.order_id}_${row.notification_type}`);
        }
      } else {
        // First boot with zero records: pre-seed with existing orders to prevent spamming old orders
        const stateRows = await neonSql`SELECT data FROM yt_store_state WHERE id = 'main' LIMIT 1`;
        const existingOrders = stateRows[0]?.data?.orders || [];
        for (const o of existingOrders) {
          sentOrdersCache.add(`${o.id}_new_order`);
          try {
            await neonSql`
              INSERT INTO whatsapp_sent_orders (order_id, notification_type)
              VALUES (${o.id}, 'new_order')
              ON CONFLICT DO NOTHING
            `;
          } catch (e) {}
        }
      }
      pollerCacheLoaded = true;
      console.log(`[WhatsApp Bot Poller] Loaded ${sentOrdersCache.size} historic notification records from DB.`);
    }

    // 2. Fetch latest store state from Neon DB
    const rows = await neonSql`SELECT data FROM yt_store_state WHERE id = 'main' LIMIT 1`;
    if (!rows || rows.length === 0) return;

    const storeData = rows[0].data;
    const botConfig = storeData?.settings?.whatsappBot;
    if (botConfig?.enabled === false) return;

    const orders = Array.isArray(storeData.orders) ? storeData.orders : [];

    // 3. Check for new orders
    if (botConfig?.notifyOnNewOrder !== false) {
      for (const order of orders.slice(0, 10)) {
        if (!order || !order.id || !order.customerWhatsApp) continue;

        const cacheKey = `${order.id}_new_order`;
        if (!sentOrdersCache.has(cacheKey)) {
          const cleanOrderId = (order.id || '').replace(/^#/, '');
          const customerName = (order.customerName || 'Customer').trim();
          const productsString =
            order.items && order.items.length > 0
              ? order.items.map((item) => `${item.title} (x${item.quantity})`).join(', ')
              : 'Digital Tool';

          const message = `*Order Status Processing 📦*

Thank You *${customerName}* For Shopping From YT Tools Store 🛒 

🆔 Your Order ID : #${cleanOrderId}
📦 Product : ${productsString}

*Our Team Is Working To Complete  Your Order 📦✅*

This Is An Automated Message From YT Tools Store Bot 🌐`;

          const jid = formatWhatsAppJid(order.customerWhatsApp);
          if (jid) {
            try {
              console.log(`[WhatsApp Bot Poller] Sending new order alert to ${jid} for order #${cleanOrderId}...`);
              await sock.sendMessage(jid, { text: message.trim() });
              sentOrdersCache.add(cacheKey);

              await neonSql`
                INSERT INTO whatsapp_sent_orders (order_id, notification_type)
                VALUES (${order.id}, 'new_order')
                ON CONFLICT DO NOTHING
              `;
              console.log(`[WhatsApp Bot Poller] Successfully delivered WhatsApp to ${jid} for order #${cleanOrderId}`);
            } catch (err) {
              console.error(`[WhatsApp Bot Poller] Error sending to ${jid}:`, err.message);
            }
          }
        }
      }
    }

    // 4. Check for completed orders
    if (botConfig?.notifyOnCompleted === true) {
      for (const order of orders.slice(0, 10)) {
        if (!order || !order.id || !order.customerWhatsApp) continue;

        const cacheKey = `${order.id}_completed`;
        if (order.status === 'completed' && !sentOrdersCache.has(cacheKey)) {
          const itemsSummary = (order.items || []).map((i) => i.title).join(', ');
          const deliveryNotes =
            order.channelOrDeliveryNote ||
            order.adminNotes ||
            'Your account credentials have been assigned and verified.';

          const message = `*Assalam o Alaikum ${order.customerName || 'Customer'}!*

Good news! Aapka order *#${order.id}* for *${itemsSummary}* complete ho gaya hai.

*Delivery & Credentials:*
${deliveryNotes}

Aap kisi bhi waqt apna order status aur receipt yahan verify kar sakte hain:
https://yt-tools-store.vercel.app/track-order?id=${encodeURIComponent(order.id)}

Agar koi masla ho toh foran reply karein.
_YT Tools Store Official Support: +92 314 0796993_`;

          const jid = formatWhatsAppJid(order.customerWhatsApp);
          if (jid) {
            try {
              console.log(`[WhatsApp Bot Poller] Sending completion alert to ${jid} for order #${order.id}...`);
              await sock.sendMessage(jid, { text: message.trim() });
              sentOrdersCache.add(cacheKey);

              await neonSql`
                INSERT INTO whatsapp_sent_orders (order_id, notification_type)
                VALUES (${order.id}, 'completed')
                ON CONFLICT DO NOTHING
              `;
              console.log(`[WhatsApp Bot Poller] Successfully delivered completed alert to ${jid} for order #${order.id}`);
            } catch (err) {
              console.error(`[WhatsApp Bot Poller] Error sending completed alert to ${jid}:`, err.message);
            }
          }
        }
      }
    }
  } catch (err) {
    // Ignore transient poll errors
  } finally {
    isPolling = false;
  }
}

// Start auto-poller every 3.5 seconds
setInterval(checkDatabaseForNewOrders, 3500);

// -------------------------------------------------------------
// REST Endpoints
// -------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: connectionStatus,
    user: connectedUser,
    hasQr: Boolean(currentQrDataUrl),
    qrDataUrl: currentQrDataUrl,
  });
});

app.post('/send-message', async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ success: false, error: 'Both "to" and "message" are required.' });
  }

  if (connectionStatus !== 'connected' || !sock) {
    return res.status(503).json({
      success: false,
      error: 'WhatsApp Bot is not connected yet. Please scan the QR code first.',
      status: connectionStatus,
    });
  }

  const jid = formatWhatsAppJid(to);
  if (!jid) {
    return res.status(400).json({ success: false, error: 'Invalid phone number format.' });
  }

  try {
    const sent = await sock.sendMessage(jid, { text: message.trim() });
    console.log(`[WhatsApp Bot] Direct message successfully sent to ${jid}`);
    return res.json({
      success: true,
      messageId: sent.key.id,
      recipient: jid,
    });
  } catch (err) {
    console.error(`[WhatsApp Bot] Failed to send message to ${jid}:`, err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to send WhatsApp message.',
    });
  }
});

app.post('/logout', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
  } catch (e) {}

  try {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  } catch (e) {}

  if (neonSql) {
    try {
      await neonSql`DELETE FROM whatsapp_cloud_session WHERE id = 'primary'`;
    } catch (e) {}
  }

  currentQr = null;
  currentQrDataUrl = null;
  connectionStatus = 'disconnected';
  connectedUser = null;

  setTimeout(startWhatsAppBot, 1500);
  res.json({ success: true, message: 'Logged out successfully. Re-initializing new QR.' });
});

// Clean Web Dashboard for Monitoring & QR
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YT Tools Store - WhatsApp Bot Gateway</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0A0A0E; color: #FFFFFF; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #121218; border: 1px solid #262632; border-radius: 20px; max-width: 440px; width: 100%; padding: 32px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; }
    .badge-connected { background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
    .badge-qr { background: rgba(255, 85, 0, 0.15); color: #FF5500; border: 1px solid rgba(255, 85, 0, 0.3); }
    .badge-waiting { background: rgba(234, 179, 8, 0.15); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.3); }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    h1 { font-size: 20px; font-weight: 800; margin-bottom: 8px; }
    p { font-size: 13px; color: #9CA3AF; margin-bottom: 24px; line-height: 1.5; }
    .qr-container { background: #FFFFFF; padding: 16px; border-radius: 16px; display: inline-block; margin-bottom: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
    .qr-container img { width: 220px; height: 220px; display: block; }
    .steps { text-align: left; background: #181820; border: 1px solid #22222E; border-radius: 14px; padding: 16px; margin-bottom: 24px; font-size: 12px; color: #D1D5DB; }
    .steps ol { padding-left: 20px; }
    .steps li { margin-bottom: 6px; }
    .btn { background: #FF5500; color: #FFFFFF; border: none; padding: 12px 24px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; width: 100%; }
    .btn:hover { background: #E64A00; }
    .btn-danger { background: #22222C; color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.2); margin-top: 10px; }
    .btn-danger:hover { background: rgba(239, 68, 68, 0.1); }
  </style>
</head>
<body>
  <div class="card">
    <div id="badgeContainer">
      <span class="badge badge-waiting"><span class="dot"></span> Checking Status...</span>
    </div>
    
    <h1>WhatsApp Bot Gateway</h1>
    <p id="subTitle">Connecting to WhatsApp Multi-Device session...</p>
    
    <div id="qrBox" style="display: none;">
      <div class="qr-container">
        <img id="qrImg" src="" alt="WhatsApp QR Code">
      </div>
      <div class="steps">
        <ol>
          <li>Open <strong>WhatsApp</strong> on your mobile</li>
          <li>Tap <strong>Settings / 3 Dots</strong> &rarr; <strong>Linked Devices</strong></li>
          <li>Tap <strong>Link a Device</strong> and point camera here</li>
        </ol>
      </div>
    </div>

    <div id="connectedBox" style="display: none; margin-bottom: 24px;">
      <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 16px; padding: 24px;">
        <div style="font-size: 36px; margin-bottom: 8px;">✓</div>
        <div style="font-weight: 800; font-size: 16px; color: #22C55E; margin-bottom: 4px;">Connected & Active</div>
        <div id="userPhone" style="font-size: 13px; color: #9CA3AF;">+92 314 0796993</div>
        <div style="font-size: 11px; color: #6B7280; margin-top: 12px;">Store orders will now automatically receive instant WhatsApp confirmation!</div>
      </div>
      <button class="btn btn-danger" onclick="logoutBot()">Disconnect / Change Number</button>
    </div>
  </div>

  <script>
    async function checkStatus() {
      try {
        const res = await fetch('/status');
        const data = await res.json();
        const badge = document.getElementById('badgeContainer');
        const subTitle = document.getElementById('subTitle');
        const qrBox = document.getElementById('qrBox');
        const qrImg = document.getElementById('qrImg');
        const connectedBox = document.getElementById('connectedBox');
        const userPhone = document.getElementById('userPhone');

        if (data.status === 'connected') {
          badge.innerHTML = '<span class="badge badge-connected"><span class="dot"></span> Online & Connected</span>';
          subTitle.innerText = 'Bot is running 24/7 and ready to send automated order messages.';
          qrBox.style.display = 'none';
          connectedBox.style.display = 'block';
          if (data.user) userPhone.innerText = '+' + data.user;
        } else if (data.status === 'qr_ready' && data.qrDataUrl) {
          badge.innerHTML = '<span class="badge badge-qr"><span class="dot"></span> Scan QR Code</span>';
          subTitle.innerText = 'Scan the QR code below using WhatsApp on your phone.';
          qrImg.src = data.qrDataUrl;
          qrBox.style.display = 'block';
          connectedBox.style.display = 'none';
        } else {
          badge.innerHTML = '<span class="badge badge-waiting"><span class="dot"></span> Connecting...</span>';
          subTitle.innerText = 'Initializing WhatsApp session. Please wait...';
          qrBox.style.display = 'none';
          connectedBox.style.display = 'none';
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function logoutBot() {
      if (confirm('Are you sure you want to disconnect this WhatsApp number?')) {
        await fetch('/logout', { method: 'POST' });
        checkStatus();
      }
    }

    setInterval(checkStatus, 2500);
    checkStatus();
  </script>
</body>
</html>
  `);
});

// Start bot
startWhatsAppBot();

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`[WhatsApp Bot Gateway] Running on port ${PORT}`);
  console.log(`====================================================`);
});
