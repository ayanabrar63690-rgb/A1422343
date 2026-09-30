import assert from "node:assert";
import net from "node:net";

const sync = await import("../js/net/sync.js");

// ---------- pure sync helpers ----------
const fakeSprites = () => {
  const s = {};
  for (const k of sync.SPRITE_LISTS) s[k] = [`${k}0`, `${k}1`];
  return s;
};
const flat = sync.flatSprites(fakeSprites());
assert.strictEqual(flat.length, sync.SPRITE_LISTS.length * 2, "all lists flattened");
assert.strictEqual(flat[0], "idle0", "idle first (buildSprites order)");
assert.strictEqual(flat[2], "walk0", "walk after idle");
assert.ok(flat.indexOf("attack1") > flat.indexOf("walk1"), "attack after walk");
assert.strictEqual(sync.indexOfFrame(flat, "kdown1"), flat.length - 1, "kdown last");
assert.strictEqual(sync.indexOfFrame(flat, "nope"), -1, "missing -> -1");

const f = {
  kind: "thor", x: 100, y: 452, vy: 0, grounded: true, facing: 1,
  state: "WALK", stateT: 0, attackId: null, phase: null, phaseT: 0,
  attackDir: 1, hp: 80, maxHp: 115, rage: 150, rageFlash: 0, moving: 1,
  crouchHeld: false, blockLow: false, blockRetreating: false, specialId: null,
  dashDir: 1, freezeT: 0, kT: 0, holdT: 0, invulnT: 0, vuln: true,
  decayN: 2, bleedN: 0, sinceDamageT: 9, animTime: 3.5, knockVX: 0,
  special: { phase: "fire", i: 2 },
};
const s = sync.snapFighter(f, 41);
assert.strictEqual(s.kind, "thor");
assert.strictEqual(s.frameIdx, 41);
assert.strictEqual(s.spPhase, "fire");
assert.strictEqual(s.spI, 2);
assert.strictEqual(s.hp, 80);
const g = { kind: "wesker" };
sync.applyFighter(g, s);
assert.strictEqual(g.kind, "thor", "kind follows snapshot");
assert.strictEqual(g.hp, 80);
assert.strictEqual(g.x, 100);
assert.strictEqual(g.vuln, true);
const s2 = sync.snapFighter({ ...f, special: null }, 7);
assert.strictEqual(s2.spPhase, null, "no special -> null phase");

// SFX capture wrapper
const calls = [];
const FakeFX = {
  ctx: null,
  ensure() {},
  tone() {},
  hit() { calls.push("real-hit"); },
  block() { calls.push("real-block"); },
};
const sink = [];
const disarm = sync.armSfxCapture(FakeFX, sink);
FakeFX.hit();
FakeFX.block();
assert.deepStrictEqual(sink, ["hit", "block"], "names recorded");
assert.deepStrictEqual(calls, ["real-hit", "real-block"], "originals still run");
disarm();
FakeFX.hit();
assert.deepStrictEqual(sink, ["hit", "block"], "silent after disarm");
assert.deepStrictEqual(calls, ["real-hit", "real-block", "real-hit"], "original restored");

// ---------- relay round-trip over real sockets ----------
const relay = await import("../net/relay.js");
const PORT = 18235;
await relay.startRelay(PORT, { beat: 100, dead: 300 });

const KEY = "dGhlIHNhbXBsZSBub25jZQ==";
function wsConnect() {
  return new Promise((resolve, reject) => {
    const sock = net.connect(PORT, "127.0.0.1");
    let buf = Buffer.alloc(0);
    let opened = false;
    const msgs = [];
    sock.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      if (!opened) {
        const i = buf.indexOf("\r\n\r\n");
        if (i < 0) return;
        const head = buf.subarray(0, i).toString();
        assert.ok(head.includes("101"), "upgrade accepted");
        assert.ok(head.includes("s3pPLMBiTxaQ9kYGzzhZRbK+xOo="), "valid accept key");
        opened = true;
        buf = buf.subarray(i + 4);
        resolve(api);
      }
      // server frames (unmasked)
      while (buf.length >= 2) {
        const op = buf[0] & 0x0f;
        let len = buf[1] & 0x7f;
        let hlen = 2;
        if (len === 126) {
          if (buf.length < 4) break;
          len = buf.readUInt16BE(2);
          hlen = 4;
        } else if (len === 127) {
          if (buf.length < 10) break;
          len = Number(buf.readBigUInt64BE(2));
          hlen = 10;
        }
        if (buf.length < hlen + len) break;
        if (op === 0x1) msgs.push(JSON.parse(buf.subarray(hlen, hlen + len).toString()));
        buf = buf.subarray(hlen + len);
      }
    });
    sock.on("error", reject);
    const api = {
      sock,
      msgs,
      send(obj) {
        const payload = Buffer.from(JSON.stringify(obj));
        const mask = Buffer.from([1, 2, 3, 4]);
        const out = Buffer.alloc(payload.length);
        for (let i = 0; i < payload.length; i++) out[i] = payload[i] ^ mask[i % 4];
        let head;
        if (payload.length < 126) head = Buffer.from([0x81, 0x80 | payload.length]);
        else if (payload.length < 65536) {
          head = Buffer.alloc(4);
          head[0] = 0x81;
          head[1] = 0x80 | 126;
          head.writeUInt16BE(payload.length, 2);
        } else {
          head = Buffer.alloc(10);
          head[0] = 0x81;
          head[1] = 0x80 | 127;
          head.writeBigUInt64BE(BigInt(payload.length), 2);
        }
        sock.write(Buffer.concat([head, mask, out]));
      },
      close() { sock.destroy(); },
    };
    sock.on("connect", () => {
      sock.write(
        "GET / HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n" +
          `Sec-WebSocket-Key: ${KEY}\r\nSec-WebSocket-Version: 13\r\n\r\n`
      );
    });
  });
}

const waitFor = (api, pred, ms = 2000) =>
  new Promise((resolve, reject) => {
    const t0 = Date.now();
    const tick = () => {
      const hit = api.msgs.find(pred);
      if (hit) return resolve(hit);
      if (Date.now() - t0 > ms) return reject(new Error("timeout waiting for message"));
      setTimeout(tick, 10);
    };
    tick();
  });

const host = await wsConnect();
assert.deepStrictEqual(await waitFor(host, (m) => m.t === "role"), { t: "role", role: "host" });
const guest = await wsConnect();
assert.deepStrictEqual(await waitFor(guest, (m) => m.t === "role"), { t: "role", role: "guest" });
assert.deepStrictEqual(await waitFor(host, (m) => m.t === "peer"), { t: "peer", on: true });

// guest input reaches host
guest.send({ t: "in", keys: ["arrowleft", ","] });
const got = await waitFor(host, (m) => m.t === "in");
assert.deepStrictEqual(got.keys, ["arrowleft", ","]);

// host snapshot reaches guest
host.send({ t: "snap", p1: { hp: 90 }, roundTime: 80 });
const snap = await waitFor(guest, (m) => m.t === "snap");
assert.strictEqual(snap.p1.hp, 90);
assert.strictEqual(snap.roundTime, 80);

// large frames: snapshot-sized (126-branch) and huge (127-branch)
const big = { t: "snap", blob: "x".repeat(2000) };
host.send(big);
const gotBig = await waitFor(guest, (m) => m.t === "snap" && m.blob && m.blob.length === 2000);
assert.strictEqual(gotBig.blob.length, 2000, "2KB frame survives");
const huge = { t: "snap", blob: "y".repeat(70000) };
host.send(huge);
const gotHuge = await waitFor(guest, (m) => m.t === "snap" && m.blob && m.blob.length === 70000);
assert.strictEqual(gotHuge.blob.length, 70000, "70KB frame survives");

// third connection replaces the stale guest slot (reconnects always work)
const third = await wsConnect();
assert.deepStrictEqual(await waitFor(third, (m) => m.t === "role"), { t: "role", role: "guest" });
assert.deepStrictEqual(await waitFor(host, (m) => m.t === "peer"), { t: "peer", on: true });
third.close();

// silent guest (no pong, no input) is timed out and the host is told
third.close();
assert.deepStrictEqual(await waitFor(host, (m) => m.t === "drop"), { t: "drop" });

host.close();
await relay.stopRelay();

console.log("net.test.mjs: all groups pass");
