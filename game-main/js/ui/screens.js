import { CHARACTERS } from "../characters/data.js";
import { BASE_HP } from "../combat/data.js";
import { buildPortrait } from "../render/sprites.js";
import { AudioFX } from "../audio.js";
import { MAPS } from "../maps/index.js";
import { SETTINGS } from "../config.js";
import { draftCounterTeam } from "../match.js";
import { isUroborosUnlocked } from "./unlock.js";

function show(id) {
  for (const s of document.querySelectorAll(".screen")) s.classList.remove("visible");
  if (id) document.getElementById(id)?.classList.add("visible");
  document.getElementById("fight-bar").classList.toggle("hidden", id !== null);
}

const MAP_HINT_DEFAULT = "Pick a stage to enter the scene.";

const ROSTER_ORDER = ["wesker", "homelander", "wolverine", "hulk", "ironman", "thor", "spiderman", "doom", "uroboros"];
let draftSide = 1;

export function visibleRoster() {
  const unlocked = isUroborosUnlocked();
  return ROSTER_ORDER.filter((k) => CHARACTERS[k] && (k !== "uroboros" || unlocked));
}

function statLine(kind) {
  const signed = (m) => ((m - 1) * 100 >= 0 ? "+" : "") + Math.round((m - 1) * 100) + "%";
  const st = CHARACTERS[kind].stats;
  return `SPD ${signed(st.moveSpeed)} · ATK ${signed(st.attackSpeed)} · ` +
    `DMG ${signed(st.damage)} · HP ${Math.round(BASE_HP * st.health)}`;
}

function paintDraft(sel) {

  for (const [key, boxId] of [["p1", "members-p1"], ["p2", "members-p2"]]) {
    const box = document.getElementById(boxId);
    box.innerHTML = "";
    sel[key].forEach((kind, i) => {
      const b = document.createElement("button");
      b.className = "member" + (i === 0 ? " lead" : "");
      b.title = i === 0 ? `${CHARACTERS[kind].name} leads (can't remove)` : `Remove ${CHARACTERS[kind].name}`;
      b.appendChild(buildPortrait(kind));
      const nm = document.createElement("span");
      nm.textContent = CHARACTERS[kind].name;
      b.appendChild(nm);
      b.onclick = () => {
        if (sel[key].length <= 1) { AudioFX.blip(220); return; }
        AudioFX.blip(400);
        sel[key].splice(i, 1);
        paintDraft(sel);
      };
      box.appendChild(b);
    });
    for (let i = sel[key].length; i < sel.teamSize; i++) {
      const e = document.createElement("div");
      e.className = "slot-empty";
      e.textContent = "+";
      box.appendChild(e);
    }
  }

  const roster = document.getElementById("roster");
  roster.innerHTML = "";
  for (const kind of visibleRoster()) {
    const card = document.createElement("button");
    card.className = "fighter-card";
    card.style.borderColor = CHARACTERS[kind].accent;
    card.appendChild(buildPortrait(kind));
    const nm = document.createElement("div");
    nm.className = "fighter-name";
    nm.textContent = CHARACTERS[kind].name;
    nm.style.color = CHARACTERS[kind].accent;
    const st = document.createElement("div");
    st.className = "fighter-stats";
    st.textContent = statLine(kind);
    const tags = document.createElement("div");
    tags.className = "fighter-tags";
    if (sel.p1.includes(kind)) {
      const t = document.createElement("span");
      t.className = "tag p1";
      t.textContent = "P1";
      tags.appendChild(t);
    }
    if (sel.p2.includes(kind)) {
      const t = document.createElement("span");
      t.className = "tag p2";
      t.textContent = "P2";
      tags.appendChild(t);
    }
    card.append(nm, st, tags);
    card.onclick = () => {
      AudioFX.blip(520);
      const team = draftSide === 1 ? sel.p1 : sel.p2;
      if (team.length >= sel.teamSize) team.length = 0;
      team.push(kind);

      const other = draftSide === 1 ? sel.p2 : sel.p1;
      if (other.length < sel.teamSize) draftSide = draftSide === 1 ? 2 : 1;
      paintSide();
      paintDraft(sel);
    };
    roster.appendChild(card);
  }
}

function paintSide() {
  document.querySelectorAll("[data-side]").forEach((b) => {
    const n = Number(b.dataset.side);
    b.classList.toggle("selected", n === draftSide);
    b.classList.toggle("ghost", n !== draftSide);
  });
}

export function initScreens(sel, hooks) {
  paintDraft(sel);
  paintSide();
  document.getElementById("btn-start").onclick = () => { AudioFX.blip(660); show("screen-char"); hooks.onState("CHAR_SELECT"); };
  document.getElementById("btn-howto").onclick = () => {
    document.getElementById("howto").classList.toggle("hidden");
  };

  const paintSpin = () => {
    const b = document.getElementById("btn-spin");
    if (b) {
      b.textContent = `SPIN STRIKES: ${SETTINGS.wolvieSpin ? "ON" : "OFF"}`;
      b.classList.toggle("ghost", !SETTINGS.wolvieSpin);
    }
  };
  paintSpin();
  document.getElementById("btn-spin").onclick = () => {
    AudioFX.blip(600);
    SETTINGS.wolvieSpin = !SETTINGS.wolvieSpin;
    paintSpin();
  };
  document.querySelectorAll("[data-side]").forEach((b) => {
    b.onclick = () => { AudioFX.blip(600); draftSide = Number(b.dataset.side); paintSide(); };
  });
  document.querySelectorAll("[data-cpu-draft]").forEach((b) => {
    b.onclick = () => {
      AudioFX.blip(700);
      sel.p2 = draftCounterTeam(sel.p1, sel.teamSize);
      paintDraft(sel);
    };
  });
  document.querySelectorAll("[data-p]").forEach((b) => {

    b.onclick = () => {
      AudioFX.blip(520);
      const team = b.dataset.p === "1" ? sel.p1 : sel.p2;
      if (team.length >= sel.teamSize) team.length = 0;
      team.push(b.dataset.c);
      paintDraft(sel);
    };
  });
  const paintTeam = () => {
    document.querySelectorAll("[data-team]").forEach((b) => {
      const n = Number(b.dataset.team);
      b.classList.toggle("selected", n === sel.teamSize);
      b.classList.toggle("ghost", n !== sel.teamSize);
    });
  };
  paintTeam();
  document.querySelectorAll("[data-team]").forEach((b) => {
    b.onclick = () => {
      AudioFX.blip(600);
      sel.teamSize = Number(b.dataset.team);

      for (const key of ["p1", "p2"]) {
        sel[key].length = Math.min(sel[key].length, sel.teamSize);
        while (sel[key].length < sel.teamSize) sel[key].push(sel[key][0]);
      }
      paintTeam();
      paintDraft(sel);
    };
  });
  const paintDiff = () => {
    document.querySelectorAll("[data-diff]").forEach((b) => {
      b.classList.toggle("selected", b.dataset.diff === sel.diff);
      b.classList.toggle("ghost", b.dataset.diff !== sel.diff);
    });
  };
  paintDiff();
  document.querySelectorAll("[data-diff]").forEach((b) => {
    b.onclick = () => { AudioFX.blip(600); sel.diff = b.dataset.diff; paintDiff(); };
  });
  document.getElementById("btn-to-maps").onclick = () => {
    AudioFX.blip(660);
    document.getElementById("map-hint").textContent = MAP_HINT_DEFAULT;
    show("screen-map");
    hooks.onState("MAP_SELECT");
  };
  document.getElementById("btn-back-char").onclick = () => { show("screen-char"); hooks.onState("CHAR_SELECT"); };

  const hintFor = (id) =>
    id === "random" ? "Rolls a fresh stage every match."
      : MAPS[id]?.desc ?? MAP_HINT_DEFAULT;
  document.querySelectorAll("[data-m]").forEach((b) => {
    b.onmouseenter = () => { document.getElementById("map-hint").textContent = hintFor(b.dataset.m); };
    b.onclick = () => {
      AudioFX.blip(760);
      hooks.onPickMap(b.dataset.m);
    };
  });
  document.getElementById("btn-quit").onclick = () => { hooks.onQuit(); show("screen-menu"); };
  document.getElementById("btn-swap-map").onclick = () => hooks.onSwapMap();
  return { show, paintPortraits: () => paintDraft(sel), paintDraft: () => paintDraft(sel) };
}

