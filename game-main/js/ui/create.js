import { SKINS, TIERS, ABILITIES, THEMES, createCustomCharacter } from "../characters/custom.js";
import { buildCustomPortrait } from "../render/sprites.js";
import { AudioFX } from "../audio.js";

const state = {
  name: "",
  skinId: SKINS[0].id,
  tierId: TIERS[1].id,
  abilities: [],
  themeId: THEMES[0].id,
};

function el(id) { return document.getElementById(id); }

function paintedPreview() {
  const c = el("create-preview");
  const ctx = c.getContext("2d");
  const src = buildCustomPortrait(state.skinId, state.themeId);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 96, 96);
  ctx.drawImage(src, 0, 0, 32, 32, 6, 6, 84, 84);
}

function refreshPreview() {
  paintedPreview();
  el("create-preview-name").textContent = state.name.trim() || "—";
  const tier = TIERS.find((t) => t.id === state.tierId);
  el("create-preview-tier").textContent = tier ? tier.name.toUpperCase() : "";
  el("create-preview-stats").innerHTML = tier
    ? `DMG ${Math.round(tier.stats.damage * 100)}% · HP ${Math.round(tier.stats.health * 100)}%<br>SPD ${Math.round(tier.stats.moveSpeed * 100)}% · ATK ${Math.round(tier.stats.attackSpeed * 100)}%`
    : "";
  el("create-preview-abilities").innerHTML = state.abilities
    .map((id, i) => {
      const a = ABILITIES.find((x) => x.id === id);
      return a ? `${i + 1}. ${a.name}` : "";
    })
    .join("<br>");
  const valid = state.name.trim().length > 0 && state.tierId && state.abilities.length === 3 && state.skinId && state.themeId;
  el("btn-create-finish").disabled = !valid;
  const missing = [];
  if (!state.name.trim()) missing.push("type a name");
  if (state.abilities.length !== 3) missing.push(`pick ${3 - state.abilities.length} more abilit${state.abilities.length === 2 ? "y" : "ies"}`);
  el("create-hint").textContent = valid ? "ready!" : missing.join(" + ");
}

function paintSkins() {
  const box = el("create-skins");
  box.innerHTML = "";
  for (const s of SKINS) {
    const b = document.createElement("button");
    b.className = "choice" + (state.skinId === s.id ? " selected" : "");
    const c = buildCustomPortrait(s.id, state.themeId);
    c.style.width = "48px"; c.style.height = "48px";
    b.appendChild(c);
    const nm = document.createElement("b");
    nm.textContent = s.name;
    b.appendChild(nm);
    const ds = document.createElement("span");
    ds.textContent = s.desc;
    b.appendChild(ds);
    b.onclick = () => { AudioFX.blip(520); state.skinId = s.id; paintSkins(); refreshPreview(); };
    box.appendChild(b);
  }
}

function paintTiers() {
  const box = el("create-tiers");
  box.innerHTML = "";
  for (const t of TIERS) {
    const b = document.createElement("button");
    b.className = "choice" + (state.tierId === t.id ? " selected" : "");
    const nm = document.createElement("b");
    nm.textContent = t.name;
    const ds = document.createElement("span");
    ds.textContent = `${t.desc}  DMG ${Math.round(t.stats.damage * 100)}% · HP ${Math.round(t.stats.health * 100)}% · SPD ${Math.round(t.stats.moveSpeed * 100)}% · ATK ${Math.round(t.stats.attackSpeed * 100)}%`;
    b.append(nm, ds);
    b.onclick = () => {
      AudioFX.blip(520);
      state.tierId = t.id;
      if (t.id !== "zoner") state.abilities = state.abilities.filter((id) => id !== "combo");
      paintTiers(); paintAbilities(); refreshPreview();
    };
    box.appendChild(b);
  }
}

function paintAbilities() {
  const box = el("create-abilities");
  box.innerHTML = "";
  for (const a of ABILITIES) {
    const zonerOnly = a.zonerOnly && state.tierId !== "zoner";
    const picked = state.abilities.includes(a.id);
    const b = document.createElement("button");
    b.className = "choice" + (picked ? " selected" : "") + (zonerOnly ? " disabled" : "");
    const nm = document.createElement("b");
    nm.textContent = a.name;
    const ds = document.createElement("span");
    ds.textContent = zonerOnly ? "Requires Zoner tier" : a.desc;
    b.append(nm, ds);
    b.onclick = () => {
      AudioFX.blip(520);
      if (picked) state.abilities = state.abilities.filter((id) => id !== a.id);
      else if (state.abilities.length < 3) state.abilities.push(a.id);
      else state.abilities = [state.abilities[1], state.abilities[2], a.id]; // replace oldest
      paintAbilities(); refreshPreview();
    };
    box.appendChild(b);
  }
}

function paintThemes() {
  const box = el("create-themes");
  box.innerHTML = "";
  for (const t of THEMES) {
    const b = document.createElement("button");
    b.className = "choice theme" + (state.themeId === t.id ? " selected" : "");
    const sw = document.createElement("span");
    sw.className = "swatch";
    sw.style.background = t.accent;
    const nm = document.createElement("b");
    nm.textContent = t.name;
    b.append(sw, nm);
    b.onclick = () => { AudioFX.blip(520); state.themeId = t.id; paintThemes(); paintSkins(); refreshPreview(); };
    box.appendChild(b);
  }
}

export function initCreate(hooks) {
  el("btn-create").onclick = () => {
    AudioFX.blip(660);
    for (const s of document.querySelectorAll(".screen")) s.classList.remove("visible");
    el("screen-create").classList.add("visible");
    refreshAll();
  };
  el("btn-create-back").onclick = () => {
    AudioFX.blip(400);
    for (const s of document.querySelectorAll(".screen")) s.classList.remove("visible");
    el("screen-menu").classList.add("visible");
  };
  el("create-name").oninput = (e) => { state.name = e.target.value; refreshPreview(); };
  el("btn-create-finish").onclick = () => {
    if (state.abilities.length !== 3) return;
    AudioFX.levelUp();
    createCustomCharacter({
      name: state.name,
      skinId: state.skinId,
      tierId: state.tierId,
      abilities: state.abilities,
      themeId: state.themeId,
    });
    hooks?.onCreated?.();
  };
}

function refreshAll() {
  paintSkins();
  paintTiers();
  paintAbilities();
  paintThemes();
  refreshPreview();
}
