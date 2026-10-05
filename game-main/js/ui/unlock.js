export const HIDDEN_CODE = "uroboros";
const KEY = "px-unlock-uroboros";

function store() {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch { /* private mode */ }
  return null;
}

export function isUroborosUnlocked(s = store()) {
  try {
    return !!s && s.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function unlockUroboros(s = store()) {
  try {
    s && s.setItem(KEY, "1");
  } catch { /* ignore */ }
  return true;
}

// Pure code-entry helper (testable): feed one lowercase char, get back kept buffer + hit flag.
export function pushCode(buf, ch) {
  const next = (buf + ch).slice(-HIDDEN_CODE.length);
  return { buf: next, hit: next === HIDDEN_CODE };
}

export const CHEAT_CODE = "ak422";
const CHEAT_KEY = "px-cheat-ak422";

export function isCheatWeskerUnlocked(s = store()) {
  try {
    return !!s && s.getItem(CHEAT_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlockCheatWesker(s = store()) {
  try {
    s && s.setItem(CHEAT_KEY, "1");
  } catch { /* ignore */ }
  return true;
}

export function pushCheatCode(buf, ch) {
  const next = (buf + ch).slice(-CHEAT_CODE.length);
  return { buf: next, hit: next === CHEAT_CODE };
}
