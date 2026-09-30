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
