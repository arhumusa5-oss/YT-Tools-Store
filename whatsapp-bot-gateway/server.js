const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const pino = require('pino');

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

// Ensure auth dir exists
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

async function startWhatsAppBot() {
  if (isStarting) return;
  isStarting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }), // Keep console clean
      browser: ['YT Tools Store Bot', 'Chrome', '1.0.0'],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQr = qr;
        try {
          currentQrDataUrl = await QRCode.toDataURL(qr);
          connectionStatus = 'qr_ready';
          console.log('[WhatsApp Bot] New QR Code generated. Scan via Linked Devices.');
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
          console.log('[WhatsApp Bot] Logged out permanently. Clearing session.');
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } catch (e) {}
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

  // Handle local Pakistani numbers
  if (cleaned.startsWith('03')) {
    cleaned = '92' + cleaned.slice(1);
  } else if (cleaned.startsWith('3') && cleaned.length === 10) {
    cleaned = '92' + cleaned;
  }

  // JID format
  return `${cleaned}@s.whatsapp.net`;
}

// REST APIs
// 1. Status Check
app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: connectionStatus,
    user: connectedUser,
    hasQr: Boolean(currentQrDataUrl),
    qrDataUrl: currentQrDataUrl,
  });
});

// 2. Send Message
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
    console.log(`[WhatsApp Bot] Message successfully sent to ${jid}`);
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

// 3. Logout / Reset
app.post('/logout', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
  } catch (e) {}

  try {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  } catch (e) {}

  currentQr = null;
  currentQrDataUrl = null;
  connectionStatus = 'disconnected';
  connectedUser = null;

  setTimeout(startWhatsAppBot, 1500);

  res.json({ success: true, message: 'Logged out successfully. Re-initializing new QR.' });
});

// 4. Clean Web Dashboard for QR Scanning
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
          subTitle.innerText = 'Bot is running and ready to send automated order messages.';
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

// Start bot connection and server
startWhatsAppBot();

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`[WhatsApp Bot Gateway] Running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to scan QR code`);
  console.log(`====================================================`);
});
