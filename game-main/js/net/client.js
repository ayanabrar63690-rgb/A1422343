// Browser-side net client: connect, reconnect, send, route.
export function lastNetIP() {
  try {
    return localStorage.getItem("px-net-ip") || "";
  } catch {
    return "";
  }
}

export function saveNetIP(ip) {
  try {
    localStorage.setItem("px-net-ip", ip);
  } catch { /* ignore */ }
}

export function relayURL(ip, port = 8125) {
  const host = (ip || "").trim() || "localhost";
  return `ws://${host}:${port}`;
}

// onMsg(msg, api) for every parsed JSON message. api.send(obj), api.close().
export function connectNet(url, onMsg) {
  const ws = new WebSocket(url);
  const api = {
    sock: ws,
    role: null,
    send(obj) {
      if (ws.readyState === 1) ws.send(JSON.stringify(obj));
    },
    close() {
      try {
        ws.close();
      } catch { /* ignore */ }
    },
  };
  ws.onmessage = (ev) => {
    let m;
    try {
      m = typeof ev.data === "string" ? JSON.parse(ev.data) : null;
    } catch {
      return;
    }
    if (!m) return;
    if (m.t === "ping") {
      api.send({ t: "pong" });
      return;
    }
    onMsg(m, api);
  };
  return api;
}
