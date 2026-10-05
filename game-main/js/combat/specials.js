// M10 Wesker special implementations (M11 adds Homelander's here).
// Each special is a small scripted machine on f.special scratch:
// { phase, t, i, struck, struckThis, acc, frame, }. Frames are assigned as
// canvases every tick; fighter.currentFrame just shows f.special.frame.
// Camera trauma goes out through f.camKick (main.js drains it like contact).
import { WESKER_SPECIALS, HOMELANDER_SPECIALS, WOLVERINE_SPECIALS, HULK_SPECIALS } from "./data.js";
import { resolveStrike, Hitstop } from "./combat.js";
import { clampArena } from "../physics.js";
import { Sparks, Clones, Beams, Missiles } from "../effects.js";
import { AudioFX } from "../audio.js";
import { GROUND_Y } from "../config.js";
import { arena } from "../arena.js";

function endSpecial(f) {
  // Homelander's rage flight leaves y; snap exact ground on exit.
  if (f.special && f.special.airborne) {
    f.y = GROUND_Y;
    f.vy = 0;
    f.grounded = true;
  }
  f.state = "IDLE";
  f.specialId = null;
  f.special = null;
}

// Shared burst entry: EVERY super fires INSTANTLY from (almost) any state —
// mid-swing, mid-dash, mid-jump, guard, sneak, grounded stun. Only refused:
// KO'd, already mid-super, or physically held/holding (GRAB/THROWN — a
// body lock beats meter). Costs + range leash still apply: out-of-range
// presses fizzle WITHOUT spending. Air activations snap to the ground first
// (supers are grounded cinematics; SPECIAL skips gravity, so this avoids a
// hang-in-air bug). Normal-attack and stun leftovers are scrubbed, and entry
// i-frames make it a true burst. Returns the spec on success, null on refusal.
function beginSpecial(f, foe, table, id) {
  const spec = table[id];
  if (!spec || f.hp <= 0 || f.freezeT > 0) return null;
  if (f.state === "SPECIAL" || f.state === "KO" || f.state === "GRAB" || f.state === "THROWN") return null;
  if (f.rageLevel < spec.cost) return null;
  if (Math.abs(foe.x - f.x) > spec.maxRange) return null;
  if (!f.spendRage(spec.cost)) return null;
  // Land first: an air super becomes a grounded one on the spot.
  f.y = GROUND_Y;
  f.vy = 0;
  f.grounded = true;
  // Scrub whatever we interrupt: swings, chains, stun slides.
  f.attackId = null;
  f.phase = null;
  f.chainQueued = false;
  f.rayFired = false;
  f.hasHit = false;
  f.knockVX = 0;
  f.stateT = 0;
  f.attackDir = f.facing;
  f.state = "SPECIAL";
  f.specialId = id;
  f.special = { phase: null, t: 0, i: 0, struck: false, struckThis: false, acc: 0, frame: null };
  f.invulnT = Math.max(f.invulnT, 0.35); // burst i-frames on entry
  return spec;
}

// Entry gates: Wesker-only (M10), rage paid up front, and a maxRange leash.
// State is NOT gated — neutral, guard, dash, sneak, jump, stun, mid-swing
// all fire (see beginSpecial); out-of-range presses fizzle WITHOUT spending.
export function tryWeskerSpecial(f, id, foe) {
  if (f.kind !== "wesker") return false;
  const spec = beginSpecial(f, foe, WESKER_SPECIALS, id);
  if (!spec) return false;
  f.attackDir = f.facing;
  f.state = "SPECIAL";
  f.specialId = id;
  const first = id === "jaguar" ? "startup" : id === "phantom" ? "open" : "transform";
  const t0 = id === "jaguar" ? spec.startup : id === "phantom" ? spec.openTime : spec.transform;
  f.special = { phase: first, t: t0, i: 0, struck: false, struckThis: false, acc: 0, frame: null };
  if (id === "ragemode") {
    // Level-3 time-stop: the victim stands pinned for the whole apotheosis
    // (transform + every frenzy pass + the missile ride + recovery margin).
    foe.freezeT = spec.transform + spec.frames.length * spec.strikeTime +
      (spec.frames.length - 1) * spec.gapTime +
      spec.rise + spec.aim + spec.drop + spec.recover + 0.15;
    Hitstop.t = Math.max(Hitstop.t, 0.2);
    Sparks.ring(foe.x, foe.y - 80, 110);
    AudioFX.powerup(); // transformation sting on entry
  }
  return true;
}

export function updateSpecial(f, foe, dt) {
  if (f.kind === "wesker" && f.specialId) {
    if (f.specialId === "jaguar") updateJaguar(f, foe, dt);
    else if (f.specialId === "phantom") updatePhantom(f, foe, dt);
    else if (f.specialId === "shadow") updateShadow(f, foe, dt);
    else updateRageMode(f, foe, dt);
    return;
  }
  if (f.kind === "wolverine" && f.specialId) {
    if (f.specialId === "rush") updateRush(f, foe, dt);
    else if (f.specialId === "barrage") updateBarrage(f, foe, dt);
    else updateXRage(f, foe, dt);
    return;
  }
  if (f.kind === "homelander" && f.specialId) {
    if (f.specialId === "laser") updateLaser(f, foe, dt);
    else if (f.specialId === "scream") updateScream(f, foe, dt);
    else updateHRage(f, foe, dt);
    return;
  }
  if (f.kind === "hulk" && f.specialId) {
    if (f.specialId === "gamma") updateGamma(f, foe, dt);
    else if (f.specialId === "clap") updateClap(f, foe, dt);
    else updateBreaker(f, foe, dt);
    return;
  }
  endSpecial(f); // unknown kit: never strand in SPECIAL
}

// --- Shadow Step (Wesker, meterless, spammable): S + double-tap A/D -----
// Manual teleport: fixed distance in the TAPPED screen direction — never
// auto-tracks the foe, so a wrong-way tap crosses you up or corners you.
// Vanish (hittable) -> instant shift (brief invuln) -> reform (punishable).
// No rage cost, no cooldown beyond the ~0.32s animation: spam is allowed,
// hard reads are rewarded. Grounded neutral/guard/dash only — no bursting
// out of stun, no air escapes, never cancels a swing or a super.
export function tryWeskerShadow(f, screenDir) {
  if (f.kind !== "wesker") return false;
  const spec = WESKER_SPECIALS.shadow;
  if (!spec || f.hp <= 0 || f.freezeT > 0 || !f.grounded) return false;
  if (f.state === "SPECIAL" || f.state === "KO" || f.state === "GRAB" ||
    f.state === "THROWN" || f.state === "ATTACK" || f.state === "HITSTUN" ||
    f.state === "BLOCKSTUN" || f.state === "KDOWN" || f.state === "JUMP" ||
    f.state === "FALL") return false;
  f.attackId = null;
  f.phase = null;
  f.chainQueued = false;
  f.knockVX = 0;
  f.stateT = 0;
  f.state = "SPECIAL";
  f.specialId = "shadow";
  f.special = {
    phase: "vanish", t: spec.vanish, dir: screenDir >= 0 ? 1 : -1,
    acc: 0, frame: null,
  };
  return true;
}

function updateShadow(f, foe, dt) {
  const spec = WESKER_SPECIALS.shadow;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "vanish") {
    s.frame = A.attack[4]; // coil into the floor (hittable — stuff it here)
    s.acc += dt;
    if (s.acc >= 0.03) {
      s.acc = 0;
      Sparks.shadowburst(f.x, f.y);
    }
    if (s.t <= 0) {
      // Vanish: black silhouette stays, body shifts the full distance.
      Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.45, "shadow");
      Sparks.shadowburst(f.x, f.y);
      AudioFX.whoosh();
      f.x += s.dir * spec.dist;
      clampArena(f);
      // Facing does NOT auto-correct — hold toward the foe or eat a cross-up.
      s.phase = "shift";
      s.t = spec.shift;
      f.invulnT = Math.max(f.invulnT, spec.shift + 0.03);
    }
  } else if (s.phase === "shift") {
    s.frame = A.dash[0];
    if (s.t <= 0) {
      // Reform: black-purple dust where he arrives, punishable from here.
      Sparks.shadowburst(f.x, f.y);
      Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.3, "shadow");
      s.phase = "reform";
      s.t = spec.reform;
    }
  } else {
    s.frame = A.crouch[0]; // low reform crouch — rising out of the dust
    s.acc += dt;
    if (s.acc >= 0.05) {
      s.acc = 0;
      Sparks.shadowburst(f.x, f.y);
    }
    if (s.t <= 0) endSpecial(f);
  }
}

// --- Jaguar Charge: coil, then an invulnerable driving tackle ---------------
function jaguarMove(spec) {
  return {
    damage: spec.damage, hitstun: spec.hitstun, knockback: spec.knockback,
    hitstop: spec.hitstop, level: "mid", blockstun: spec.blockstun,
    blockPush: spec.blockPush, chip: spec.chip, hit: spec.hit,
  };
}

function updateJaguar(f, foe, dt) {
  const spec = WESKER_SPECIALS.jaguar;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "startup") {
    s.frame = A.attack[4]; // coiled windup (hittable — stuff it here)
    if (s.t <= 0) {
      s.phase = "dash";
      s.t = spec.dashTime;
      s.struckThis = false;
      // Exact-px travel budget (M7 lunge precedent): frame quantization must
      // never extend a super's reach past its nominal 262.5px.
      s.distLeft = spec.dashSpeed * spec.dashTime;
      s.acc = 0; // violet trail timer (see dash branch)
      f.invulnT = spec.dashTime + 0.05; // untouchable once driving
      AudioFX.whoosh();
      Sparks.puff(f.x, f.y - 60);
      Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.3);
    }
  } else if (s.phase === "dash") {
    // Two-frame drive: alternate lean so the tackle visibly pumps.
    s.frame = (Math.floor(s.t * 25) % 2 === 0) ? A.special[0] : A.dash[0];
    const want = Math.min(spec.dashSpeed * dt, s.distLeft);
    f.x += f.attackDir * want;
    s.distLeft -= want;
    clampArena(f);
    // Purple phantom-flame trail while driving.
    s.acc += dt;
    while (s.acc >= 0.04) {
      s.acc -= 0.04;
      Sparks.violet(f.x - f.attackDir * 30, f.y - 40 - Math.random() * 60);
    }
    if (!s.struckThis) {
      const contact = resolveStrike(f, foe, jaguarMove(spec));
      if (contact) {
        s.struckThis = true;
        f.camKick = Math.max(f.camKick, 0.35);
        // Driving tackle: clean hits drop the victim prone (0.4s down);
        // blocked hits shove, then break the guard into the same fall.
        if (foe.hp > 0) {
          if (contact.type === "hit") foe.knockdown(f.attackDir, spec.knockback);
          else foe.crumple = true;
        }
      }
    }
    if (s.t <= 0) {
      s.phase = "recover";
      s.t = spec.recover;
      f.invulnT = Math.min(f.invulnT, 0.05);
      Sparks.puff(f.x, f.y - 40);
      Sparks.dust(f.x, GROUND_Y); // skid-out stop
      f.camKick = Math.max(f.camKick, 0.15);
    }
  } else {
    s.frame = A.dash[0]; // skate-out follow-through
    if (s.t <= 0) endSpecial(f);
  }
}

// --- Phantom Combo: five teleport strikes, alternating sides ----------------
function phantomMove(spec, i) {
  const h = spec.hits[i];
  return {
    damage: h.damage, hitstun: h.stun, knockback: h.knock, hitstop: h.stop,
    // Short guard lock (0.15) vs the 0.24 strike rhythm: a held guard
    // recovers between teleport hits, so blocking the super costs chip,
    // not the full combo. Dropping guard mid-string still gets opened.
    level: "mid", blockstun: 0.15, blockPush: 200, chip: h.chip, hit: spec.hit,
  };
}

function phantomBlink(f, foe, i) {
  const spec = WESKER_SPECIALS.phantom;
  // Afterimage stays where we stood; violet fire marks where we arrive.
  Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.35);
  Sparks.puff(f.x, f.y - 80); // vanish...
  AudioFX.whoosh(); // M14: each blink has a rush
  f.x = foe.x + spec.sides[i] * 58;
  clampArena(f);
  f.attackDir = foe.x >= f.x ? 1 : -1;
  f.facing = f.attackDir;
  Sparks.puff(f.x, f.y - 80); // ...reappear striking
  for (let k = 0; k < 3; k++) Sparks.violet(f.x + (Math.random() - 0.5) * 40, f.y - 40 - Math.random() * 60);
  f.special.frame = f.sprites.attack[spec.frames[i]];
  f.special.struckThis = false;
}

function updatePhantom(f, foe, dt) {
  const spec = WESKER_SPECIALS.phantom;
  const s = f.special;
  s.t -= dt;
  if (s.phase === "open") {
    s.frame = f.sprites.attack[4];
    f.invulnT = 1.9; // whole sequence is untouchable (paid 2 bars)
    if (s.t <= 0) {
      s.i = 0;
      phantomBlink(f, foe, 0);
      s.phase = "strike";
      s.t = spec.strikeTime;
    }
  } else if (s.phase === "strike") {
    if (!s.struckThis) {
      const contact = resolveStrike(f, foe, phantomMove(spec, s.i));
      if (contact) {
        s.struckThis = true;
        s.struck = true;
        for (let k = 0; k < 3; k++) Sparks.violet(foe.x + (Math.random() - 0.5) * 50, foe.y - 60 - Math.random() * 60);
        f.camKick = Math.max(f.camKick, 0.15);
        const last = s.i === spec.hits.length - 1;
        if (last) {
          // Finale slams down (clean hits only — guards just shove).
          if (contact.type === "hit" && foe.hp > 0) {
            foe.knockdown(f.attackDir, spec.hits[s.i].knock, spec.hits[s.i].launch);
          }
          f.camKick = Math.max(f.camKick, 0.6);
        }
      }
    }
    if (s.t <= 0) {
      if (s.i === 0 && !s.struck) {
        s.phase = "recover"; // opening whiffed: abort the super, eat recovery
        s.t = spec.recover;
      } else if (s.i >= spec.hits.length - 1) {
        s.phase = "recover";
        s.t = spec.recover;
      } else {
        s.phase = "gap";
        s.t = spec.gapTime;
      }
    }
  } else if (s.phase === "gap") {
    if (s.t <= 0) {
      s.i += 1;
      phantomBlink(f, foe, s.i);
      s.phase = "strike";
      s.t = spec.strikeTime;
    }
  } else {
    s.frame = f.sprites.attack[spec.frames[Math.min(s.i, spec.frames.length - 1)]];
    if (s.t <= 0) endSpecial(f);
  }
}

// --- Rage Mode REWORK: unmask (1s) -> six black-afterimage frenzy passes
// (5 each, guardable) -> skyward leap -> 30-ton missile dive (35). ~4s,
// ~65 total, invulnerable throughout. Blocking the frenzy (6 chip) buys
// the space to dash clear of the locked missile target — eat it standing
// and the crater is yours.
function rageFrenzyMove(spec) {
  const h = spec.frenzy;
  return {
    damage: h.damage, hitstun: h.stun, knockback: h.knock, hitstop: h.stop,
    // Short guard lock vs the 0.22 strike rhythm (phantom lesson): held
    // guard recovers between passes instead of stun-trapping into full.
    level: "mid", blockstun: 0.15, blockPush: 200, chip: h.chip, hit: spec.hit,
  };
}

function rageMissileMove(spec) {
  return {
    damage: spec.missile, hitstun: spec.missileStun, knockback: spec.missileKnock,
    hitstop: spec.missileStop, level: "mid", blockstun: 0.50, blockPush: 600,
    chip: spec.missileChip, hit: { w: 120, top: 140, h: 100 },
  };
}

function rageBlink(f, foe, i) {
  const spec = WESKER_SPECIALS.ragemode;
  // Black silhouette stays where he stood; red fire marks where he arrives.
  Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.45, "shadow");
  Sparks.puff(f.x, f.y - 80);
  f.x = foe.x + spec.sides[i] * 62;
  clampArena(f);
  f.attackDir = foe.x >= f.x ? 1 : -1;
  f.facing = f.attackDir;
  Sparks.puff(f.x, f.y - 80);
  Sparks.ember(f.x, f.y - 60);
  Sparks.ember(f.x, f.y - 100);
  f.special.frame = f.sprites.attack[spec.frames[i]];
  f.special.struckThis = false;
}

function updateRageMode(f, foe, dt) {
  const spec = WESKER_SPECIALS.ragemode;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "transform") {
    // Three-beat apotheosis: coil (glasses on) -> rip-off -> burning stand.
    const k = 1 - Math.max(0, s.t) / spec.transform;
    if (k < 0.35) {
      s.frame = A.attack[4]; // coiled, glasses still on
    } else if (k < 0.7) {
      if (!s.beat2) {
        s.beat2 = true;
        AudioFX.whoosh(); // glasses torn away
        Sparks.puff(f.x, f.y - 100);
        f.camKick = Math.max(f.camKick, 0.35);
      }
      s.frame = A.special[4]; // hand ripping glasses off
    } else {
      if (!s.beat3) {
        s.beat3 = true;
        AudioFX.powerup();
        Sparks.ring(f.x, f.y - 80, 120);
        f.camKick = Math.max(f.camKick, 0.4);
      }
      s.frame = A.special[1]; // unmasked, burning eyes
    }
    f.invulnT = 5.4; // whole apotheosis (~4.2s) is untouchable (paid 3 bars)
    Sparks.ember(f.x + (Math.random() - 0.5) * 60, f.y - Math.random() * 120);
    Sparks.ember(f.x + (Math.random() - 0.5) * 60, f.y - Math.random() * 120);
    s.acc += dt;
    if (s.acc >= 0.22) {
      s.acc = 0;
      Sparks.puff(f.x, f.y - 80);
      f.camKick = Math.max(f.camKick, 0.3);
    }
    if (s.t <= 0) {
      s.i = 0;
      rageBlink(f, foe, 0);
      s.phase = "strike";
      s.t = spec.strikeTime;
    }
  } else if (s.phase === "strike") {
    if (!s.struckThis) {
      const contact = resolveStrike(f, foe, rageFrenzyMove(spec));
      if (contact) {
        s.struckThis = true;
        s.struck = true;
        for (let k = 0; k < 2; k++) Sparks.violet(foe.x + (Math.random() - 0.5) * 50, foe.y - 60 - Math.random() * 60);
        f.camKick = Math.max(f.camKick, 0.12);
      }
    }
    if (s.t <= 0) {
      if (s.i === 0 && !s.struck) {
        s.phase = "recover"; // opening whiffed: abort, eat recovery
        s.t = spec.recoverAbort;
        foe.freezeT = Math.min(foe.freezeT, 0.35); // time resumes on a whiff
      } else if (s.i >= spec.frames.length - 1) {
        s.phase = "rise"; // frenzy done: LEAP for the missile run
        s.t = spec.rise;
        AudioFX.powerup();
        Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.5, "shadow");
      } else {
        s.phase = "gap";
        s.t = spec.gapTime;
      }
    }
  } else if (s.phase === "gap") {
    if (s.t <= 0) {
      s.i += 1;
      rageBlink(f, foe, s.i);
      s.phase = "strike";
      s.t = spec.strikeTime;
    }
  } else if (s.phase === "rise") {
    // Explosive LEAP: ease-out vertical launch (fast off the ground,
    // decelerating into the apex) — a jump, not a float. Takeoff burst
    // fires once on entry; lateral positioning happens at the top.
    if (!s.leapt) {
      s.leapt = true;
      AudioFX.whoosh();
      Sparks.dust(f.x, GROUND_Y);
      Sparks.puff(f.x, f.y - 40);
      Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.5, "shadow");
      f.camKick = Math.max(f.camKick, 0.3);
    }
    const k = 1 - Math.max(0, s.t) / spec.rise;
    const ease = 1 - Math.pow(1 - k, 3); // cubic ease-out: blast, then hang
    f.y = GROUND_Y - 280 * ease;
    s.frame = A.special[5]; // dedicated leap pose, fists down
    Sparks.violet(f.x - f.attackDir * 20, f.y - 30);
    f.invulnT = Math.max(f.invulnT, 0.3);
    if (s.t <= 0) {
      s.phase = "aim";
      s.t = spec.aim;
      s.tx = foe.x; // missile target LOCKED (leave and it misses!)
      // Leap sideways to the sky above the mark, then SNATCH the incoming
      // dart: the hand-missile streaks to Wesker's raised hands over `aim`.
      f.x = s.tx;
      clampArena(f);
      f.attackDir = foe.x >= f.x ? 1 : -1;
      f.facing = f.attackDir;
      Sparks.puff(f.x, f.y - 140);
      Missiles.launch(f.x, f.y - 140, spec.aim);
      AudioFX.whoosh();
      s.frame = A.special[6]; // arms spread, reaching for the dart
      Sparks.ring(s.tx, GROUND_Y - 40, 90); // target-lock marker
    }
  } else if (s.phase === "aim") {
    // Apex hold above the mark while the dart slams into his grip.
    f.x = s.tx;
    f.y = GROUND_Y - 280 + Math.sin(s.t * 18) * 6;
    s.frame = A.special[6];
    Sparks.ember(f.x + (Math.random() - 0.5) * 70, f.y - 40 - Math.random() * 60);
    f.invulnT = Math.max(f.invulnT, 0.3);
    if (s.t <= 0) {
      s.phase = "drop";
      s.t = spec.drop;
      // CAUGHT: sting + flash as the dart meets his fists, crater missile
      // synced to the ride down so bloom lands on impact.
      AudioFX.grab();
      Sparks.hit(f.x, f.y - 150, 1);
      f.camKick = Math.max(f.camKick, 0.3);
      Missiles.launch(s.tx, GROUND_Y, spec.drop);
    }
  } else if (s.phase === "drop") {
    // The ride down: Wesker DRIVES the gripped missile home, accelerating
    // (ease-in) instead of floating. Dart drawn locked in his fists.
    const k = 1 - Math.max(0, s.t) / spec.drop;
    const ease = k * k; // quadratic ease-in: hang, then slam
    f.x = s.tx;
    f.y = GROUND_Y - 280 + 280 * ease;
    s.frame = A.special[10]; // both fists gripping the dart overhead
    Missiles.hold(f.x, f.y - 150);
    f.invulnT = Math.max(f.invulnT, 0.3);
    Sparks.ember(f.x, f.y - 60);
    Sparks.violet(f.x - f.attackDir * 16, f.y - 80);
    if (s.t <= 0) {
      Missiles.clear(); // grip ends where the crater begins
      // IMPACT on the locked target — boxed, so guards and dodges count.
      f.y = GROUND_Y;
      const box = { x: s.tx - 60, y: GROUND_Y - 140, w: 120, h: 140 };
      const contact = resolveStrike(f, foe, rageMissileMove(spec), box);
      // Clean: cratered prone. Guarded: huge shove, then the guard breaks.
      if (contact && foe.hp > 0) {
        if (contact.type === "hit") foe.knockdown(f.attackDir, spec.missileKnock);
        else foe.crumple = true;
      }
      AudioFX.hit();
      AudioFX.boom(); // M14.5: the crater gets its own body
      f.camKick = Math.max(f.camKick, 1.0);
      Sparks.puff(s.tx, GROUND_Y - 40);
      Sparks.dust(s.tx, GROUND_Y);
      // M14.5 bigger crater FX: wide primary shockwave + second higher wave,
      // twin hit stars, gore only on a clean hit, denser ember column.
      Sparks.ring(s.tx, GROUND_Y - 60, 260);
      Sparks.ring(s.tx, GROUND_Y - 110, 170);
      Sparks.hit(s.tx, GROUND_Y - 90, 1);
      Sparks.hit(s.tx, GROUND_Y - 90, -1);
      if (contact && contact.type === "hit") Sparks.blood(s.tx, GROUND_Y - 80);
      for (let e = 0; e < 14; e++) Sparks.ember(s.tx + (Math.random() - 0.5) * 120, GROUND_Y - Math.random() * 80);
      s.phase = "recover";
      s.t = spec.recover;
    }
  } else {
    s.frame = A.idle[0];
    f.y = GROUND_Y;
    if (s.t <= 0) endSpecial(f);
  }
}

// --- Hulk: Gamma Charge / Thunder Clap / Worldbreaker ----------------------
// Slot mapping lives in fighter.trySpecial (Space/F/O == s1/s2/s3 for every
// kit); here the ids are Hulk's own: gamma / clap / breaker.
export function tryHulkSpecial(f, id, foe) {
  if (f.kind !== "hulk") return false;
  if (id === "breaker" && (!foe.grounded || foe.hp <= 0)) return false;
  const spec = beginSpecial(f, foe, HULK_SPECIALS, id);
  if (!spec) return false;
  f.attackDir = f.facing;
  f.state = "SPECIAL";
  f.specialId = id;
  const first = id === "gamma" ? "startup" : id === "clap" ? "startup" : "ascend";
  const t0 = id === "gamma" ? spec.startup : id === "clap" ? spec.startup : spec.ascend;
  f.special = { phase: first, t: t0, i: 0, struck: false, struckThis: false, acc: 0, tickAcc: 0, tickN: 0, frame: null };
  if (id === "breaker") {
    // Cinematic seize: an unblockable 3-bar grab, hoisted overhead.
    foe.freezeT = spec.ascend + spec.shake + 0.12 + spec.recover + 0.15;
    Hitstop.t = Math.max(Hitstop.t, 0.2);
    Sparks.ring(foe.x, foe.y - 80, 130);
    foe.takeGrabbed(f);
    foe.holdT = 2.5;
    foe.x = f.x + f.attackDir * 55;
    f.invulnT = 2.5;
    AudioFX.powerup();
  }
  return true;
}

function gammaMove(spec) {
  return {
    damage: spec.damage, hitstun: spec.hitstun, knockback: spec.knockback,
    hitstop: spec.hitstop, level: "mid", blockstun: spec.blockstun,
    blockPush: spec.blockPush, chip: spec.chip, hit: spec.hit,
  };
}

function updateGamma(f, foe, dt) {
  const spec = HULK_SPECIALS.gamma;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "startup") {
    s.frame = A.attack[4]; // pawing the ground (hittable — stuff it here)
    if (Math.random() < 0.4) Sparks.dust(f.x, GROUND_Y);
    if (s.t <= 0) {
      s.phase = "dash";
      s.t = spec.dashTime;
      s.struckThis = false;
      s.distLeft = spec.dashSpeed * spec.dashTime;
      s.acc = 0;
      f.invulnT = spec.dashTime + 0.05; // untouchable once driving
      AudioFX.whoosh();
      Sparks.dust(f.x, GROUND_Y);
      Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.3);
    }
  } else if (s.phase === "dash") {
    s.frame = (Math.floor(s.t * 22) % 2 === 0) ? A.special[0] : A.dash[0];
    const want = Math.min(spec.dashSpeed * dt, s.distLeft);
    f.x += f.attackDir * want;
    s.distLeft -= want;
    clampArena(f);
    s.acc += dt;
    while (s.acc >= 0.05) {
      s.acc -= 0.05;
      Sparks.dust(f.x - f.attackDir * 30, GROUND_Y);
    }
    if (!s.struckThis) {
      const contact = resolveStrike(f, foe, gammaMove(spec));
      if (contact) {
        s.struckThis = true;
        f.camKick = Math.max(f.camKick, 0.45);
        if (foe.hp > 0) {
          if (contact.type === "hit") foe.knockdown(f.attackDir, spec.knockback);
          else foe.crumple = true;
        }
      }
    }
    if (s.t <= 0) {
      s.phase = "recover";
      s.t = spec.recover;
      f.invulnT = Math.min(f.invulnT, 0.05);
      Sparks.dust(f.x, GROUND_Y);
      f.camKick = Math.max(f.camKick, 0.2);
    }
  } else {
    s.frame = A.dash[0];
    if (s.t <= 0) endSpecial(f);
  }
}

function clapMove(spec) {
  return {
    damage: spec.damage, hitstun: spec.hitstun, knockback: spec.knockback,
    hitstop: spec.hitstop, level: spec.level, blockstun: spec.blockstun,
    blockPush: spec.blockPush, chip: spec.chip, hit: { w: 0, top: 0, h: 0 },
  };
}

function updateClap(f, foe, dt) {
  const spec = HULK_SPECIALS.clap;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "startup") {
    s.frame = A.special[8]; // chest swelled, arms wide (interrupt me here)
    if (s.t <= 0) {
      s.phase = "active";
      s.t = spec.active;
      s.struckThis = false;
      s.rang = false;
      AudioFX.roar();
      AudioFX.boom();
      Sparks.ring(f.x, f.y - 80, spec.radius);
      Sparks.dust(f.x, GROUND_Y);
      f.camKick = Math.max(f.camKick, 0.6);
    }
  } else if (s.phase === "active") {
    s.frame = A.special[3]; // palms together, shockwave out
    if (!s.rang && s.t < spec.active / 2) {
      s.rang = true;
      Sparks.ring(f.x, f.y - 80, Math.round(spec.radius * 0.7));
    }
    if (!s.struckThis) {
      const dir = foe.x >= f.x ? 1 : -1;
      f.attackDir = foe.x === f.x ? f.attackDir : dir;
      const zone = { x: f.x - spec.radius, y: f.y - spec.top, w: spec.radius * 2, h: spec.top };
      const contact = resolveStrike(f, foe, clapMove(spec), zone);
      if (contact) {
        s.struckThis = true;
        Sparks.ring(f.x, f.y - 80, spec.radius * 0.6);
        if (foe.hp > 0) {
          if (contact.type === "hit") foe.knockdown(f.attackDir, spec.knockback);
          else foe.crumple = true;
        }
      }
    }
    if (s.t <= 0) {
      s.phase = "recover";
      s.t = spec.recover;
    }
  } else {
    s.frame = A.idle[0];
    if (s.t <= 0) endSpecial(f);
  }
}

function updateBreaker(f, foe, dt) {
  const spec = HULK_SPECIALS.breaker;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "ascend") {
    // Hoist the victim overhead (grounded — no flight, just leverage).
    const k = 1 - Math.max(0, s.t) / spec.ascend;
    foe.x = f.x + f.attackDir * 55;
    foe.y = GROUND_Y - 150 * k;
    s.frame = A.special[9]; // arms straight up, victim overhead
    f.invulnT = Math.max(f.invulnT, 0.3);
    foe.holdT = Math.max(foe.holdT, 0.5);
    Sparks.dust(f.x, GROUND_Y);
    if (s.t <= 0) {
      s.phase = "shake";
      s.t = spec.shake;
      s.tickN = 0;
      AudioFX.roar();
    }
  } else if (s.phase === "shake") {
    // Rag-doll shakes: three 5-damage ticks straight into the held victim.
    foe.x = f.x + f.attackDir * 55;
    foe.y = GROUND_Y - 150 + Math.sin(s.t * 30) * 8;
    s.frame = f.sprites.attack[27]; // quake effort, victim overhead
    f.invulnT = Math.max(f.invulnT, 0.3);
    foe.holdT = Math.max(foe.holdT, 0.5);
    const elapsed = spec.shake - Math.max(0, s.t);
    if (s.tickN < spec.ticks && elapsed + 1e-9 >= (s.tickN + 1) * (spec.shake / spec.ticks)) {
      AudioFX.hit();
      f.camKick = Math.max(f.camKick, 0.2);
      if (foe.hp > 0) {
        foe.hp = Math.max(0, foe.hp - spec.tick);
        Sparks.blood(foe.x, foe.y - 100);
        Sparks.hit(foe.x, foe.y - 100, f.attackDir);
        if (foe.hp <= 0) foe.state = "KO";
        else Hitstop.t = Math.max(Hitstop.t, 0.03);
      }
      s.tickN += 1;
    }
    if (s.t <= 0) {
      s.phase = "slam";
      s.t = 0.12;
      s.struckThis = false;
    }
  } else if (s.phase === "slam") {
    s.frame = f.sprites.attack[27]; // both fists drive the victim down
    if (!s.struckThis) {
      s.struckThis = true;
      const dir = foe.x >= f.x ? 1 : -1;
      foe.takeHit({ damage: spec.finale, hitstun: 0.7, knockback: 300 }, dir);
      if (foe.hp > 0) foe.knockdown(dir, 300, 0, spec.launchDown);
      AudioFX.hit();
      AudioFX.boom();
      f.camKick = Math.max(f.camKick, 0.9);
      Sparks.ring(foe.x, GROUND_Y - 60, 200);
      Sparks.ring(foe.x, GROUND_Y - 110, 140);
      Sparks.dust(foe.x, GROUND_Y);
      Sparks.puff(foe.x, GROUND_Y - 40);
    }
    if (s.t <= 0) {
      s.phase = "recover";
      s.t = spec.recover;
    }
  } else {
    // Settle: release the hold if it somehow survived, stand down.
    if (foe.heldBy === f) { foe.heldBy = null; if (foe.hp > 0) foe.state = "IDLE"; }
    s.frame = A.idle[0];
    if (s.t <= 0) endSpecial(f);
  }
}
// --- Homelander: Quick Laser / Sonic Scream / Rage Mode ---------------------
// Slot mapping lives in fighter.trySpecial (Space/F/O == s1/s2/s3 for both
// kits); here the ids are Homelander's own: laser / scream / ragemode.
export function tryHomelanderSpecial(f, id, foe) {
  if (f.kind !== "homelander") return false;
  if (id === "ragemode" && (!foe.grounded || foe.hp <= 0)) return false;
  const spec = beginSpecial(f, foe, HOMELANDER_SPECIALS, id);
  if (!spec) return false;
  f.attackDir = f.facing;
  f.state = "SPECIAL";
  f.specialId = id;
  const first = id === "laser" ? "startup" : id === "scream" ? "startup" : "ascend";
  const t0 = id === "laser" ? spec.startup : id === "scream" ? spec.startup : spec.ascend;
  f.special = { phase: first, t: t0, i: 0, struck: false, struckThis: false, acc: 0, tickAcc: 0, tickN: 0, frame: null };
  if (id === "ragemode") {
    // Cinematic seize: an unblockable 3-bar grab — the victim is flown.
    // Time-stop belt-and-braces: pinned for ascend+carry+lase+slam+recover.
    foe.freezeT = spec.ascend + spec.carry + spec.lase + 0.12 + spec.recover + 0.15;
    Hitstop.t = Math.max(Hitstop.t, 0.2);
    Sparks.ring(foe.x, foe.y - 80, 110);
    f.special.airborne = true;
    foe.takeGrabbed(f);
    foe.holdT = 3.0;
    foe.x = f.x + f.attackDir * 50;
    f.invulnT = 3.0;
    AudioFX.powerup();
  }
  return true;
}

function laserMove(spec) {
  return {
    damage: spec.damage, hitstun: spec.hitstun, knockback: spec.knockback,
    hitstop: spec.hitstop, level: spec.level, blockstun: spec.blockstun,
    blockPush: spec.blockPush, chip: spec.chip, hit: { w: 0, top: 0, h: 0 },
  };
}

function updateLaser(f, foe, dt) {
  const spec = HOMELANDER_SPECIALS.laser;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "startup") {
    s.frame = A.special[7]; // head ducked, eyes kindling (vulnerable — stuff it)
    if (Math.random() < 0.5) Sparks.ember(f.x + f.attackDir * 10, f.y - 130);
    if (s.t <= 0) {
      s.phase = "fire";
      s.t = spec.fire;
      s.struckThis = false;
      const eyeY = f.y - 130;
      const x1 = f.x + f.attackDir * 12;
      const x2 = Math.max(0, Math.min(arena.width, f.x + f.attackDir * spec.beamLen));
      Beams.spawn(x1, eyeY, x2, eyeY, spec.fire + 0.02);
      AudioFX.zap();
      f.camKick = Math.max(f.camKick, 0.2);
    }
  } else if (s.phase === "fire") {
    s.frame = A.special[2]; // head thrust forward, full burn
    // Beam shimmer: mid-fire flicker re-spawn so the ray crackles.
    if (!s.flick && s.t < spec.fire / 2) {
      s.flick = true;
      const eyeY = f.y - 130;
      const x1 = f.x + f.attackDir * 12;
      const x2 = Math.max(0, Math.min(arena.width, f.x + f.attackDir * spec.beamLen));
      Beams.spawn(x1, eyeY, x2, eyeY, spec.fire / 2);
    }
    if (!s.struckThis) {
      // Hitscan ray at head height: thin + high, so crouchers duck under it.
      const eyeY = f.y - 130;
      const x1 = f.x + f.attackDir * 12;
      const x2 = Math.max(0, Math.min(arena.width, f.x + f.attackDir * spec.beamLen));
      const ray = { x: Math.min(x1, x2), y: eyeY - spec.beamH / 2, w: Math.abs(x2 - x1), h: spec.beamH };
      const contact = resolveStrike(f, foe, laserMove(spec), ray);
      if (contact) {
        s.struckThis = true;
        if (contact.type === "hit") Sparks.blood(foe.x, eyeY);
        // Clean burn drops the victim prone; a guarded burn shoves, then
        // breaks the guard into the same fall.
        if (foe.hp > 0) {
          if (contact.type === "hit") foe.knockdown(f.attackDir, spec.knockback);
          else foe.crumple = true;
        }
      }
    }
    if (s.t <= 0) {
      s.phase = "recover";
      s.t = spec.recover;
    }
  } else {
    s.frame = A.idle[0];
    if (s.t <= 0) endSpecial(f);
  }
}

function screamMove(spec) {
  return {
    damage: spec.damage, hitstun: spec.hitstun, knockback: spec.knockback,
    hitstop: spec.hitstop, level: spec.level, blockstun: spec.blockstun,
    blockPush: spec.blockPush, chip: spec.chip, hit: { w: 0, top: 0, h: 0 },
  };
}

function updateScream(f, foe, dt) {
  const spec = HOMELANDER_SPECIALS.scream;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "startup") {
    s.frame = A.special[8]; // chest swelling, breath drawn (interrupt me here)
    if (s.t <= 0) {
      s.phase = "active";
      s.t = spec.active;
      s.struckThis = false;
      s.rang = false;
      AudioFX.roar();
      Sparks.ring(f.x, f.y - 80, spec.radius);
      Sparks.dust(f.x, GROUND_Y);
      f.camKick = Math.max(f.camKick, 0.5);
    }
  } else if (s.phase === "active") {
    s.frame = A.special[3]; // jaw wide, shockwave out
    // Second ring pulse mid-blast so the scream visibly expands in waves.
    if (!s.rang && s.t < spec.active / 2) {
      s.rang = true;
      Sparks.ring(f.x, f.y - 80, Math.round(spec.radius * 0.7));
    }
    if (!s.struckThis) {
      // Omnidirectional burst: shove direction is AWAY from Homelander,
      // so attackDir tracks this hit (facing stays put — the scream has
      // no "front").
      const dir = foe.x >= f.x ? 1 : -1;
      f.attackDir = foe.x === f.x ? f.attackDir : dir;
      const zone = { x: f.x - spec.radius, y: f.y - spec.top, w: spec.radius * 2, h: spec.top };
      const contact = resolveStrike(f, foe, screamMove(spec), zone);
      if (contact) {
        s.struckThis = true;
        Sparks.ring(f.x, f.y - 80, spec.radius * 0.6);
        // Hurled off their feet: clean hits drop prone; guarded shoves break
        // the guard into the same fall once the push ends.
        if (foe.hp > 0) {
          if (contact.type === "hit") foe.knockdown(f.attackDir, spec.knockback);
          else foe.crumple = true;
        }
      }
    }
    if (s.t <= 0) {
      s.phase = "recover";
      s.t = spec.recover;
    }
  } else {
    s.frame = A.idle[0];
    if (s.t <= 0) endSpecial(f);
  }
}

function updateHRage(f, foe, dt) {
  const spec = HOMELANDER_SPECIALS.ragemode;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "ascend") {
    // Rise with the victim dangling in front (shadow stays grounded).
    const k = 1 - Math.max(0, s.t) / spec.ascend;
    f.y = GROUND_Y - 110 * k;
    foe.x = f.x + f.attackDir * 50;
    foe.y = f.y - 10;
    s.frame = A.special[9]; // cape flared, eyes ignited on the way up
    Sparks.ember(f.x - f.attackDir * 20, f.y - 100);
    f.invulnT = Math.max(f.invulnT, 0.3);
    foe.holdT = Math.max(foe.holdT, 0.5);
    if (s.t <= 0) {
      s.phase = "carry";
      s.t = spec.carry;
      AudioFX.powerup();
    }
  } else if (s.phase === "carry") {
    // Hover, bobbing, while the beam charges.
    f.y = GROUND_Y - 110 + Math.sin(s.t * 20) * 5;
    foe.x = f.x + f.attackDir * 50;
    foe.y = f.y - 10;
    s.frame = A.special[2];
    f.invulnT = Math.max(f.invulnT, 0.3);
    foe.holdT = Math.max(foe.holdT, 0.5);
    Sparks.ember(f.x - f.attackDir * 20, f.y - 120);
    if (s.t <= 0) {
      s.phase = "lase";
      s.t = spec.lase;
      s.tickAcc = 0;
      s.tickN = 0;
    }
  } else if (s.phase === "lase") {
    // Flickering beam + bleeding ticks straight into the held victim.
    foe.x = f.x + f.attackDir * 50;
    foe.y = f.y - 10;
    s.frame = A.special[2];
    f.invulnT = Math.max(f.invulnT, 0.3);
    foe.holdT = Math.max(foe.holdT, 0.5);
    // Tick schedule on phase-elapsed time (not an accumulator): all four
    // ticks land inside the window even with frame quantization.
    const elapsed = spec.lase - Math.max(0, s.t);
    if (s.tickN < spec.ticks && elapsed + 1e-9 >= (s.tickN + 1) * (spec.lase / spec.ticks)) {
      const eyeY = f.y - 130;
      Beams.spawn(f.x + f.attackDir * 12, eyeY, foe.x, foe.y - 100, 0.18);
      AudioFX.zap();
      f.camKick = Math.max(f.camKick, 0.15);
      if (foe.hp > 0) {
        foe.hp = Math.max(0, foe.hp - spec.tick);
        Sparks.blood(foe.x, foe.y - 100);
        Sparks.hit(foe.x, foe.y - 100, f.attackDir); // each tick flashes
        if (foe.hp <= 0) foe.state = "KO";
        else Hitstop.t = Math.max(Hitstop.t, 0.03);
      }
      s.tickN += 1;
    }
    if (s.t <= 0) {
      s.phase = "slam";
      s.t = 0.12;
      s.struckThis = false;
    }
  } else if (s.phase === "slam") {
    s.frame = A.special[3]; // hurl-down with the whole body
    if (!s.struckThis) {
      s.struckThis = true;
      const dir = foe.x >= f.x ? 1 : -1;
      foe.takeHit({ damage: spec.finale, hitstun: 0.7, knockback: 300 }, dir);
      if (foe.hp > 0) foe.knockdown(dir, 300, 0, spec.launchDown); // crater slam
      AudioFX.hit();
      f.camKick = Math.max(f.camKick, 0.8);
      Sparks.puff(foe.x, GROUND_Y - 20);
      Sparks.ring(foe.x, GROUND_Y - 60, 150);
      Sparks.dust(foe.x, GROUND_Y);
    }
    if (s.t <= 0) {
      s.phase = "recover";
      s.t = spec.recover;
    }
  } else {
    // Settle back to the ground as the mode ends.
    f.y += (GROUND_Y - f.y) * Math.min(1, dt * 6);
    s.frame = A.idle[0];
    if (s.t <= 0) endSpecial(f);
  }
}

// --- Wolverine: Adamantium Rush / Berserker Barrage / Weapon X Surge -------
export function tryWolverineSpecial(f, id, foe) {
  if (f.kind !== "wolverine") return false;
  if (id === "ragemode" && (!foe.grounded || foe.hp <= 0)) {
    // Pounce needs a grounded, living victim (same gate as H-rage).
  } else if (id !== "ragemode" && id !== "rush" && id !== "barrage") return false;
  const spec = beginSpecial(f, foe, WOLVERINE_SPECIALS, id);
  if (!spec) return false;
  f.attackDir = f.facing;
  f.state = "SPECIAL";
  f.specialId = id;
  if (id === "rush") f.special = { phase: "startup", t: spec.startup, struckThis: false, acc: 0, frame: null, distLeft: 0 };
  else if (id === "barrage") f.special = { phase: "open", t: spec.openTime, i: 0, struck: false, struckThis: false, acc: 0, frame: null };
  else {
    f.special = { phase: "transform", t: spec.transform, i: 0, struck: false, struckThis: false, acc: 0, frame: null };
    foe.freezeT = spec.transform + spec.frames.length * spec.strikeTime +
      (spec.frames.length - 1) * spec.gapTime + 0.6 + spec.recover + 0.15;
    Hitstop.t = Math.max(Hitstop.t, 0.2);
    Sparks.ring(foe.x, foe.y - 80, 110);
    AudioFX.powerup();
    AudioFX.snikt();
  }
  return true;
}

function rushMove(spec) {
  return {
    damage: spec.damage, hitstun: spec.hitstun, knockback: spec.knockback,
    hitstop: spec.hitstop, level: "mid", blockstun: spec.blockstun,
    blockPush: spec.blockPush, chip: spec.chip, bleed: spec.bleed, hit: spec.hit,
  };
}

function updateRush(f, foe, dt) {
  const spec = WOLVERINE_SPECIALS.rush;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "startup") {
    s.frame = A.attack[4];
    if (s.t <= 0) {
      s.phase = "dash"; s.t = spec.dashTime; s.struckThis = false;
      s.distLeft = spec.dashSpeed * spec.dashTime; s.acc = 0;
      f.invulnT = spec.dashTime + 0.05;
      f.rushLowT = spec.dashTime + 0.05; // ducks highs/laser mid-drive
      AudioFX.whoosh(); AudioFX.snikt();
      Sparks.puff(f.x, f.y - 60);
      Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.3);
    }
  } else if (s.phase === "dash") {
    s.frame = (Math.floor(s.t * 25) % 2 === 0) ? A.attack[21] : A.dash[0];
    const want = Math.min(spec.dashSpeed * dt, s.distLeft);
    f.x += f.attackDir * want; s.distLeft -= want;
    clampArena(f);
    f.rushLowT = Math.max(f.rushLowT, 0.05);
    s.acc += dt;
    while (s.acc >= 0.04) { s.acc -= 0.04; Sparks.blood(f.x - f.attackDir * 20, f.y - 70); }
    if (!s.struckThis) {
      const contact = resolveStrike(f, foe, rushMove(spec));
      if (contact) {
        s.struckThis = true;
        f.camKick = Math.max(f.camKick, 0.35);
        if (foe.hp > 0 && contact.type === "hit") foe.knockdown(f.attackDir, spec.knockback);
      }
    }
    if (s.t <= 0) {
      s.phase = "recover"; s.t = spec.recover;
      f.invulnT = Math.min(f.invulnT, 0.05); f.rushLowT = 0;
      Sparks.dust(f.x, GROUND_Y);
    }
  } else { s.frame = A.dash[0]; if (s.t <= 0) endSpecial(f); }
}

function barrageMove(spec, i) {
  const h = spec.hits[i];
  return {
    damage: h.damage, hitstun: h.stun, knockback: h.knock, hitstop: h.stop,
    level: "mid", blockstun: 0.15, blockPush: 200, chip: h.chip, bleed: h.bleed, hit: spec.hit,
  };
}

function updateBarrage(f, foe, dt) {
  const spec = WOLVERINE_SPECIALS.barrage;
  const s = f.special;
  s.t -= dt;
  if (s.phase === "open") {
    s.frame = f.sprites.attack[4];
    f.invulnT = 1.6;
    if (s.t <= 0) {
      s.i = 0;
      f.x = foe.x - (foe.x >= f.x ? 1 : -1) * -58; // step to foe side
      f.attackDir = foe.x >= f.x ? 1 : -1; f.facing = f.attackDir;
      f.special.frame = f.sprites.attack[spec.frames[0]];
      s.phase = "strike"; s.t = spec.strikeTime; s.struckThis = false;
      AudioFX.snikt();
    }
  } else if (s.phase === "strike") {
    s.frame = f.sprites.attack[spec.frames[s.i]];
    if (!s.struckThis) {
      const contact = resolveStrike(f, foe, barrageMove(spec, s.i));
      if (contact) {
        s.struckThis = true; s.struck = true;
        Sparks.blood(foe.x, foe.y - 90);
        f.camKick = Math.max(f.camKick, 0.15);
        if (s.i === spec.hits.length - 1 && contact.type === "hit" && foe.hp > 0)
          foe.knockdown(f.attackDir, spec.hits[s.i].knock, spec.hits[s.i].launch);
      }
    }
    if (s.t <= 0) {
      if (s.i === 0 && !s.struck) { s.phase = "recover"; s.t = spec.recover; }
      else if (s.i >= spec.hits.length - 1) { s.phase = "recover"; s.t = spec.recover; }
      else { s.phase = "gap"; s.t = spec.gapTime; }
    }
  } else if (s.phase === "gap") {
    s.frame = f.sprites.attack[spec.frames[s.i]];
    if (s.t <= 0) {
      s.i += 1;
      Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.3);
      AudioFX.whoosh();
      f.attackDir = foe.x >= f.x ? 1 : -1; f.facing = f.attackDir;
      s.phase = "strike"; s.t = spec.strikeTime; s.struckThis = false;
    }
  } else { s.frame = f.sprites.attack[spec.frames[Math.min(s.i, spec.frames.length - 1)]]; if (s.t <= 0) endSpecial(f); }
}

function xFrenzyMove(spec) {
  const h = spec.frenzy;
  return {
    damage: h.damage, hitstun: h.stun, knockback: h.knock, hitstop: h.stop,
    level: "mid", blockstun: 0.15, blockPush: 200, chip: h.chip, bleed: h.bleed, hit: spec.hit,
  };
}

function xBlink(f, foe, i) {
  const spec = WOLVERINE_SPECIALS.ragemode;
  Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.45, "shadow");
  Sparks.puff(f.x, f.y - 80);
  f.x = foe.x + spec.sides[i] * 62;
  clampArena(f);
  f.attackDir = foe.x >= f.x ? 1 : -1; f.facing = f.attackDir;
  Sparks.puff(f.x, f.y - 80);
  Sparks.blood(f.x, f.y - 80);
  f.special.frame = f.sprites.attack[spec.frames[i]];
  f.special.struckThis = false;
}

function updateXRage(f, foe, dt) {
  const spec = WOLVERINE_SPECIALS.ragemode;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "transform") {
    s.frame = A.attack[4];
    f.invulnT = 4.5;
    Sparks.ember(f.x + (Math.random() - 0.5) * 60, f.y - Math.random() * 120);
    if (s.t <= 0) {
      f.hp = Math.min(f.maxHp, f.hp + spec.heal); // burst heal
      s.i = 0; xBlink(f, foe, 0);
      s.phase = "strike"; s.t = spec.strikeTime;
      AudioFX.snikt();
    }
  } else if (s.phase === "strike") {
    if (!s.struckThis) {
      const contact = resolveStrike(f, foe, xFrenzyMove(spec));
      if (contact) {
        s.struckThis = true; s.struck = true;
        Sparks.blood(foe.x, foe.y - 90);
        f.camKick = Math.max(f.camKick, 0.12);
      }
    }
    if (s.t <= 0) {
      if (s.i === 0 && !s.struck) { s.phase = "recover"; s.t = spec.recoverAbort; foe.freezeT = Math.min(foe.freezeT, 0.35); }
      else if (s.i >= spec.frames.length - 1) { s.phase = "pounce"; s.t = 0.15; }
      else { s.phase = "gap"; s.t = spec.gapTime; }
    }
  } else if (s.phase === "gap") {
    if (s.t <= 0) { s.i += 1; xBlink(f, foe, s.i); s.phase = "strike"; s.t = spec.strikeTime; }
  } else if (s.phase === "pounce") {
    s.frame = A.attack[21];
    if (!s.seized && foe.hp > 0 && Math.abs(foe.x - f.x) < 120) {
      s.seized = true;
      foe.takeGrabbed(f); foe.holdT = 2.0;
      foe.x = f.x + f.attackDir * 50;
    }
    if (s.t <= 0) { s.phase = "shred"; s.t = 0.5; s.tickN = 0; s.tickAcc = 0; }
  } else if (s.phase === "shred") {
    s.frame = A.attack[spec.frames[s.tickN % spec.frames.length]];
    s.tickAcc += dt;
    const step = 0.5 / spec.shredTicks;
    if (s.tickN < spec.shredTicks && s.tickAcc >= (s.tickN + 1) * step) {
      if (foe.hp > 0) {
        foe.hp = Math.max(0, foe.hp - spec.shred);
        foe.sinceDamageT = 0;
        if (typeof foe.applyBleed === "function") foe.applyBleed(3);
        Sparks.blood(foe.x, foe.y - 100);
        Sparks.hit(foe.x, foe.y - 100, f.attackDir);
        AudioFX.hit();
        if (foe.hp <= 0) foe.state = "KO";
        else Hitstop.t = Math.max(Hitstop.t, 0.03);
      }
      s.tickN += 1;
    }
    if (s.t <= 0) {
      s.phase = "slam"; s.t = 0.12; s.struckThis = false;
      if (foe.heldBy === f) { foe.heldBy = null; foe.state = "IDLE"; }
    }
  } else if (s.phase === "slam") {
    s.frame = A.attack[21];
    if (!s.struckThis) {
      s.struckThis = true;
      const dir = foe.x >= f.x ? 1 : -1;
      foe.takeHit({ damage: spec.finale, hitstun: 0.7, knockback: 300 }, dir);
      if (typeof foe.applyBleed === "function") foe.applyBleed(3);
      if (foe.hp > 0) foe.knockdown(dir, 300, 0, spec.launchDown);
      AudioFX.hit(); AudioFX.boom();
      f.camKick = Math.max(f.camKick, 0.8);
      Sparks.ring(foe.x, GROUND_Y - 60, 150);
      Sparks.dust(foe.x, GROUND_Y);
    }
    if (s.t <= 0) { s.phase = "recover"; s.t = spec.recover; }
  } else { s.frame = A.idle[0]; if (s.t <= 0) endSpecial(f); }
}
