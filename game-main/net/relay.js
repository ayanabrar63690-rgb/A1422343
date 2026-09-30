// Pixel Brawl LAN relay — zero dependencies, stdlib only.
// One machine runs:  node net/relay.js [port]
// Both browsers connect to it. First connection = host (P1 sim),
// second = guest (P2). Messages are forwarded untouched as text frames.
import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.argv[2] || 8125);
const MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

let host = null;
let guest = null;
let beatTimer = null;
let beatMs = 2000;
let deadMs = 6000;
const lastBeat = new Map();

function sendFrame(sock, obj) {
  if (!sock || sock.destroyed || !sock.writable) return;
  const payload = Buffer.from(JSON.stringify(obj));
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  try {
    sock.write(Buffer.concat([header, payload]));
  } catch { /* peer gone mid-write */ }
}

function closeSock(sock) {
  try {
    sock.write(Buffer.from([0x88, 0x00]));
  } catch { /* gone */ }
  sock.destroy();
}

function dropPeer(sock, notify) {
  let was = null;
  if (sock === host) {
    was = "host";
    host = null;
  } else if (sock === guest) {
    was = "guest";
    guest = null;
  }
  if (was && notify) sendFrame(was === "host" ? guest : host, { t: "drop" });
}

// Parse buffered client frames. Returns leftover buffer.
function pump(sock, buf) {
  let off = 0;
  while (buf.length - off >= 2) {
    const b0 = buf[off];
    const b1 = buf[off + 1];
    const fin = (b0 & 0x80) !== 0;
    const op = b0 & 0x0f;
    const masked = (b1 & 0x80) !== 0;
    let len = b1 & 0x7f;
    let hlen = 2;
    if (len === 126) {
      if (buf.length - off < 4) break;
      len = buf.readUInt16BE(off + 2);
      hlen = 4;
    } else if (len === 127) {
      if (buf.length - off < 10) break;
      len = Number(buf.readBigUInt64BE(off + 2));
      hlen = 10;
    }
    const mlen = masked ? 4 : 0;
    if (buf.length - off < hlen + mlen + len) break;
    if (op === 0x8) {
      dropPeer(sock, true);
      closeSock(sock);
      return Buffer.alloc(0);
    }
    if (op === 0x9) {
      // ping -> pong with same payload
      const body = buf.subarray(off + hlen + mlen, off + hlen + mlen + len);
      sock.write(Buffer.concat([Buffer.from([0x8a, body.length]), body]));
    } else if ((op === 0x1 || op === 0x0) && fin) {
      let body = buf.subarray(off + hlen + mlen, off + hlen + mlen + len);
      if (masked) {
        const mask = buf.subarray(off + hlen, off + hlen + 4);
        const out = Buffer.alloc(len);
        for (let i = 0; i < len; i++) out[i] = body[i] ^ mask[i % 4];
        body = out;
      }
      lastBeat.set(sock, Date.now());
      let pong = false;
      try {
        pong = JSON.parse(body.toString()).t === "pong";
      } catch { /* not JSON — forward anyway */ }
      const peer = sock === host ? guest : sock === guest ? host : null;
      if (!pong && peer && peer.writable && !peer.destroyed) {
        let outHead;
        if (len < 126) {
          outHead = Buffer.from([0x81, len]);
        } else if (len < 65536) {
          outHead = Buffer.alloc(4);
          outHead[0] = 0x81;
          outHead[1] = 126;
          outHead.writeUInt16BE(len, 2);
        } else {
          outHead = Buffer.alloc(10);
          outHead[0] = 0x81;
          outHead[1] = 127;
          outHead.writeBigUInt64BE(BigInt(len), 2);
        }
        peer.write(Buffer.concat([outHead, body]));
      }
    }
    off += hlen + mlen + len;
  }
  return buf.subarray(off);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("pixel-brawl relay ok\n");
});

server.on("upgrade", (req, sock) => {
  const key = req.headers["sec-websocket-key"];
  if (!key) {
    sock.destroy();
    return;
  }
  const accept = crypto.createHash("sha1").update(key + MAGIC).digest("base64");
  sock.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );
  try {
    sock.setNoDelay(true);
  } catch { /* ignore */ }
  let buf = Buffer.alloc(0);
  sock.on("data", (chunk) => {
    buf = pump(sock, Buffer.concat([buf, chunk]));
  });
  const bye = () => dropPeer(sock, true);
  sock.on("close", bye);
  sock.on("end", () => {
    dropPeer(sock, true);
    try {
      sock.destroy();
    } catch { /* ignore */ }
  });
  sock.on("error", () => dropPeer(sock, true));
  if (!host) {
    host = sock;
    lastBeat.set(sock, Date.now());
    sendFrame(sock, { t: "role", role: "host" });
    if (guest) sendFrame(guest, { t: "peer", on: true });
    console.log("host connected");
  } else if (!guest) {
    guest = sock;
    lastBeat.set(sock, Date.now());
    sendFrame(sock, { t: "role", role: "guest" });
    sendFrame(host, { t: "peer", on: true });
    console.log("guest connected — fight!");
  } else {
    // Slot taken: replace the stale peer so reconnects always work.
    const old = guest;
    guest = sock;
    lastBeat.set(sock, Date.now());
    lastBeat.delete(old);
    try {
      old.destroy();
    } catch { /* ignore */ }
    sendFrame(sock, { t: "role", role: "guest" });
    sendFrame(host, { t: "peer", on: true });
    console.log("guest reconnected — fight!");
  }
});

export function startRelay(port = PORT, opts = {}) {
  beatMs = opts.beat ?? 2000;
  deadMs = opts.dead ?? 6000;
  if (beatTimer) clearInterval(beatTimer);
  beatTimer = setInterval(() => {
    const now = Date.now();
    for (const [sock, role] of [[host, "host"], [guest, "guest"]]) {
      if (!sock) continue;
      if (now - (lastBeat.get(sock) || now) > deadMs) {
        console.log(`${role} timed out`);
        dropPeer(sock, true);
        try {
          sock.destroy();
        } catch { /* ignore */ }
      } else {
        sendFrame(sock, { t: "ping" });
      }
    }
  }, beatMs);
  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

export function stopRelay() {
  return new Promise((resolve) => {
    if (beatTimer) {
      clearInterval(beatTimer);
      beatTimer = null;
    }
    lastBeat.clear();
    for (const s of [host, guest]) {
      if (s) {
        try {
          s.destroy();
        } catch { /* ignore */ }
      }
    }
    host = guest = null;
    server.close(() => resolve());
  });
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) {
  server.on("error", (e) => {
    if (e && e.code === "EADDRINUSE") {
      console.error(`port ${PORT} is busy — a relay is already running, or try: node net/relay.js 8126`);
      process.exit(1);
    }
    throw e;
  });
  startRelay().then(() => {
    console.log(`pixel-brawl relay on :${PORT} — host clicks HOST, guest opens http://<host-ip>:8000`);
  });
}
