// Pure snapshot helpers for LAN netplay. No DOM, no game imports —
// main.js injects real Fighter construction. Fully headless-testable.

// Set by main.js. Needed so a guest can materialise Doom's summoned clone,
// which it cannot construct itself (no game imports here by design).
let makeFighter = null;
let groundY = 452;
export function injectFighterFactory(fn, gy) {
  makeFighter = fn;
  if (typeof gy === "number") groundY = gy;
}

export const SPRITE_LISTS = Object.freeze([
  "idle", "walk", "attack", "crouch", "sneak", "jump",
  "dash", "block", "grab", "special", "strain", "kdown",
]);

// Same order as buildSprites() iterates poses(). Identity-stable per kind.
export function flatSprites(sprites) {
  const out = [];
  for (const k of SPRITE_LISTS) {
    const arr = sprites[k] || [];
    for (const img of arr) out.push(img);
  }
  return out;
}

export function indexOfFrame(list, frame) {
  return list.indexOf(frame);
}

const FIGHTER_FIELDS = Object.freeze([
  "x", "y", "vy", "grounded", "facing", "state", "stateT",
  "attackId", "phase", "phaseT", "attackDir", "hp", "maxHp",
  "rage", "rageFlash", "moving", "crouchHeld", "blockLow",
  "blockRetreating", "specialId", "dashDir", "freezeT", "kT",
  "holdT", "invulnT", "vuln", "decayN", "bleedN", "sinceDamageT",
  "animTime", "knockVX", "webT", "zipCD", "swingCD", "snapCD", "away",
]);

export function snapFighter(f, frameIdx) {
  const s = { kind: f.kind, frameIdx };
  for (const k of FIGHTER_FIELDS) s[k] = f[k];
  if (f.special) {
    s.spPhase = f.special.phase ?? null;
    s.spI = f.special.i ?? 0;
  } else {
    s.spPhase = null;
    s.spI = 0;
  }
  // Doom's summoned clone has to reach the guest too, or it simply won't exist
  // on their side of the fight.
  if (f.doomBot) {
    s.bot = {
      x: f.doomBot.x, y: f.doomBot.y, vy: f.doomBot.vy,
      grounded: f.doomBot.grounded, facing: f.doomBot.facing,
      state: f.doomBot.state, stateT: f.doomBot.stateT,
      hp: f.doomBot.hp, maxHp: f.doomBot.maxHp,
      attackId: f.doomBot.attackId, phase: f.doomBot.phase,
      phaseT: f.doomBot.phaseT, attackDir: f.doomBot.attackDir,
      invulnT: f.doomBot.invulnT, freezeT: f.doomBot.freezeT,
      kT: f.doomBot.kT, knockVX: f.doomBot.knockVX,
      animTime: f.doomBot.animTime, blockLow: f.doomBot.blockLow,
      frameIdx: frameOf(f.doomBot),
    };
  } else {
    s.bot = null;
  }
  return s;
}

export function applyFighter(f, s) {
  for (const k of FIGHTER_FIELDS) {
    if (s[k] !== undefined) f[k] = s[k];
  }
  f.kind = s.kind;
  if (s.bot === null || s.bot === undefined) {
    f.doomBot = null;
  } else if (!f.doomBot) {
    if (!makeFighter) return f;
    f.doomBot = makeFighter("doom", s.bot.x, s.bot.y ?? groundY);
    for (const k of Object.keys(s.bot)) {
      if (k === "frameIdx") continue;
      f.doomBot[k] = s.bot[k];
    }
    f.doomBot.isDoomBot = true;
    f.doomBot.owner = f;
    f.doomBot.noSpecials = true;
  } else {
    for (const k of Object.keys(s.bot)) {
      if (k === "frameIdx") continue;
      f.doomBot[k] = s.bot[k];
    }
  }
  return f;
}

// Host: canvas identity -> flat index (guest looks the same index up locally).
export function frameOf(f) {
  const frame = f.currentFrame();
  return indexOfFrame(flatSprites(f.sprites), frame);
}

// Guest: canvas for a snapshot fighter from its own sprite table.
export function frameFor(sprites, idx) {
  const list = flatSprites(sprites);
  return idx != null && idx >= 0 && idx < list.length ? list[idx] : null;
}

const FX_PRIMS = new Set(["ensure", "tone", "slide"]);

// Record top-level SFX names into sink while armed. Returns disarmer.
export function armSfxCapture(AudioFX, sink) {
  const saved = {};
  for (const k of Object.keys(AudioFX)) {
    const v = AudioFX[k];
    if (typeof v !== "function" || FX_PRIMS.has(k)) continue;
    saved[k] = v;
    AudioFX[k] = (...a) => {
      sink.push(k);
      return v.apply(AudioFX, a);
    };
  }
  return () => {
    for (const k of Object.keys(saved)) AudioFX[k] = saved[k];
  };
}
