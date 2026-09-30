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
// onLinkFail() fires if the socket errors/closes before the relay assigns a role.
export function connectNet(url, onMsg, onLinkFail) {
  const ws = new WebSocket(url);
  const api = {
    sock: ws,
    role: null,
    linked: false,
    send(obj) {
      if (ws.readyState === 1) ws.send(JSON.stringify(obj));
    },
    close() {
      try {
        ws.close();
      } catch { /* ignore */ }
    },
  };
  const fail = () => {
    if (!api.linked && onLinkFail) {
      const cb = onLinkFail;
      onLinkFail = null;
      cb();
    }
  };
  ws.onopen = () => {
    // Role should follow within a heartbeat; if the relay never answers, fail loud.
    setTimeout(() => {
      if (!api.linked) {
        fail();
        try {
          ws.close();
        } catch { /* ignore */ }
      }
    }, 3000);
  };
  ws.onerror = fail;
  ws.onclose = fail;
  ws.onmessage = (ev) => {
    let m;
    try {
      m = typeof ev.data === "string" ? JSON.parse(ev.data) : null;
    } catch {
      return;
    }
    if (!m) return;
    if (m.t === "role") api.linked = true;
    if (m.t === "ping") {
      api.send({ t: "pong" });
      return;
    }
    onMsg(m, api);
  };
  return api;
}
