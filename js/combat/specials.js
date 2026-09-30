import { WESKER_SPECIALS, HOMELANDER_SPECIALS, WOLVERINE_SPECIALS, HULK_SPECIALS, IRONMAN_SPECIALS, THOR_SPECIALS, UROBOROS_SPECIALS, DECAY } from "./data.js";
import { resolveStrike, Hitstop, vulnMult } from "./combat.js";
import { clampArena } from "../physics.js";
import { Sparks, Clones, Beams, Missiles, Bolts, FlyingHammer } from "../effects.js";
import { AudioFX } from "../audio.js";
import { GROUND_Y } from "../config.js";
import { arena } from "../arena.js";

function endSpecial(f) {

  if (f.special && f.special.airborne) {
    f.y = GROUND_Y;
    f.vy = 0;
    f.grounded = true;
  }
  f.state = "IDLE";
  f.specialId = null;
  f.special = null;
}

function beginSpecial(f, foe, table, id) {
  const spec = table[id];
  if (!spec || f.hp <= 0 || f.freezeT > 0) return null;
  if (f.state === "SPECIAL" || f.state === "KO" || f.state === "GRAB" || f.state === "THROWN") return null;
  if (f.rageLevel < spec.cost) return null;
  if (Math.abs(foe.x - f.x) > spec.maxRange) return null;
  if (!f.spendRage(spec.cost)) return null;

  f.y = GROUND_Y;
  f.vy = 0;
  f.grounded = true;

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
  f.invulnT = Math.max(f.invulnT, 0.35);
  return spec;
}

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

    foe.freezeT = spec.transform + spec.frames.length * spec.strikeTime +
      (spec.frames.length - 1) * spec.gapTime +
      spec.rise + spec.aim + spec.drop + spec.recover + 0.15;
    Hitstop.t = Math.max(Hitstop.t, 0.2);
    Sparks.ring(foe.x, foe.y - 80, 110);
    AudioFX.powerup();
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
  if (f.kind === "ironman" && f.specialId) {
    if (f.specialId === "burst") updateBurst(f, foe, dt);
    else if (f.specialId === "unibeam") updateUnibeam(f, foe, dt);
    else updateShelling(f, foe, dt);
    return;
  }
  if (f.kind === "thor" && f.specialId) {
    if (f.specialId === "storm") updateStorm(f, foe, dt);
    else if (f.specialId === "lightning") updateLightning(f, foe, dt);
    else updateGodblast(f, foe, dt);
    return;
  }
  if (f.kind === "uroboros" && f.specialId) {
    if (f.specialId === "wrap") updateWrap(f, foe, dt);
    else if (f.specialId === "rock") updateRock(f, foe, dt);
    else updateImpale(f, foe, dt);
    return;
  }
  endSpecial(f);
}

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
    s.frame = A.attack[4];
    s.acc += dt;
    if (s.acc >= 0.03) {
      s.acc = 0;
      Sparks.shadowburst(f.x, f.y);
    }
    if (s.t <= 0) {

      Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.45, "shadow");
      Sparks.shadowburst(f.x, f.y);
      AudioFX.whoosh();
      f.x += s.dir * spec.dist;
      clampArena(f);

      s.phase = "shift";
      s.t = spec.shift;
      f.invulnT = Math.max(f.invulnT, spec.shift + 0.03);
    }
  } else if (s.phase === "shift") {
    s.frame = A.dash[0];
    if (s.t <= 0) {

      Sparks.shadowburst(f.x, f.y);
      Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.3, "shadow");
      s.phase = "reform";
      s.t = spec.reform;
    }
  } else {
    s.frame = A.crouch[0];
    s.acc += dt;
    if (s.acc >= 0.05) {
      s.acc = 0;
      Sparks.shadowburst(f.x, f.y);
    }
    if (s.t <= 0) endSpecial(f);
  }
}

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
    s.frame = A.attack[4];
    if (s.t <= 0) {
      s.phase = "dash";
      s.t = spec.dashTime;
      s.struckThis = false;

      s.distLeft = spec.dashSpeed * spec.dashTime;
      s.acc = 0;
      f.invulnT = spec.dashTime + 0.05;
      AudioFX.whoosh();
      Sparks.puff(f.x, f.y - 60);
      Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.3);
    }
  } else if (s.phase === "dash") {

    s.frame = (Math.floor(s.t * 25) % 2 === 0) ? A.special[0] : A.dash[0];
    const want = Math.min(spec.dashSpeed * dt, s.distLeft);
    f.x += f.attackDir * want;
    s.distLeft -= want;
    clampArena(f);

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
      Sparks.dust(f.x, GROUND_Y);
      f.camKick = Math.max(f.camKick, 0.15);
    }
  } else {
    s.frame = A.dash[0];
    if (s.t <= 0) endSpecial(f);
  }
}

function phantomMove(spec, i) {
  const h = spec.hits[i];
  return {
    damage: h.damage, hitstun: h.stun, knockback: h.knock, hitstop: h.stop,

    level: "mid", blockstun: 0.15, blockPush: 200, chip: h.chip, hit: spec.hit,
  };
}

function phantomBlink(f, foe, i) {
  const spec = WESKER_SPECIALS.phantom;

  Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.35);
  Sparks.puff(f.x, f.y - 80);
  AudioFX.whoosh();
  f.x = foe.x + spec.sides[i] * 58;
  clampArena(f);
  f.attackDir = foe.x >= f.x ? 1 : -1;
  f.facing = f.attackDir;
  Sparks.puff(f.x, f.y - 80);
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
    f.invulnT = 1.9;
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

          if (contact.type === "hit" && foe.hp > 0) {
            foe.knockdown(f.attackDir, spec.hits[s.i].knock, spec.hits[s.i].launch);
          }
          f.camKick = Math.max(f.camKick, 0.6);
        }
      }
    }
    if (s.t <= 0) {
      if (s.i === 0 && !s.struck) {
        s.phase = "recover";
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

function rageFrenzyMove(spec) {
  const h = spec.frenzy;
  return {
    damage: h.damage, hitstun: h.stun, knockback: h.knock, hitstop: h.stop,

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

    const k = 1 - Math.max(0, s.t) / spec.transform;
    if (k < 0.35) {
      s.frame = A.attack[4];
    } else if (k < 0.7) {
      if (!s.beat2) {
        s.beat2 = true;
        AudioFX.whoosh();
        Sparks.puff(f.x, f.y - 100);
        f.camKick = Math.max(f.camKick, 0.35);
      }
      s.frame = A.special[4];
    } else {
      if (!s.beat3) {
        s.beat3 = true;
        AudioFX.powerup();
        Sparks.ring(f.x, f.y - 80, 120);
        f.camKick = Math.max(f.camKick, 0.4);
      }
      s.frame = A.special[1];
    }
    f.invulnT = 5.4;
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
        s.phase = "recover";
        s.t = spec.recoverAbort;
        foe.freezeT = Math.min(foe.freezeT, 0.35);
      } else if (s.i >= spec.frames.length - 1) {
        s.phase = "rise";
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

    if (!s.leapt) {
      s.leapt = true;
      AudioFX.whoosh();
      Sparks.dust(f.x, GROUND_Y);
      Sparks.puff(f.x, f.y - 40);
      Clones.spawn(f.currentFrame(), f.x, f.y, f.facing, 0.5, "shadow");
      f.camKick = Math.max(f.camKick, 0.3);
    }
    const k = 1 - Math.max(0, s.t) / spec.rise;
    const ease = 1 - Math.pow(1 - k, 3);
    f.y = GROUND_Y - 280 * ease;
    s.frame = A.special[5];
    Sparks.violet(f.x - f.attackDir * 20, f.y - 30);
    f.invulnT = Math.max(f.invulnT, 0.3);
    if (s.t <= 0) {
      s.phase = "aim";
      s.t = spec.aim;
      s.tx = foe.x;

      f.x = s.tx;
      clampArena(f);
      f.attackDir = foe.x >= f.x ? 1 : -1;
      f.facing = f.attackDir;
      Sparks.puff(f.x, f.y - 140);
      Missiles.launch(f.x, f.y - 140, spec.aim);
      AudioFX.whoosh();
      s.frame = A.special[6];
      Sparks.ring(s.tx, GROUND_Y - 40, 90);
    }
  } else if (s.phase === "aim") {

    f.x = s.tx;
    f.y = GROUND_Y - 280 + Math.sin(s.t * 18) * 6;
    s.frame = A.special[6];
    Sparks.ember(f.x + (Math.random() - 0.5) * 70, f.y - 40 - Math.random() * 60);
    f.invulnT = Math.max(f.invulnT, 0.3);
    if (s.t <= 0) {
      s.phase = "drop";
      s.t = spec.drop;

      AudioFX.grab();
      Sparks.hit(f.x, f.y - 150, 1);
      f.camKick = Math.max(f.camKick, 0.3);
      Missiles.launch(s.tx, GROUND_Y, spec.drop);
    }
  } else if (s.phase === "drop") {

    const k = 1 - Math.max(0, s.t) / spec.drop;
    const ease = k * k;
    f.x = s.tx;
    f.y = GROUND_Y - 280 + 280 * ease;
    s.frame = A.special[10];
    Missiles.hold(f.x, f.y - 150);
    f.invulnT = Math.max(f.invulnT, 0.3);
    Sparks.ember(f.x, f.y - 60);
    Sparks.violet(f.x - f.attackDir * 16, f.y - 80);
    if (s.t <= 0) {
      Missiles.clear();

      f.y = GROUND_Y;
      const box = { x: s.tx - 60, y: GROUND_Y - 140, w: 120, h: 140 };
      const contact = resolveStrike(f, foe, rageMissileMove(spec), box);

      if (contact && foe.hp > 0) {
        if (contact.type === "hit") foe.knockdown(f.attackDir, spec.missileKnock);
        else foe.crumple = true;
      }
      AudioFX.hit();
      AudioFX.boom();
      f.camKick = Math.max(f.camKick, 1.0);
      Sparks.puff(s.tx, GROUND_Y - 40);
      Sparks.dust(s.tx, GROUND_Y);

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

export function tryIronmanSpecial(f, id, foe) {
  if (f.kind !== "ironman") return false;
  const spec = beginSpecial(f, foe, IRONMAN_SPECIALS, id);
  if (!spec) return false;
  f.attackDir = f.facing;
  f.state = "SPECIAL";
  f.specialId = id;
  if (id === "burst") {
    f.special = { phase: "fire", t: spec.volleyTime, i: 0, struckThis: false, acc: 0, frame: null };
    f.invulnT = Math.max(f.invulnT, 0.5);
  } else if (id === "unibeam") {
    f.special = { phase: "startup", t: spec.startup, struckThis: false, acc: 0, frame: null };
  } else {
    f.special = { phase: "ascend", t: spec.ascend, i: 0, acc: 0, pending: [], frame: null, airborne: true };
    f.invulnT = 3.0;
    AudioFX.powerup();
  }
  return true;
}

function burstMove(spec) {
  return {
    damage: spec.damage, hitstun: 0.35, knockback: spec.knockback,
    hitstop: spec.hitstop, level: "mid", blockstun: spec.blockstun,
    blockPush: spec.blockPush, chip: spec.chip, heat: true, hit: { w: 0, top: 0, h: 0 },
  };
}

function burstRay(f, spec) {
  const y = f.y - spec.rayTop;
  const x1 = f.x + f.attackDir * 12;
  const x2 = f.x + f.attackDir * spec.rayLen;
  return { x: Math.min(x1, x2), y: y - spec.rayH / 2, w: Math.abs(x2 - x1), h: spec.rayH };
}

function updateBurst(f, foe, dt) {
  const spec = IRONMAN_SPECIALS.burst;
  const s = f.special;
  s.t -= dt;
  if (s.phase === "fire") {
    s.frame = f.sprites.attack[32];
    f.invulnT = Math.max(f.invulnT, 0.1);
    if (!s.struckThis) {
      s.struckThis = true;
      const ray = burstRay(f, spec);
      const eyeY = f.y - spec.rayTop;

      Beams.spawn(f.x + f.attackDir * 40, eyeY,
        Math.max(0, Math.min(arena.width, f.x + f.attackDir * spec.rayLen)), eyeY, 0.12, "#35c8ff");
      AudioFX.repulsor();
      const contact = resolveStrike(f, foe, burstMove(spec), ray);
      if (contact && contact.type === "hit") Sparks.blood(foe.x, eyeY);
    }
    if (s.t <= 0) {
      if (s.i >= spec.volleys - 1) {
        s.phase = "recover";
        s.t = spec.recover;
      } else {
        s.i += 1;
        s.phase = "gap";
        s.t = spec.gapTime;
      }
    }
  } else if (s.phase === "gap") {
    s.frame = f.sprites.attack[32];
    if (s.t <= 0) {
      s.phase = "fire";
      s.t = spec.volleyTime;
      s.struckThis = false;
    }
  } else {
    s.frame = f.sprites.idle[0];
    if (s.t <= 0) endSpecial(f);
  }
}

function unibeamMove(spec) {
  return {
    damage: spec.damage, hitstun: spec.hitstun, knockback: spec.knockback,
    hitstop: spec.hitstop, level: spec.level, blockstun: spec.blockstun,
    blockPush: spec.blockPush, chip: spec.chip, heat: true, hit: { w: 0, top: 0, h: 0 },
  };
}

function updateUnibeam(f, foe, dt) {
  const spec = IRONMAN_SPECIALS.unibeam;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "startup") {
    s.frame = A.attack[4];
    if (Math.random() < 0.5) Sparks.ember(f.x + f.attackDir * 10, f.y - 110);
    if (s.t <= 0) {
      s.phase = "fire";
      s.t = spec.fire;
      s.struckThis = false;
      const y = f.y - spec.beamTop;
      const x1 = f.x + f.attackDir * 12;
      const x2 = Math.max(0, Math.min(arena.width, f.x + f.attackDir * spec.beamLen));
      Beams.spawn(x1, y, x2, y, spec.fire + 0.02, "#bff4ff");
      AudioFX.repulsor();
      AudioFX.zap();
      f.camKick = Math.max(f.camKick, 0.35);
    }
  } else if (s.phase === "fire") {
    s.frame = A.attack[33];
    if (!s.flick && s.t < spec.fire / 2) {
      s.flick = true;
      const y = f.y - spec.beamTop;
      const x1 = f.x + f.attackDir * 12;
      const x2 = Math.max(0, Math.min(arena.width, f.x + f.attackDir * spec.beamLen));
      Beams.spawn(x1, y, x2, y, spec.fire / 2, "#bff4ff");
    }
    if (!s.struckThis) {
      const y = f.y - spec.beamTop;
      const x1 = f.x + f.attackDir * 12;
      const x2 = Math.max(0, Math.min(arena.width, f.x + f.attackDir * spec.beamLen));
      const ray = { x: Math.min(x1, x2), y: y - spec.beamH / 2, w: Math.abs(x2 - x1), h: spec.beamH };
      const contact = resolveStrike(f, foe, unibeamMove(spec), ray);
      if (contact) {
        s.struckThis = true;
        if (contact.type === "hit") Sparks.blood(foe.x, y);
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

function updateShelling(f, foe, dt) {
  const spec = IRONMAN_SPECIALS.shelling;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "ascend") {

    const k = 1 - Math.max(0, s.t) / spec.ascend;
    f.y = GROUND_Y - 220 * k;
    s.frame = A.attack[34];
    f.invulnT = Math.max(f.invulnT, 0.3);
    Sparks.ember(f.x, f.y - 20);
    if (s.t <= 0) {
      s.phase = "rain";
      s.t = spec.volleyGap;
      s.i = 0;
      s.acc = 0;
    }
  } else if (s.phase === "rain") {

    f.y = GROUND_Y - 220 + Math.sin(s.t * 14) * 6;
    s.frame = A.attack[32];
    f.invulnT = Math.max(f.invulnT, 0.3);
    Sparks.ember(f.x + (Math.random() - 0.5) * 40, f.y - 20);

    for (const m of s.pending) m.t += dt;
    for (const m of s.pending) {
      if (!m.done && m.t >= spec.fallTime) {
        m.done = true;
        const box = { x: m.tx - 55, y: GROUND_Y - 150, w: 110, h: 150 };
        const contact = resolveStrike(f, foe,
          { damage: spec.volleyDmg, hitstun: 0.5, knockback: 400, hitstop: 0.08, level: "mid", blockstun: 0.35, blockPush: 450, chip: spec.volleyChip, heat: true, hit: { w: 0, top: 0, h: 0 } }, box);
        if (contact && foe.hp > 0) {
          if (contact.type === "hit") Sparks.blood(m.tx, GROUND_Y - 80);
          else foe.crumple = true;
        }
        AudioFX.boom();
        f.camKick = Math.max(f.camKick, 0.5);
        Sparks.ring(m.tx, GROUND_Y - 60, 170);
        Sparks.dust(m.tx, GROUND_Y);
      }
    }
    s.acc += dt;
    if (s.i < spec.volleys && s.acc >= spec.volleyGap) {
      s.acc = 0;
      const tx = foe.x;
      s.pending.push({ tx, t: 0, done: false });
      Missiles.launch(tx, GROUND_Y, spec.fallTime);
      Sparks.ring(tx, GROUND_Y - 40, 90);
      AudioFX.whoosh();
      s.i += 1;
    }
    if (s.i >= spec.volleys && s.pending.every((m) => m.done)) {
      s.phase = "recover";
      s.t = spec.recover;
    }
  } else {

    f.y += (GROUND_Y - f.y) * Math.min(1, dt * 6);
    s.frame = A.idle[0];
    if (s.t <= 0) endSpecial(f);
  }
}

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
    s.frame = A.attack[4];
    if (Math.random() < 0.4) Sparks.dust(f.x, GROUND_Y);
    if (s.t <= 0) {
      s.phase = "dash";
      s.t = spec.dashTime;
      s.struckThis = false;
      s.distLeft = spec.dashSpeed * spec.dashTime;
      s.acc = 0;
      f.invulnT = spec.dashTime + 0.05;
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
    s.frame = A.special[8];
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
    s.frame = A.special[3];
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

    const k = 1 - Math.max(0, s.t) / spec.ascend;
    foe.x = f.x + f.attackDir * 55;
    foe.y = GROUND_Y - 150 * k;
    s.frame = A.special[9];
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

    foe.x = f.x + f.attackDir * 55;
    foe.y = GROUND_Y - 150 + Math.sin(s.t * 30) * 8;
    s.frame = f.sprites.attack[27];
    f.invulnT = Math.max(f.invulnT, 0.3);
    foe.holdT = Math.max(foe.holdT, 0.5);
    const elapsed = spec.shake - Math.max(0, s.t);
    if (s.tickN < spec.ticks && elapsed + 1e-9 >= (s.tickN + 1) * (spec.shake / spec.ticks)) {
      AudioFX.hit();
      f.camKick = Math.max(f.camKick, 0.2);
      if (foe.hp > 0) {
        foe.hp = Math.max(0, foe.hp - spec.tick * vulnMult(foe, false));
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
    s.frame = f.sprites.attack[27];
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

    if (foe.heldBy === f) { foe.heldBy = null; if (foe.hp > 0) foe.state = "IDLE"; }
    s.frame = A.idle[0];
    if (s.t <= 0) endSpecial(f);
  }
}

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
    blockPush: spec.blockPush, chip: spec.chip, heat: true, hit: { w: 0, top: 0, h: 0 },
  };
}

function updateLaser(f, foe, dt) {
  const spec = HOMELANDER_SPECIALS.laser;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "startup") {
    s.frame = A.special[7];
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
    s.frame = A.special[2];

    if (!s.flick && s.t < spec.fire / 2) {
      s.flick = true;
      const eyeY = f.y - 130;
      const x1 = f.x + f.attackDir * 12;
      const x2 = Math.max(0, Math.min(arena.width, f.x + f.attackDir * spec.beamLen));
      Beams.spawn(x1, eyeY, x2, eyeY, spec.fire / 2);
    }
    if (!s.struckThis) {

      const eyeY = f.y - 130;
      const x1 = f.x + f.attackDir * 12;
      const x2 = Math.max(0, Math.min(arena.width, f.x + f.attackDir * spec.beamLen));
      const ray = { x: Math.min(x1, x2), y: eyeY - spec.beamH / 2, w: Math.abs(x2 - x1), h: spec.beamH };
      const contact = resolveStrike(f, foe, laserMove(spec), ray);
      if (contact) {
        s.struckThis = true;
        if (contact.type === "hit") Sparks.blood(foe.x, eyeY);

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
    s.frame = A.special[8];
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
    s.frame = A.special[3];

    if (!s.rang && s.t < spec.active / 2) {
      s.rang = true;
      Sparks.ring(f.x, f.y - 80, Math.round(spec.radius * 0.7));
    }
    if (!s.struckThis) {

      const dir = foe.x >= f.x ? 1 : -1;
      f.attackDir = foe.x === f.x ? f.attackDir : dir;
      const zone = { x: f.x - spec.radius, y: f.y - spec.top, w: spec.radius * 2, h: spec.top };
      const contact = resolveStrike(f, foe, screamMove(spec), zone);
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

function updateHRage(f, foe, dt) {
  const spec = HOMELANDER_SPECIALS.ragemode;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "ascend") {

    const k = 1 - Math.max(0, s.t) / spec.ascend;
    f.y = GROUND_Y - 110 * k;
    foe.x = f.x + f.attackDir * 50;
    foe.y = f.y - 10;
    s.frame = A.special[9];
    Sparks.ember(f.x - f.attackDir * 20, f.y - 100);
    f.invulnT = Math.max(f.invulnT, 0.3);
    foe.holdT = Math.max(foe.holdT, 0.5);
    if (s.t <= 0) {
      s.phase = "carry";
      s.t = spec.carry;
      AudioFX.powerup();
    }
  } else if (s.phase === "carry") {

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

    foe.x = f.x + f.attackDir * 50;
    foe.y = f.y - 10;
    s.frame = A.special[2];
    f.invulnT = Math.max(f.invulnT, 0.3);
    foe.holdT = Math.max(foe.holdT, 0.5);

    const elapsed = spec.lase - Math.max(0, s.t);
    if (s.tickN < spec.ticks && elapsed + 1e-9 >= (s.tickN + 1) * (spec.lase / spec.ticks)) {
      const eyeY = f.y - 130;
      Beams.spawn(f.x + f.attackDir * 12, eyeY, foe.x, foe.y - 100, 0.18);
      AudioFX.zap();
      f.camKick = Math.max(f.camKick, 0.15);
      if (foe.hp > 0) {
        foe.hp = Math.max(0, foe.hp - spec.tick * vulnMult(foe, true));
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
    s.frame = A.special[3];
    if (!s.struckThis) {
      s.struckThis = true;
      const dir = foe.x >= f.x ? 1 : -1;
      foe.takeHit({ damage: spec.finale, hitstun: 0.7, knockback: 300 }, dir);
      if (foe.hp > 0) foe.knockdown(dir, 300, 0, spec.launchDown);
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

    f.y += (GROUND_Y - f.y) * Math.min(1, dt * 6);
    s.frame = A.idle[0];
    if (s.t <= 0) endSpecial(f);
  }
}

export function tryWolverineSpecial(f, id, foe) {
  if (f.kind !== "wolverine") return false;
  if (id === "ragemode" && (!foe.grounded || foe.hp <= 0)) {

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
      f.rushLowT = spec.dashTime + 0.05;
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
      f.x = foe.x - (foe.x >= f.x ? 1 : -1) * -58;
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
      f.hp = Math.min(f.maxHp, f.hp + spec.heal);
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
        foe.hp = Math.max(0, foe.hp - spec.shred * vulnMult(foe, false));
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


export function tryThorSpecial(f, id, foe) {
  if (f.kind !== "thor") return false;
  const spec = beginSpecial(f, foe, THOR_SPECIALS, id);
  if (!spec) return false;
  f.attackDir = f.facing;
  f.state = "SPECIAL";
  f.specialId = id;
  f.special = { phase: "startup", t: spec.startup, struckThis: false, acc: 0, frame: null, rang: false };
  if (id === "godblast") {
    f.invulnT = 5.5;
    AudioFX.powerup();
  }
  return true;
}

function stormMove(spec) {
  return {
    damage: spec.damage, hitstun: spec.hitstun, knockback: spec.knockback,
    hitstop: spec.hitstop, level: spec.level, blockstun: spec.blockstun,
    blockPush: spec.blockPush, chip: spec.chip, hit: { w: 0, top: 0, h: 0 },
  };
}

function updateStorm(f, foe, dt) {
  const spec = THOR_SPECIALS.storm;
  const s = f.special;
  s.t -= dt;
  if (s.phase === "startup") {
    s.frame = f.sprites.attack[40];
    if (Math.random() < 0.5) Sparks.ember(f.x + f.attackDir * 10, f.y - 130);
    if (s.t <= 0) {
      s.phase = "out";
      s.t = spec.outTime;
      s.hx = f.x + f.attackDir * 20;
      s.struckOut = false;
      s.struckBack = false;
      AudioFX.whoosh();
      AudioFX.thunder();
      f.invulnT = Math.max(f.invulnT, spec.outTime + spec.backTime + 0.1);
    }
  } else if (s.phase === "out" || s.phase === "back") {
    s.frame = f.sprites.attack[39];
    const returning = s.phase === "back";
    const spd = returning ? spec.backSpeed : spec.speed;
    s.hx += (returning ? -f.attackDir : f.attackDir) * spd * dt;
    s.hx = Math.max(0, Math.min(arena.width, s.hx));
    FlyingHammer.show(s.hx, f.y - spec.box.top, f.attackDir);
    if (Math.random() < 0.6) Sparks.violet(s.hx, f.y - spec.box.top);
    const flag = returning ? "struckBack" : "struckOut";
    if (!s[flag]) {
      const box = {
        x: s.hx - spec.box.w / 2,
        y: f.y - spec.box.top - spec.box.h / 2,
        w: spec.box.w, h: spec.box.h,
      };
      const contact = resolveStrike(f, foe, stormMove(spec), box);
      if (contact) {
        s[flag] = true;
        f.camKick = Math.max(f.camKick, 0.25);
        if (contact.type === "hit") Sparks.blood(foe.x, f.y - spec.box.top);
        if (foe.hp > 0) {
          if (contact.type === "hit") foe.knockdown(f.attackDir, spec.knockback);
          else foe.crumple = true;
        }
      }
    }
    if (!returning && s.t <= 0) {
      s.phase = "back";
      s.t = spec.backTime;
    } else if (returning) {
      const caught = (f.attackDir === 1 && s.hx <= f.x) ||
        (f.attackDir === -1 && s.hx >= f.x) || s.t <= 0;
      if (caught) {
        FlyingHammer.hide();
        s.phase = "recover";
        s.t = spec.recover;
      }
    }
  } else {
    FlyingHammer.hide();
    s.frame = f.sprites.idle[0];
    if (s.t <= 0) endSpecial(f);
  }
}

function updateLightning(f, foe, dt) {
  const spec = THOR_SPECIALS.lightning;
  const s = f.special;
  s.t -= dt;
  if (s.phase === "startup") {
    s.frame = f.sprites.attack[40];
    if (Math.random() < 0.5) Sparks.ember(f.x, f.y - 160);
    if (s.t <= 0) {
      s.phase = "active"; s.t = spec.active; s.struckThis = false; s.rang = false;
      AudioFX.thunder();
      AudioFX.boom();
      Sparks.ring(f.x, f.y - 80, spec.radius);
      Sparks.dust(f.x, GROUND_Y);
      f.camKick = Math.max(f.camKick, 0.55);
    }
  } else if (s.phase === "active") {
    s.frame = f.sprites.attack[41];
    if (!s.rang && s.t < spec.active / 2) {
      s.rang = true;
      Sparks.ring(f.x, f.y - 80, Math.round(spec.radius * 0.7));
    }
    if (!s.struckThis) {
      const dir = foe.x >= f.x ? 1 : -1;
      f.attackDir = foe.x === f.x ? f.attackDir : dir;
      const zone = { x: f.x - spec.radius, y: f.y - spec.top, w: spec.radius * 2, h: spec.top };
      const contact = resolveStrike(f, foe,
        { damage: spec.damage, hitstun: spec.hitstun, knockback: spec.knockback, hitstop: spec.hitstop, level: spec.level, blockstun: spec.blockstun, blockPush: spec.blockPush, chip: spec.chip, heat: true, hit: { w: 0, top: 0, h: 0 } }, zone);
      if (contact) {
        s.struckThis = true;
        Sparks.ring(f.x, f.y - 80, spec.radius * 0.6);
        if (foe.hp > 0) {
          if (contact.type === "hit") foe.knockdown(f.attackDir, spec.knockback);
          else foe.crumple = true;
        }
      }
    }
    if (s.t <= 0) { s.phase = "recover"; s.t = spec.recover; }
  } else { s.frame = f.sprites.idle[0]; if (s.t <= 0) endSpecial(f); }
}

function godblastTick(spec) {
  return {
    damage: spec.tickDmg, hitstun: spec.tickStun, knockback: spec.tickKnock,
    hitstop: spec.tickStop, level: "mid", blockstun: spec.tickBlockstun,
    blockPush: spec.tickPush, chip: spec.tickChip, heat: true, hit: { w: 0, top: 0, h: 0 },
  };
}

function updateGodblast(f, foe, dt) {
  const spec = THOR_SPECIALS.godblast;
  const s = f.special;
  s.t -= dt;
  if (s.phase === "startup") {
    s.frame = f.sprites.attack[40];
    f.invulnT = Math.max(f.invulnT, 0.3);
    if (Math.random() < 0.6) Sparks.ember(f.x + (Math.random() - 0.5) * 60, f.y - 120);
    if (s.t <= 0) {
      s.phase = "slam";
      s.t = spec.slamTime;
      s.tx = foe.x;
      AudioFX.boom();
      Sparks.ring(f.x, GROUND_Y - 40, 160);
      Sparks.dust(f.x, GROUND_Y);
      f.camKick = Math.max(f.camKick, 0.5);
    }
  } else if (s.phase === "slam") {
    s.frame = f.sprites.attack[38];
    if (s.t <= 0) {
      s.phase = "barrage";
      s.t = spec.barrageTime;
      s.tickN = 0;
    }
  } else if (s.phase === "barrage") {
    s.frame = f.sprites.attack[43];
    f.invulnT = Math.max(f.invulnT, 0.3);
    const elapsed = spec.barrageTime - Math.max(0, s.t);
    if (s.tickN < spec.ticks && elapsed + 1e-9 >= (s.tickN + 1) * (spec.barrageTime / spec.ticks)) {
      const bx = s.tx + (Math.random() - 0.5) * 80;
      Bolts.strike(bx, GROUND_Y, 0);
      AudioFX.thunder();
      f.camKick = Math.max(f.camKick, 0.25);
      const zone = { x: bx - 60, y: GROUND_Y - spec.top, w: 120, h: spec.top };
      const contact = resolveStrike(f, foe, godblastTick(spec), zone);
      if (contact && contact.type === "hit") Sparks.blood(foe.x, GROUND_Y - 100);
      s.tickN += 1;
    }
    if (Math.random() < 0.4) Sparks.ember(f.x + (Math.random() - 0.5) * 120, GROUND_Y - Math.random() * 140);
    if (s.t <= 0) {
      s.phase = "recover";
      s.t = spec.recover;
    }
  } else {
    s.frame = f.sprites.idle[0];
    if (s.t <= 0) endSpecial(f);
  }
}

export function tryUroborosSpecial(f, id, foe) {
  if (f.kind !== "uroboros") return false;
  if ((id === "wrap" || id === "impale") && (!foe.grounded || foe.hp <= 0)) return false;
  const spec = beginSpecial(f, foe, UROBOROS_SPECIALS, id);
  if (!spec) return false;
  f.attackDir = f.facing;
  f.state = "SPECIAL";
  f.specialId = id;
  f.special = { phase: "startup", t: spec.startup, struckThis: false, acc: 0, frame: null };
  if (id === "impale") {
    f.invulnT = 2.5;
    AudioFX.powerup();
  }
  return true;
}

function updateWrap(f, foe, dt) {
  const spec = UROBOROS_SPECIALS.wrap;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "startup") {
    s.frame = A.attack[48];
    f.x += f.attackDir * (spec.lunge / spec.startup) * dt;
    clampArena(f);
    if (s.t <= 0) {
      const dx = foe.x - f.x;
      if (foe.hp > 0 && foe.grounded && foe.invulnT <= 0 &&
        Math.abs(dx) <= spec.range && (dx === 0 || Math.sign(dx) === f.attackDir)) {
        s.phase = "carry";
        s.t = spec.carry;
        foe.takeGrabbed(f);
        foe.holdT = spec.carry + spec.raise + 0.5;
        foe.x = f.x + f.attackDir * 55;
        AudioFX.squelch();
      } else {
        s.phase = "recover";
        s.t = spec.recover;
        AudioFX.whiff();
      }
    }
  } else if (s.phase === "carry") {
    s.frame = A.attack[48];
    foe.x = f.x + f.attackDir * 55;
    foe.holdT = Math.max(foe.holdT, 0.5);
    f.invulnT = Math.max(f.invulnT, 0.2);
    if (s.t <= 0) {
      s.phase = "raise";
      s.t = spec.raise;
      AudioFX.whoosh();
    }
  } else if (s.phase === "raise") {
    s.frame = A.attack[49];
    const k = 1 - Math.max(0, s.t) / spec.raise;
    foe.x = f.x + f.attackDir * 55;
    foe.y = GROUND_Y - 150 * k;
    foe.holdT = Math.max(foe.holdT, 0.4);
    f.invulnT = Math.max(f.invulnT, 0.2);
    if (s.t <= 0) {
      s.phase = "toss";
      s.t = spec.tossTime;
      s.struckThis = false;
    }
  } else if (s.phase === "toss") {
    s.frame = A.attack[47];
    if (!s.struckThis) {
      s.struckThis = true;
      if (foe.heldBy === f) { foe.heldBy = null; foe.state = "IDLE"; }
      foe.takeHit(
        { damage: spec.damage, hitstun: spec.hitstun, knockback: spec.knockback },
        f.attackDir
      );
      if (foe.hp > 0) foe.knockdown(f.attackDir, spec.knockback, 320);
      AudioFX.hit();
      AudioFX.boom();
      f.camKick = Math.max(f.camKick, 0.7);
      Sparks.ring(foe.x, GROUND_Y - 60, 170);
      Sparks.dust(foe.x, GROUND_Y);
      Sparks.blood(foe.x, GROUND_Y - 80);
    }
    if (s.t <= 0) {
      s.phase = "recover";
      s.t = spec.recover;
    }
  } else {
    if (foe.heldBy === f) { foe.heldBy = null; if (foe.hp > 0) foe.state = "IDLE"; }
    s.frame = A.idle[0];
    if (s.t <= 0) endSpecial(f);
  }
}

function updateRock(f, foe, dt) {
  const spec = UROBOROS_SPECIALS.rock;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "startup") {
    s.frame = A.attack[49];
    if (Math.random() < 0.4) Sparks.dust(f.x, GROUND_Y);
    if (s.t <= 0) {
      s.phase = "slam";
      s.t = spec.slamTime;
      s.struckThis = false;
      AudioFX.roar();
    }
  } else if (s.phase === "slam") {
    s.frame = A.attack[47];
    if (!s.struckThis) {
      s.struckThis = true;
      const zx = f.x + f.attackDir * (spec.zone.reach + spec.zone.w / 2 - 40);
      const zone = { x: zx - spec.zone.w / 2, y: GROUND_Y - spec.zone.h, w: spec.zone.w, h: spec.zone.h };
      const contact = resolveStrike(f, foe,
        { damage: spec.damage, hitstun: spec.hitstun, knockback: spec.knockback, hitstop: spec.hitstop, level: spec.level, blockstun: spec.blockstun, blockPush: spec.blockPush, chip: spec.chip, hit: { w: 0, top: 0, h: 0 } }, zone);
      AudioFX.boom();
      f.camKick = Math.max(f.camKick, 0.7);
      Sparks.ring(zx, GROUND_Y - 60, 190);
      Sparks.dust(zx, GROUND_Y);
      Sparks.puff(zx, GROUND_Y - 40);
      if (contact) {
        if (contact.type === "hit") Sparks.blood(foe.x, GROUND_Y - 90);
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

function updateImpale(f, foe, dt) {
  const spec = UROBOROS_SPECIALS.impale;
  const s = f.special;
  const A = f.sprites;
  s.t -= dt;
  if (s.phase === "startup") {
    s.frame = A.attack[48];
    f.x += f.attackDir * (spec.lunge / spec.startup) * dt;
    clampArena(f);
    f.invulnT = Math.max(f.invulnT, 0.3);
    if (s.t <= 0) {
      const dx = foe.x - f.x;
      if (foe.hp > 0 && foe.grounded && foe.invulnT <= 0 &&
        Math.abs(dx) <= spec.range && (dx === 0 || Math.sign(dx) === f.attackDir)) {
        s.phase = "pierce";
        s.t = spec.pierceTime;
        foe.takeGrabbed(f);
        foe.holdT = spec.pierceTime + 0.6;
        foe.x = f.x + f.attackDir * 70;
        AudioFX.squelch();
      } else {
        s.phase = "recover";
        s.t = spec.recover;
        AudioFX.whiff();
      }
    }
  } else if (s.phase === "pierce") {
    s.frame = A.attack[50];
    foe.x = f.x + f.attackDir * 70;
    foe.holdT = Math.max(foe.holdT, 0.4);
    f.invulnT = Math.max(f.invulnT, 0.3);
    if (!s.struckThis) {
      s.struckThis = true;
      if (foe.heldBy === f) { foe.heldBy = null; foe.state = "IDLE"; }
      foe.takeHit(
        { damage: spec.pierce, hitstun: spec.pierceStun, knockback: spec.pierceKnock },
        f.attackDir
      );
      foe.vuln = true;
      if (typeof foe.applyDecay === "function") foe.applyDecay(DECAY.ticks);
      AudioFX.hit();
      AudioFX.snikt();
      f.camKick = Math.max(f.camKick, 0.6);
      Sparks.blood(foe.x, foe.y - 100);
      Sparks.hit(foe.x, foe.y - 100, f.attackDir);
      Sparks.ring(foe.x, foe.y - 100, 120);
    }
    if (s.t <= 0) {
      s.phase = "recover";
      s.t = spec.recover;
    }
  } else {
    if (foe.heldBy === f) { foe.heldBy = null; if (foe.hp > 0) foe.state = "IDLE"; }
    s.frame = A.idle[0];
    if (s.t <= 0) endSpecial(f);
  }
}
