// Player-created fighters: skin archetype, tier stats, special loadout,
// theme color. Persisted in localStorage and registered into CHARACTERS.
import { registerCharacter, CHARACTERS } from "./data.js";

export const CUSTOM_PREFIX = "custom_";

export function isCustomKind(kind) {
  return typeof kind === "string" && kind.startsWith(CUSTOM_PREFIX);
}

export const SKINS = Object.freeze([
  Object.freeze({
    id: "anime",
    name: "Anime Girl",
    desc: "thin • pink hair • cute green pupils • anime dress",
    skin: "#f6d8b8", hair: "#ff9ad5", hairDark: "#d96bab", eye: "#37c96a",
    cloth: "#ff6fb1",
  }),
  Object.freeze({
    id: "bearded",
    name: "Bearded Man",
    desc: "bushy beard • rugged coat",
    skin: "#d9a877", hair: "#5a4632", hairDark: "#3a2d20", eye: "#1f3fd4",
    cloth: "#6b5a48",
  }),
  Object.freeze({
    id: "sleek",
    name: "Sleek Man",
    desc: "sharp suit • clean lines",
    skin: "#e6b48c", hair: "#14141c", hairDark: "#06060c", eye: "#ffffff",
    cloth: "#23232f",
  }),
  Object.freeze({
    id: "golden",
    name: "Golden Woman",
    desc: "golden hair • radiant robe",
    skin: "#f2c9a0", hair: "#ffd23e", hairDark: "#c9a22e", eye: "#7a4fd0",
    cloth: "#c9962e",
  }),
]);

export const TIERS = Object.freeze([
  Object.freeze({
    id: "grappler", name: "Heavy Grappler",
    desc: "Huge HP and damage, slower swings.",
    stats: Object.freeze({ damage: 1.25, health: 1.30, moveSpeed: 0.85, attackSpeed: 0.90 }),
  }),
  Object.freeze({
    id: "brawler", name: "Brawler",
    desc: "Balanced across the board.",
    stats: Object.freeze({ damage: 1.00, health: 1.00, moveSpeed: 1.00, attackSpeed: 1.00 }),
  }),
  Object.freeze({
    id: "zoner", name: "Zoner",
    desc: "Long-range damage, less HP. Unlocks Beam Combo.",
    range: 1.25,
    stats: Object.freeze({ damage: 1.10, health: 0.90, moveSpeed: 0.95, attackSpeed: 1.00 }),
  }),
  Object.freeze({
    id: "bruiser", name: "Bruiser",
    desc: "Sturdy brawler who keeps coming.",
    stats: Object.freeze({ damage: 0.95, health: 1.20, moveSpeed: 0.95, attackSpeed: 1.00 }),
  }),
]);

export const ABILITIES = Object.freeze([
  Object.freeze({ id: "dash", name: "Dash Strike", desc: "Burst forward with a lunging dash strike." }),
  Object.freeze({ id: "combo", name: "Beam Combo", desc: "Three quick beam strikes at range. (Zoner only)", zonerOnly: true }),
  Object.freeze({ id: "beam", name: "Beam Strike", desc: "One heavy beam attack." }),
  Object.freeze({ id: "plasma", name: "Nebula Orbs", desc: "Volley of plasma balls that look like nebulas." }),
  Object.freeze({ id: "rush", name: "Rage Rush", desc: "Three lightning blink strikes." }),
  Object.freeze({ id: "shock", name: "Shockwave Slam", desc: "Charge forward and slam a shockwave." }),
]);

export const THEMES = Object.freeze([
  Object.freeze({ id: "pink", name: "Pink", accent: "#ff6fb1", cloth: "#ff6fb1" }),
  Object.freeze({ id: "blue", name: "Blue", accent: "#4f8dff", cloth: "#4f8dff" }),
  Object.freeze({ id: "green", name: "Green", accent: "#4fd07a", cloth: "#4fd07a" }),
  Object.freeze({ id: "purple", name: "Purple", accent: "#b06bff", cloth: "#b06bff" }),
  Object.freeze({ id: "orange", name: "Orange", accent: "#ff9a3e", cloth: "#ff9a3e" }),
  Object.freeze({ id: "red", name: "Red", accent: "#ff5a5a", cloth: "#ff5a5a" }),
]);

const CUSTOM_DEFS = new Map();
const STORAGE_KEY = "pixelbrawl_customs_v1";

export function customDef(kind) {
  return CUSTOM_DEFS.get(kind) ?? null;
}

export function getSkin(skinId) { return SKINS.find((s) => s.id === skinId) ?? SKINS[0]; }
export function getTier(tierId) { return TIERS.find((t) => t.id === tierId) ?? TIERS[1]; }
export function getTheme(themeId) { return THEMES.find((t) => t.id === themeId) ?? THEMES[0]; }
export function getAbility(abilityId) { return ABILITIES.find((a) => a.id === abilityId) ?? null; }

// Paint palette consumed by the custom painters in render/sprites.js.
export function paletteFor(skinId, themeId) {
  const skin = getSkin(skinId);
  const theme = getTheme(themeId);
  return {
    skin: skin.skin,
    hair: skin.hair,
    hairDark: skin.hairDark,
    eye: skin.eye,
    cloth: theme.cloth,
    clothDark: shade(theme.cloth, 0.55),
    trim: "#ffffff",
    beard: skin.id === "bearded",
    dress: skin.id === "anime" || skin.id === "golden",
    sleek: skin.id === "sleek",
  };
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * k)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * k)));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * k)));
  return `rgb(${r},${g},${b})`;
}

export function customKinds() {
  return [...CUSTOM_DEFS.keys()];
}

export function abilityAt(kind, slotId) {
  const def = CUSTOM_DEFS.get(kind);
  if (!def) return null;
  const order = slotId === "jaguar" ? 0 : slotId === "phantom" ? 1 : 2;
  return getAbility(def.abilities[order]);
}

export function specialRange(kind) {
  const def = CUSTOM_DEFS.get(kind);
  return getTier(def?.tierId)?.range ?? 1;
}

export function createCustomCharacter({ name, skinId, tierId, abilities, themeId }) {
  const safe = String(name || "CUSTOM").trim().slice(0, 12) || "CUSTOM";
  let base = CUSTOM_PREFIX + safe.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  let id = base, n = 2;
  while (CHARACTERS[id]) id = `${base}_${n++}`;
  const tier = getTier(tierId);
  const def = {
    id, name: safe.toUpperCase(), skinId, tierId,
    abilities: [...abilities], themeId,
    title: tier.name,
    desc: `${getSkin(skinId).name} • ${tier.name}`,
    accent: getTheme(themeId).accent,
    stats: { ...tier.stats },
  };
  def.custom = { skinId, tierId, abilities: def.abilities, themeId };
  CUSTOM_DEFS.set(id, def);
  registerCharacter(def);
  saveCustoms();
  return def;
}

export function saveCustoms() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(
      [...CUSTOM_DEFS.values()].map(({ id, name, skinId, tierId, abilities, themeId }) =>
        ({ id, name, skinId, tierId, abilities, themeId }))
    ));
  } catch { /* storage unavailable */ }
}

export function loadCustoms() {
  let arr = [];
  try {
    arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return; }
  for (const entry of arr) {
    if (!entry || !entry.id) continue;
    const tier = getTier(entry.tierId);
    const def = {
      id: entry.id, name: entry.name, skinId: entry.skinId, tierId: entry.tierId,
      abilities: entry.abilities ?? ["dash", "beam", "shock"], themeId: entry.themeId,
      title: tier.name,
      desc: `${getSkin(entry.skinId).name} • ${tier.name}`,
      accent: getTheme(entry.themeId).accent,
      stats: { ...tier.stats },
    };
    def.custom = { skinId: def.skinId, tierId: def.tierId, abilities: def.abilities, themeId: def.themeId };
    CUSTOM_DEFS.set(def.id, def);
    registerCharacter(def);
  }
}
