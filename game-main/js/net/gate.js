// LAN content gate. Uroboros is a hidden unlock — while a LAN host session is
// live it is off-limits, so the roster and the CPU draft both drop it.
// Tiny and import-free on purpose: match.js and screens.js read it without
// knowing anything about the socket layer.

let banned = false;
let customsBanned = false;

export function setUroborosBanned(v) {
  banned = !!v;
}

export function isUroborosBanned() {
  return banned;
}

export function setCustomsBanned(v) {
  customsBanned = !!v;
}

export function isCustomsBanned() {
  return customsBanned;
}
