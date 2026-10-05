import { SPRITE_SCALE, MOVE, GROUND_Y, SETTINGS } from "../config.js";
import { buildSprites, FEET_PAD } from "../render/sprites.js";
import { flipped } from "../render/pixel.js";
import { isCustomKind } from "../characters/custom.js";
import { integrateAir, clampArena } from "../physics.js";
import { BASE_HP, FRAME_FOR, movesFor, GRAB, RAGE, REGEN, WESKER_REGEN, UROBOROS_REGEN, BLEED, DECAY, SPIDERMAN_SPECIALS } from "../combat/data.js";
import { resolveStrike, grabCheck, vulnMult } from "../combat/combat.js";
import { tryWeskerSpecial, tryHomelanderSpecial, tryWolverineSpecial, tryWeskerShadow, tryHulkSpecial, tryIronmanSpecial, tryThorSpecial, tryUroborosSpecial, trySpidermanSpecial, trySpidermanZip, trySpidermanSwing, tryDoomSpecial, tryDoomPhoton, tryDoomSnap, tryDoomBot, tryDoomBarrage, updateSpecial } from "../combat/specials.js";
import { tryCustomSpecial, updateCustomSpecial } from "../combat/customSpecials.js";
import { AudioFX } from "../audio.js";
import { Sparks } from "../effects.js";
import { CHARACTERS } from "./data.js";

const SIZE = Object.freeze({ wesker: 1, cheatwesker: 1, homelander: 1, wolverine: 1, hulk: 1.32, uroboros: 1.32, spiderman: 1, doom: 1 });

const EDGE_IFRAMES = 0.25;

export const FState = Object.freeze({
  IDLE: "IDLE",
  WALK: "WALK",
  CROUCH: "CROUCH",
  SNEAK: "SNEAK",
  JUMP: "JUMP",
  FALL: "FALL",
  LAND: "LAND",
  DASH: "DASH",
  BACKDASH: "BACKDASH",
  DASHCHARGE: "DASHCHARGE",
  ATTACK: "ATTACK",
  SPECIAL: "SPECIAL",
  GRAB: "GRAB",
  THROWN: "THROWN",
  BLOCK: "BLOCK",
  HITSTUN: "HITSTUN",
  BLOCKSTUN: "BLOCKSTUN",
  KDOWN: "KDOWN",
  KO: "KO",
});

export class Fighter {
  constructor(kind, x, y) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.vy = 0;
    this.grounded = true;
    this.facing = 1;
    this.state = FState.IDLE;
    this.stateT = 0;
    this.dashDir = 1;
    this.animTime = Math.random() * 10;

    this.moving = 0;
    this.crouchHeld = false;
    this.blockHeld = false;
    this.blockLow = false;
    this.jumpQueued = false;
    this.dashQueued = 0;
    this.tagRequest = null;
    this.lastContact = null;
    this.freezeT = 0;
    this.kT = 0;
    this.crumple = false;
    this.clothP = 0;

    const st = CHARACTERS[kind].stats;
    this.maxHp = Math.round(BASE_HP * st.health);
    this.hp = this.maxHp;
    this.moves = movesFor(kind);
    this.speeds = {
      walk: MOVE.WALK_SPEED * st.moveSpeed,
      sneak: MOVE.SNEAK_SPEED * st.moveSpeed,
      air: MOVE.AIR_CONTROL * st.moveSpeed,
      dashFwd: MOVE.DASH_FWD_SPEED * st.moveSpeed,
      dashBack: MOVE.DASH_BACK_SPEED * st.moveSpeed,
    };
    this.attackId = null;
    this.phase = null;
    this.phaseT = 0;
    this.attackDir = 1;
    this.hasHit = false;
    this.chainQueued = false;
    this.knockVX = 0;
    this.victim = null;
    this.heldBy = null;
    this.holdT = 0;
    this.blockRetreating = false;

    this.rage = 0;
    this.rageFlash = 0;

    this.sinceDamageT = 99;
    this.bleedN = 0;
    this.bleedT = 0;
    this.decayN = 0;
    this.decayT = 0;
    this.vuln = false;
    this.rushLowT = 0;
    this.goreMarks = 0;

    this.specialId = null;
    this.special = null;
    this.invulnT = 0;
    this.weskerRaged = false;
    this.webT = 0;
    this.zipCD = 0;
    this.swingCD = 0;
    this.snapCD = 0;
    this.camKick = 0;
    this._sprites = buildSprites(kind);
    this._spritesRaged = kind === "cheatwesker" ? buildSprites(kind, true) : null;
  }

  // Wesker's level-3 rage is permanent: once he's gone mad his face stays
  // unmasked for the rest of the match, so swap in the enraged sprite set.
  get sprites() {
    return (this.kind === "cheatwesker") && this.weskerRaged && this._spritesRaged
      ? this._spritesRaged : this._sprites;
  }
  set sprites(v) { this._sprites = v; }

  enterWeskerRage() {
    if (this.weskerRaged) return;
    this.weskerRaged = true;
    if (this.kind === "cheatwesker") {
      for (const k of Object.keys(this.speeds)) this.speeds[k] *= 1.20;
    }
  }

  get w() { return 36 * SPRITE_SCALE * (SIZE[this.kind] ?? 1); }
  get h() { return 52 * SPRITE_SCALE * (SIZE[this.kind] ?? 1); }

  get isLow() {
    if (this.rushLowT > 0) return true;
    if (this.state === FState.CROUCH || this.state === FState.SNEAK) return true;
    if (this.state === FState.KDOWN) return true;
    if (this.state === FState.BLOCK) return this.blockLow;
    return false;
  }

  nearFoe(other) {
    return Math.abs(other.x - this.x) <= MOVE.GUARD_RANGE;
  }

  get attackMove() { return this.attackId ? this.moves[this.attackId] : null; }

  get rageLevel() {
    return Math.min(3, Math.floor(this.rage / RAGE.PER_LEVEL));
  }

  addRage(n) {
    const before = this.rageLevel;
    this.rage = Math.max(0, Math.min(RAGE.MAX, this.rage + n));
    if (this.rageLevel > before) {
      this.rageFlash = 0.6;
      AudioFX.levelUp();
    }
    return this.rage;
  }

  spendRage(levels) {
    if (this.rageLevel < levels) return false;
    this.rage = Math.max(0, this.rage - levels * RAGE.PER_LEVEL);
    return true;
  }

  applyBleed(n) {
    if (this.hp <= 0) return;
    this.bleedN = Math.max(this.bleedN, n);
    this.bleedT = BLEED.interval;
  }

  applyDecay(n) {
    if (this.hp <= 0) return;
    this.decayN = Math.max(this.decayN, n);
    this.decayT = DECAY.interval;
  }

  faceOpponent(other) {
    this.facing = other.x >= this.x ? 1 : -1;
  }

  queueJump() { this.jumpQueued = true; }
  queueDash(screenDir) { this.dashQueued = screenDir; }
  queueTag(which) { this.tagRequest = which; }

  pressLight() {
    if (this.hp <= 0 || this.freezeT > 0 || this.webT > 0) return;
    if (this.state === FState.ATTACK) {
      const mv = this.attackMove;
      if (mv && mv.chainTo && (!mv.chainWith || mv.chainWith === "light") && (this.phase === "active" || this.phase === "recovery")) {
        this.chainQueued = true;
      }
      return;
    }
    if (!this.grounded) {
      if (this.state === FState.JUMP || this.state === FState.FALL) this.startAttack("airLight");
      return;
    }
    if (this.state === FState.IDLE || this.state === FState.WALK) {
      this.startAttack("light1");
    } else if (this.state === FState.CROUCH || this.state === FState.SNEAK) {
      this.startAttack("crouchLight");
    }
  }

  pressHeavy() {
    if (this.hp <= 0 || this.freezeT > 0 || this.webT > 0) return;
    if (this.state === FState.ATTACK) {
      const mv = this.attackMove;
      if (mv && mv.chainTo && mv.chainWith === "heavy" && (this.phase === "active" || this.phase === "recovery")) {
        this.chainQueued = true;
      }
      return;
    }
    if (!this.grounded) {
      if (this.state !== FState.ATTACK &&
        (this.state === FState.JUMP || this.state === FState.FALL)) {
        this.startAttack("airHeavy");
      }
      return;
    }
    if (this.kind === "homelander") {
      if (this.state === FState.CROUCH || this.state === FState.SNEAK) {
        this.startAttack("crouchSweep");
      } else {
        this.pressGrab();
      }
      return;
    }
    if (this.state !== FState.ATTACK &&
      (this.state === FState.IDLE || this.state === FState.WALK ||
       this.state === FState.CROUCH || this.state === FState.SNEAK)) {
      this.startAttack("heavy");
    }
  }

  pressGrab() {
    if (this.hp <= 0 || this.freezeT > 0 || this.webT > 0) return;
    if (this.grounded &&
      (this.state === FState.IDLE || this.state === FState.WALK ||
       this.state === FState.CROUCH || this.state === FState.SNEAK)) {
      this.attackDir = this.facing;
      this.state = FState.GRAB;
      this.phase = "startup";
      this.phaseT = GRAB.startup;
      this.lungeLeft = GRAB.lunge;
      this.victim = null;
    }
  }

  trySamuraiEdge() {
    if ((this.kind !== "wesker" && this.kind !== "cheatwesker")) return false;
    if (this.hp <= 0 || this.freezeT > 0 || this.webT > 0 || !this.grounded) return false;
    if (this.state === FState.ATTACK) {
      if (this.attackId === "gun") return false;
      this.fireGun();
      return true;
    }
    switch (this.state) {
      case FState.IDLE:
      case FState.WALK:
      case FState.CROUCH:
      case FState.SNEAK:
      case FState.BLOCK:
      case FState.DASH:
      case FState.BACKDASH:
      case FState.LAND:
      case FState.HITSTUN:
      case FState.BLOCKSTUN:
        this.fireGun();
        return true;
      default:
        return false;
    }
  }

  fireGun() {
    this.startAttack("gun");
    this.invulnT = Math.max(this.invulnT, EDGE_IFRAMES);
    this.knockVX = 0;
    this.chainQueued = false;
  }

  tryRepulsor() {
    if (this.kind !== "ironman") return false;
    if (this.hp <= 0 || this.freezeT > 0 || this.webT > 0 || !this.grounded) return false;
    if (this.state === FState.ATTACK) {
      if (this.attackId === "repulsor") return false;
      this.startAttack("repulsor");
      return true;
    }
    switch (this.state) {
      case FState.IDLE:
      case FState.WALK:
      case FState.CROUCH:
      case FState.SNEAK:
      case FState.BLOCK:
      case FState.DASH:
      case FState.BACKDASH:
      case FState.LAND:
        this.startAttack("repulsor");
        return true;
      default:
        return false;
    }
  }

  tryHammer() {
    if (this.kind !== "thor") return false;
    if (this.hp <= 0 || this.freezeT > 0 || this.webT > 0 || !this.grounded) return false;
    if (this.state === FState.ATTACK) {
      if (this.attackId === "hammer") return false;
      this.startAttack("hammer");
      return true;
    }
    switch (this.state) {
      case FState.IDLE:
      case FState.WALK:
      case FState.CROUCH:
      case FState.SNEAK:
      case FState.BLOCK:
      case FState.DASH:
      case FState.BACKDASH:
      case FState.LAND:
        this.startAttack("hammer");
        return true;
      default:
        return false;
    }
  }

  tryPhoton() {
    if (this.kind !== "doom") return false;
    if (this.noSpecials || this.away) return false;
    return tryDoomPhoton(this);
  }
  tryBarrage(foe) {
    if (this.kind !== "doom") return false;
    if (this.noSpecials || this.away) return false;
    return tryDoomBarrage(this, foe);
  }
  trySnap(foe) {
    if (this.kind !== "doom") return false;
    if (this.away) return false;
    return tryDoomSnap(this, foe);
  }

  takeGrabbed(grabber) {
    this.attackId = null;
    this.phase = null;
    this.chainQueued = false;
    this.specialId = null;
    this.special = null;
    this.victim = null;
    this.knockVX = 0;
    this.state = FState.THROWN;
    this.heldBy = grabber;
    this.holdT = 0.8;
  }

  tryMissile() {
    if ((this.kind !== "wesker" && this.kind !== "cheatwesker") || this.hp <= 0 || this.freezeT > 0 || this.webT > 0) return false;
    if (!this.grounded || !this.weskerRaged) return false;
    if (this.state === "SPECIAL" || this.state === "KO" || this.state === "GRAB" ||
      this.state === "THROWN" || this.state === "ATTACK" || this.state === "HITSTUN" ||
      this.state === "BLOCKSTUN" || this.state === "KDOWN" || this.state === "JUMP" ||
      this.state === "FALL" || this.state === "DASHCHARGE") return false;
    if ((this.missileCD || 0) > 0) return false;
    this.missileCD = 1.4;
    this.attackId = null;
    this.phase = null;
    this.chainQueued = false;
    this.state = "SPECIAL";
    this.specialId = "missile";
    this.attackDir = this.facing;
    this.special = { phase: "throw", t: 0.22, mx: 0, my: 0, hit: false };
    return true;
  }

  tryShadow(screenDir) {
    if ((this.kind !== "wesker" && this.kind !== "cheatwesker")) return false;
    if (this.webT > 0) return false;
    return tryWeskerShadow(this, screenDir);
  }
  tryWebZip(screenDir) {
    if (this.kind !== "spiderman") return false;
    const dir = screenDir === undefined || screenDir === null
      ? (this.moving !== 0 ? this.moving : this.facing)
      : screenDir;
    return trySpidermanZip(this, dir >= 0 ? 1 : -1);
  }
  trySwing(screenDir) {
    if (this.kind !== "spiderman") return false;
    const dir = screenDir === undefined || screenDir === null
      ? (this.moving !== 0 ? this.moving : this.facing)
      : screenDir;
    return trySpidermanSwing(this, dir >= 0 ? 1 : -1);
  }  trySpecial(id, foe) {
    if (this.webT > 0) return false;
    // The Doom Bot has no specials at all -- SPACE, F and O are inert on it.
    if (this.noSpecials) return false;
    // Doom is away in the portal while his clone fights: no inputs at all.
    if (this.away) return false;
    if ((this.kind === "wesker" || this.kind === "cheatwesker")) return tryWeskerSpecial(this, id, foe);
    if (isCustomKind(this.kind)) return tryCustomSpecial(this, id, foe);
    if (this.kind === "wolverine") {
      const map = { jaguar: "rush", phantom: "barrage", ragemode: "ragemode" };
      return tryWolverineSpecial(this, map[id] || id, foe);
    }
    if (this.kind === "homelander") {
      const map = { jaguar: "laser", phantom: "scream", ragemode: "ragemode" };
      return tryHomelanderSpecial(this, map[id] || id, foe);
    }
    if (this.kind === "hulk") {
      const map = { jaguar: "gamma", phantom: "clap", ragemode: "breaker" };
      return tryHulkSpecial(this, map[id] || id, foe);
    }
    if (this.kind === "ironman") {
      const map = { jaguar: "burst", phantom: "unibeam", ragemode: "shelling" };
      return tryIronmanSpecial(this, map[id] || id, foe);
    }
    if (this.kind === "thor") {
      const map = { jaguar: "storm", phantom: "lightning", ragemode: "godblast" };
      return tryThorSpecial(this, map[id] || id, foe);
    }
    if (this.kind === "uroboros") {
      const map = { jaguar: "wrap", phantom: "rock", ragemode: "impale" };
      return tryUroborosSpecial(this, map[id] || id, foe);
    }
    if (this.kind === "spiderman") {
      const map = { jaguar: "webshot", phantom: "yank", ragemode: "maelstrom" };
      return trySpidermanSpecial(this, map[id] || id, foe);
    }
    if (this.kind === "doom") {
      // SPACE is the free plasma blast (a normal attack, no rage), E is the
      // orb barrage, F is the bot summon, O is the throne.
      if (id === "jaguar") { this.startAttack("photon"); return true; }
      if (id === "phantom") return tryDoomBot(this, foe);
      if (id === "ragemode") return tryDoomSpecial(this, "throne", foe);
      return tryDoomSpecial(this, id, foe);
    }
    return false;
  }

  startAttack(id) {
    this.attackId = id;
    this.attackDir = this.facing;
    this.state = FState.ATTACK;
    this.phase = "startup";
    this.phaseT = this.moves[id].startup;
    this.lungeLeft = this.moves[id].lunge;
    this.hasHit = false;
    this.rayFired = false;
    this.chainQueued = false;
  }

  takeHit(move, dir) {
    // Doom is inside the portal while his clone fights -- untargetable.
    if (this.away) return;
    const mult = vulnMult(this, move.heat);
    // Enraged Wesker shrugs off 7% of melee damage (rage abilities excluded).
    const ragedTank = this.weskerRaged && (this.kind === "wesker" || this.kind === "cheatwesker") && !move.rageAbility;
    this.hp = Math.max(0, this.hp - move.damage * mult * (ragedTank ? 0.93 : 1));
    this.sinceDamageT = 0;
    this.webT = 0;
    this.attackId = null;
    this.phase = null;
    this.chainQueued = false;
    this.specialId = null;
    this.special = null;
    this.victim = null;
    this.crumple = false;
    if (this.hp <= 0) {
      this.state = FState.KO;
      this.knockVX = 0;
      if (this.grounded) this.vy = 0;
      return;
    }
    this.state = FState.HITSTUN;
    this.stateT = move.hitstun;
    this.knockVX = dir * move.knockback;
  }

  knockdown(dir, push, pop = 0, slam = 0) {
    if (this.hp <= 0 || this.state === FState.KO) return;
    this.state = FState.KDOWN;
    this.knockVX = dir * push;
    if (pop > 0) {
      this.vy = -pop;
      this.grounded = false;
    } else if (slam > 0) {
      this.vy = slam;
      this.grounded = false;
    }
    this.kT = 0;
  }

  takeBlocked(move, dir) {
    if (this.away) return;
    this.webT = 0;
    this.attackId = null;
    this.phase = null;
    this.chainQueued = false;
    this.specialId = null;
    this.special = null;
    this.victim = null;
    this.crumple = false;
    const chip = move.chip || 0;
    if (chip > 0) {
      this.hp = Math.max(0, this.hp - chip);
      if (this.hp <= 0) {
        this.state = FState.KO;
        this.knockVX = 0;
        if (this.grounded) this.vy = 0;
        return;
      }
    }
    this.state = FState.BLOCKSTUN;
    this.stateT = move.blockstun;
    this.knockVX = dir * move.blockPush;
  }

  land() {
    this.state = FState.LAND;
    this.stateT = MOVE.LAND_LAG;
    AudioFX.land();
    Sparks.dust(this.x, GROUND_Y);
  }

  update(dt, opponent) {

    if (this.freezeT > 0) {
      this.freezeT -= dt;
      this.jumpQueued = false;
      this.dashQueued = 0;
      this.animTime += dt;
      clampArena(this);
      return;
    }
    if (this.webT > 0) this.webT -= dt;
    if (this.missileCD > 0) this.missileCD -= dt;
    if (this.zipCD > 0) this.zipCD -= dt;
    if (this.swingCD > 0) this.swingCD -= dt;
    if (this.snapCD > 0) this.snapCD -= dt;
    const webbed = this.webT > 0 && this.hp > 0;
    if (webbed) {
      this.jumpQueued = false;
      this.dashQueued = 0;
      this.tagRequest = null;
      this.moving = 0;
      this.blockHeld = false;
    }

    if (
      this.state !== FState.ATTACK &&
      this.state !== FState.SPECIAL &&
      this.state !== FState.GRAB &&
      this.state !== FState.THROWN &&
      this.state !== FState.HITSTUN &&
      this.state !== FState.BLOCKSTUN &&
      this.state !== FState.KDOWN &&
      this.state !== FState.KO
    ) {
      this.faceOpponent(opponent);
    }
    this.animTime += dt;

    this.sinceDamageT += dt;
    if (this.hp > 0 && this.hp < this.maxHp && this.sinceDamageT >= REGEN.delay && this.state !== FState.KO) {
      if (this.kind === "wolverine") {
        this.hp = Math.min(this.maxHp, this.hp + REGEN.rate * dt);
      } else if ((this.kind === "wesker" || this.kind === "cheatwesker") && this.sinceDamageT >= WESKER_REGEN.delay) {
        this.hp = Math.min(this.maxHp, this.hp + WESKER_REGEN.rate * dt);
      } else if (this.kind === "uroboros" && this.sinceDamageT >= UROBOROS_REGEN.delay) {
        this.hp = Math.min(this.maxHp, this.hp + UROBOROS_REGEN.rate * dt);
      }
    }

    if (this.bleedN > 0 && this.hp > 0) {
      this.bleedT -= dt;
      if (this.bleedT <= 0) {
        this.bleedT = BLEED.interval;
        this.bleedN -= 1;
        this.sinceDamageT = 0;
        this.hp = Math.max(0, this.hp - BLEED.per);
        Sparks.blood(this.x, this.y - 100);
        if (this.hp <= 0) { this.state = FState.KO; this.knockVX = 0; }
      }
    }
    if (this.decayN > 0 && this.hp > 0) {
      this.decayT -= dt;
      if (this.decayT <= 0) {
        this.decayT = DECAY.interval;
        this.decayN -= 1;
        this.sinceDamageT = 0;
        this.hp = Math.max(0, this.hp - DECAY.per);
        Sparks.blood(this.x, this.y - 100);
        Sparks.violet(this.x, this.y - 80);
        if (this.hp <= 0) { this.state = FState.KO; this.knockVX = 0; }
      }
    }
    if (this.rushLowT > 0) this.rushLowT -= dt;

    const runV = this.state === FState.DASH || this.state === FState.BACKDASH
      ? this.speeds.dashFwd
      : this.state === FState.WALK ? this.speeds.walk
      : this.state === FState.SNEAK ? this.speeds.sneak : 0;
    this.clothP += dt * (1.5 + Math.abs(this.vy) / 150 + runV / 140);
    if (this.rageFlash > 0) this.rageFlash -= dt;
    if (this.invulnT > 0) this.invulnT -= dt;
    const wantJump = this.jumpQueued;
    const wantDash = this.dashQueued;
    this.jumpQueued = false;
    this.dashQueued = 0;

    const startDash = () => {

      if ((this.kind === "wesker" || this.kind === "cheatwesker") && this.crouchHeld && this.grounded &&
        this.state !== "SPECIAL" && this.state !== "ATTACK") {
        if (this.tryShadow(wantDash)) return;
      }
      if (this.kind === "spiderman" && !this.grounded &&
        (this.state === "JUMP" || this.state === "FALL")) {
        if (this.trySwing(wantDash)) return;
      }
      const toward = opponent.x >= this.x ? 1 : -1;
      if ((this.kind === "wesker" || this.kind === "cheatwesker") && this.weskerRaged && this.grounded) {

        this.state = FState.DASHCHARGE;
        this.dashDir = wantDash === toward ? toward : -toward;
        this.stateT = 0.38;
        this.dashNext = wantDash === toward ? FState.DASH : FState.BACKDASH;
        Sparks.ring(this.x, this.y - 80, 70);
        AudioFX.whoosh();
        return;
      }
      if (wantDash === toward) {
        this.state = FState.DASH;
        this.dashDir = toward;
      } else {
        this.state = FState.BACKDASH;
        this.dashDir = -toward;
      }
      this.stateT = MOVE.DASH_TIME;
      AudioFX.whoosh();
      Sparks.dust(this.x, GROUND_Y);
    };

    switch (this.state) {
      case FState.ATTACK: {
        const mv = this.attackMove;
        this.phaseT -= dt;
        if (!this.grounded) {

          integrateAir(this, dt);
          if (this.grounded) {
            this.attackId = null;
            this.phase = null;
            this.chainQueued = false;
            this.land();
            break;
          }
        }
        if (this.phase === "startup" || this.phase === "active") {

          const want = (mv.lunge / (mv.startup + mv.active)) * dt;
          const step = Math.min(want, this.lungeLeft);
          this.x += this.attackDir * step;
          this.lungeLeft -= step;
          if (this.phase === "active" && mv.ray && !this.rayFired) {
            this.rayFired = true;
            if (this.attackId === "repulsor" || this.attackId === "photon") {

              AudioFX.repulsor();
              Sparks.muzzle(this.x + this.attackDir * 45, this.y - 117, this.attackDir);
            } else if (this.attackId === "hammer") {
              AudioFX.thunder();
              Sparks.muzzle(this.x + this.attackDir * 45, this.y - 125, this.attackDir);
            } else {
              AudioFX.shot();
              Sparks.muzzle(this.x + this.attackDir * 51, this.y - 130, this.attackDir);
            }
          }
          if (this.phase === "active" && !this.hasHit) {
            const contact = resolveStrike(this, opponent, mv);
            if (contact) {
              this.hasHit = true;
              if (this.kind === "uroboros" && contact.type === "hit") {
                // tentacle massacre: victim keeps bleeding holes, ground stays stained
                opponent.goreMarks = Math.min(6, (opponent.goreMarks || 0) + 1);
                Sparks.gore(opponent.x, opponent.y - 90);
                Sparks.pool(opponent.x, GROUND_Y);
                this.camKick = Math.max(this.camKick, 0.3);
              }
            }
            if (this.kind === "uroboros" && !this.hasHit) {
              // sweep trail: tentacle tip leaves a bloody streak mid-swing
              const tipX = this.x + this.attackDir * (mv.hit.w / 2 + 20);
              if (Math.random() < 0.6) Sparks.violet(tipX, this.y - 70 - Math.random() * 40);
              if (Math.random() < 0.3) Sparks.blood(tipX, this.y - 80);
            }
          }
        }
        if (this.phaseT <= 0) {
          if (this.phase === "startup") {
            this.phase = "active";
            this.phaseT = mv.active;
            if (this.kind === "wolverine") AudioFX.slash();
            if (this.kind === "uroboros") {
              AudioFX.whoosh();
              AudioFX.squelch();
              Sparks.slash(this.x + this.attackDir * (mv.hit.w / 2), this.y - 80, this.attackDir);
            }
          } else if (this.phase === "active") {
            if (!this.hasHit) AudioFX.whiff();
            this.phase = "recovery";
            this.phaseT = mv.recovery;
          } else if (this.chainQueued && mv.chainTo) {
            this.startAttack(mv.chainTo);
          } else {
            this.attackId = null;
            this.phase = null;

            this.state = this.grounded ? FState.IDLE : FState.FALL;
          }
        }
        break;
      }
      case FState.HITSTUN:
      case FState.BLOCKSTUN: {

        this.stateT -= dt;
        this.x += this.knockVX * dt;
        if (this.grounded) {

          this.knockVX *= Math.exp(-8 * dt);
          if (Math.abs(this.knockVX) < 5) this.knockVX = 0;
        } else {
          integrateAir(this, dt);
        }
        if (this.stateT <= 0) {
          if (!this.grounded) {

            this.knockVX = 0;
            this.state = FState.FALL;
          } else if (this.state === FState.BLOCKSTUN && this.crumple) {

            this.crumple = false;
            this.state = FState.KDOWN;
            this.kT = 0;
          } else {
            this.knockVX = 0;
            if (this.blockHeld) {

              this.state = FState.BLOCK;
              this.blockLow = this.crouchHeld;
            } else {
              this.state = FState.IDLE;
            }
          }
        }
        break;
      }
      case FState.KDOWN: {

        this.x += this.knockVX * dt;
        if (this.grounded) {
          this.knockVX *= Math.exp(-8 * dt);
          if (Math.abs(this.knockVX) < 5) this.knockVX = 0;
          this.kT += dt;
          if (this.kT >= MOVE.KDOWN_FALL + MOVE.KDOWN_TIME + MOVE.KDOWN_RISE) {
            this.knockVX = 0;
            this.state = FState.IDLE;
          }
        } else {
          integrateAir(this, dt);
          if (this.grounded) {
            this.kT = MOVE.KDOWN_FALL;
            this.knockVX *= 0.5;
            AudioFX.land();
            Sparks.dust(this.x, GROUND_Y);
          }
        }
        break;
      }
      case FState.KO: {
        if (!this.grounded) integrateAir(this, dt);
        break;
      }
      case FState.SPECIAL: {
        if (isCustomKind(this.kind)) updateCustomSpecial(this, opponent, dt);
        else updateSpecial(this, opponent, dt);
        break;
      }
      case FState.GRAB: {

        this.phaseT -= dt;
        const grabStep = Math.min((GRAB.lunge / (GRAB.startup + GRAB.active)) * dt, this.lungeLeft);
        if (this.phase === "startup") {
          this.x += this.attackDir * grabStep;
          this.lungeLeft -= grabStep;
          if (this.phaseT <= 0) {
            this.phase = "active";
            this.phaseT = GRAB.active;
          }
        } else if (this.phase === "active") {
          this.x += this.attackDir * grabStep;
          this.lungeLeft -= grabStep;
          if (grabCheck(this, opponent, GRAB.range)) {
            this.victim = opponent;
            opponent.takeGrabbed(this);
            AudioFX.grab();
            this.phase = "carry";
            this.phaseT = GRAB.carry;
          } else if (this.phaseT <= 0) {
            this.phase = "recover";
            this.phaseT = GRAB.recover;
            AudioFX.whiff();
          }
        } else if (this.phase === "carry") {

          if (this.victim) {
            this.victim.x = this.x + this.attackDir * 44;
            this.victim.y = Math.min(this.victim.y, GROUND_Y - 26);
          }
          if (this.phaseT <= 0) {

            if (this.victim) {
              const vx = this.victim.x, vy = this.victim.y - 90;

              const tossDmg = this.kind === "hulk" ? GRAB.damage + 4 : GRAB.damage;
              this.victim.takeHit(
                { damage: tossDmg, hitstun: GRAB.stun, knockback: GRAB.knockback },
                this.attackDir
              );
              this.victim.vy = -GRAB.tossUp;
              this.victim.grounded = false;
              this.addRage(RAGE.onDealHit);
              this.victim.addRage(RAGE.onTakeHit);
              Sparks.blood(vx, vy);
              this.victim = null;
            }
            AudioFX.hit();
            this.camKick = Math.max(this.camKick, 0.3);
            this.phase = "toss";
            this.phaseT = GRAB.toss;
          }
        } else {
          if (this.phaseT <= 0) {
            this.phase = null;
            this.victim = null;
            this.state = FState.IDLE;
          }
        }
        break;
      }
      case FState.THROWN: {

        this.holdT -= dt;
        if (this.holdT <= 0 || !this.heldBy ||
          (this.heldBy.state !== FState.GRAB && this.heldBy.state !== FState.SPECIAL)) {
          this.heldBy = null;
          this.state = FState.IDLE;
        }
        break;
      }
      case FState.BLOCK: {

        this.blockLow = this.crouchHeld;
        if (wantJump) {
          this.state = FState.JUMP;
          this.stateT = MOVE.JUMP_STARTUP;
          this.blockRetreating = false;
        } else if (wantDash) {
          startDash();
          this.blockRetreating = false;
        } else if (!this.grounded || !this.blockHeld) {
          this.blockRetreating = false;
          if (this.crouchHeld) {
            this.state = this.moving !== 0 ? FState.SNEAK : FState.CROUCH;
          } else {
            this.state = this.moving !== 0 ? FState.WALK : FState.IDLE;
          }
        } else {
          const toward = opponent.x >= this.x ? 1 : -1;
          if (this.moving === -toward) {
            this.blockRetreating = !this.blockLow;
            this.x += this.moving * this.speeds.walk * MOVE.BACKPEDAL_MULT * dt;
          } else {
            this.blockRetreating = false;
          }
        }
        break;
      }
      case FState.JUMP: {
        if (this.grounded) {
          this.stateT -= dt;
          if (wantDash) startDash();
          else if (this.stateT <= 0) {
            this.vy = -MOVE.JUMP_VEL;
            this.grounded = false;
            Sparks.dust(this.x, GROUND_Y);
          }
        } else {
          if (wantDash && this.kind === "spiderman") { startDash(); break; }
          if (this.moving !== 0) this.x += this.moving * this.speeds.air * dt;
          integrateAir(this, dt);
          if (this.vy >= 0) this.state = FState.FALL;
          if (this.grounded) this.land();
        }
        break;
      }
      case FState.FALL: {
        if (wantDash && this.kind === "spiderman") { startDash(); break; }
        if (this.moving !== 0) this.x += this.moving * this.speeds.air * dt;
        integrateAir(this, dt);
        if (this.grounded) this.land();
        break;
      }
      case FState.LAND: {
        this.stateT -= dt;
        if (this.stateT <= 0) this.state = FState.IDLE;
        break;
      }
      case FState.DASHCHARGE: {

        this.stateT -= dt;
        if (Math.random() < 0.5) Sparks.ember(this.x + (Math.random() - 0.5) * 50, this.y - Math.random() * 130);
        if (this.stateT <= 0) {
          this.state = this.dashNext || FState.DASH;
          this.stateT = MOVE.DASH_TIME;
          AudioFX.whoosh();
          Sparks.dust(this.x, GROUND_Y);
        }
        break;
      }
      case FState.DASH:
      case FState.BACKDASH: {
        const speed = this.state === FState.DASH ? this.speeds.dashFwd : this.speeds.dashBack;
        this.x += this.dashDir * speed * dt;
        this.stateT -= dt;

        if (this.stateT <= 0) this.state = this.grounded ? FState.IDLE : FState.FALL;
        break;
      }
      default: {
        if (wantJump) {
          this.state = FState.JUMP;
          this.stateT = MOVE.JUMP_STARTUP;
        } else if (wantDash) {
          startDash();
        } else if (this.blockHeld) {

          this.state = FState.BLOCK;
          this.blockLow = this.crouchHeld;
        } else if (this.crouchHeld) {
          if (this.moving !== 0) {
            this.state = FState.SNEAK;
            this.x += this.moving * this.speeds.sneak * dt;
          } else {
            this.state = FState.CROUCH;
          }
        } else if (this.moving !== 0) {
          this.state = FState.WALK;

          const toward = opponent.x >= this.x ? 1 : -1;
          const mult = this.moving === -toward ? MOVE.BACKPEDAL_MULT : 1;
          this.x += this.moving * this.speeds.walk * mult * dt;
        } else {
          this.state = FState.IDLE;
        }
        break;
      }
    }

    if (!this.grounded) {
      if (this.state === FState.IDLE || this.state === FState.WALK ||
        this.state === FState.CROUCH || this.state === FState.SNEAK ||
        this.state === FState.DASH || this.state === FState.BACKDASH ||
        this.state === FState.BLOCK || this.state === FState.LAND) {
        this.state = FState.FALL;
      }
    }
    clampArena(this);
  }

  airFrame(s) {
    if (this.vy < -150) return s.jump[1];
    if (this.vy > 150) {
      if (this.vy > 500) return Math.floor(this.clothP * 6) % 2 ? s.jump[4] : s.jump[3];
      return s.jump[3];
    }
    return s.jump[2];
  }

  currentFrame() {
    const s = this.sprites;
    switch (this.state) {
      case FState.ATTACK: {

        const kit = FRAME_FOR[this.kind] ?? (isCustomKind(this.kind) ? FRAME_FOR.custom : FRAME_FOR.wesker);
        const fr = kit[this.attackId] ?? kit.light1;
        if (this.kind === "spiderman" && this.phase === "active") {
          const flick = Math.floor(this.animTime * 14) % 2 === 0;
          const alt = fr.recovery === fr.active ? fr.startup : fr.recovery;
          const idx = flick ? fr.active : alt;
          return s.attack[idx] ?? s.attack[fr.active];
        }
        const idx = this.phase === "startup" ? fr.startup
          : this.phase === "active" ? fr.active : fr.recovery;
        return s.attack[idx];
      }
      case FState.WALK:
        return s.walk[Math.floor(this.animTime * 8) % s.walk.length];
      case FState.CROUCH:
        return s.crouch[Math.floor(this.animTime * 3) % s.crouch.length];
      case FState.SNEAK:
        return s.sneak[Math.floor(this.animTime * 6) % s.sneak.length];
      case FState.JUMP:
        return this.grounded ? s.jump[0] : this.airFrame(s);
      case FState.FALL:
        return this.airFrame(s);
      case FState.LAND:
        return s.jump[0];
      case FState.HITSTUN:
        return s.jump[3];
      case FState.KDOWN: {

        if (!this.grounded) return s.jump[3];
        const F = MOVE.KDOWN_FALL, L = MOVE.KDOWN_TIME, R = MOVE.KDOWN_RISE;
        const e = this.kT || 0;
        let i;
        if (e < F) i = Math.min(3, Math.floor((e / F) * 4));

        else if (e < F + L) i = 4 + Math.min(3, Math.floor(((e - F) / L) * 4));
        else i = 8 + Math.min(3, Math.floor(((e - F - L) / R) * 4));
        return s.kdown[i];
      }
      case FState.SPECIAL:

        return (this.special && this.special.frame) || s.idle[0];
      case FState.GRAB:

        if (this.phase === "toss") {
          if (this.kind === "hulk") return s.attack[27];
          return this.kind === "homelander" ? s.strain[0] : s.attack[5];
        }
        return s.grab[0];
      case FState.THROWN:
        return s.jump[1];
      case FState.BLOCK:
      case FState.BLOCKSTUN: {
        if (this.blockLow) return s.block[1];

        if (this.state === FState.BLOCK && this.blockRetreating && s.block.length >= 4) {
          return s.block[3 - (Math.floor(this.animTime * 5) % 2)];
        }
        return s.block[0];
      }
      case FState.KO:
        return s.crouch[1];
      case FState.DASH:
      case FState.BACKDASH:
      case FState.DASHCHARGE:
        return s.dash[Math.floor(this.animTime * 16) % s.dash.length];
      default:
        return s.idle[Math.floor(this.animTime * 3) % s.idle.length];
    }
  }

  draw(ctx, camX) {
    const frame = this.currentFrame();

    const spun = this.kind === "wolverine" && SETTINGS.wolvieSpin &&
      this.state === FState.ATTACK && (this.phase === "active" || this.phase === "recovery");
    const spideySpin = this.kind === "spiderman" && this.state === FState.ATTACK &&
      (this.attackId === "light2" || this.attackId === "heavy" || this.attackId === "airLight") &&
      this.phase === "active" && Math.floor(this.animTime * 14) % 2 === 1;
    const face = spun || spideySpin ? -this.facing : this.facing;
    const img = face === 1 ? frame : flipped(frame);

    const stunned = this.state === FState.HITSTUN || this.state === FState.BLOCKSTUN;
    const judder = stunned ? Math.round(Math.sin(this.animTime * 90) * 2) : 0;
    const spideyLift = this.kind === "spiderman" && this.state === FState.ATTACK &&
      (this.phase === "active" || this.phase === "recovery") &&
      (this.attackId === "light2" || this.attackId === "heavy" || this.attackId === "light1") ? 8 : 0;
    const dx = Math.round(this.x - camX - this.w / 2) + judder;
    const dy = Math.round(this.y - this.h + FEET_PAD * SPRITE_SCALE) - spideyLift;
    const charging = this.state === FState.DASHCHARGE && this.weskerRaged;
    const hurling = this.state === FState.SPECIAL && this.specialId === "missile" &&
      this.special && (this.special.phase === "throw" || this.special.phase === "fly");
    if (hurling) {

      ctx.save();
      ctx.translate(dx + this.w / 2, dy + this.h - FEET_PAD * SPRITE_SCALE);
      ctx.rotate(this.attackDir * 0.16);
      ctx.translate(-(dx + this.w / 2), -(dy + this.h - FEET_PAD * SPRITE_SCALE));
    }
    if (charging) {

      const pulse = 0.5 + 0.5 * Math.sin(this.animTime * 20);
      ctx.save();
      ctx.globalAlpha = 0.35 + pulse * 0.25;
      ctx.fillStyle = "#ff2a1a";
      ctx.beginPath();
      ctx.ellipse(dx + this.w / 2, dy + this.h * 0.6, this.w * (0.5 + pulse * 0.15), this.h * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      try { ctx.filter = "brightness(0) saturate(100%) invert(18%) sepia(100%) saturate(700%) hue-rotate(-30deg)"; } catch { /* no filter support */ }
    }
    ctx.drawImage(img, dx, dy, this.w, this.h);
    if (charging) ctx.filter = "none";
    if (hurling) ctx.restore();
    this.drawGore(ctx, dx, dy);
    this.drawWebs(ctx, dx, dy);
  }

  drawWebs(ctx, dx, dy) {
    if (!(this.webT > 0) || this.state === "KO") return;
    const fade = this.webT < 0.2 ? 0.5 : 1;
    ctx.save();
    ctx.globalAlpha = fade;
    const u = Math.max(2, Math.round(this.w / 48));
    const bands = [
      [0.30, 0.30, 0.40, 2], [0.32, 0.42, 0.36, 2], [0.30, 0.54, 0.40, 2],
      [0.36, 0.18, 0.28, 2], [0.44, 0.30, 2, 10],
    ];
    for (const [fx, fy, fw, fh] of bands) {
      const bx = Math.round(dx + this.w * fx);
      const by = Math.round(dy + this.h * fy);
      const bw = fw < 5 ? Math.round(this.w * fw) : fw * u;
      const bh = fh * u;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = "#9fd4ff";
      ctx.fillRect(bx, by + Math.max(1, bh - 1), bw, 1);
      ctx.fillStyle = "#5a6a7a";
      for (let sx = 2; sx < bw - 1; sx += 4) ctx.fillRect(bx + sx, by, 1, bh);
    }
    ctx.restore();
  }

  drawGore(ctx, dx, dy) {
    // persistent wound pits: victims scarred by uroboros keep holes; uroboros
    // itself festers as it loses HP. Deterministic spots so they don't crawl.
    let marks = Math.min(6, this.goreMarks || 0);
    if (this.kind === "uroboros" && this.hp < this.maxHp) {
      marks = Math.max(marks, Math.min(3, Math.ceil((1 - this.hp / this.maxHp) * 3)));
    }
    if (marks <= 0 || this.state === "KO") return;
    const SPOTS = [
      [0.44, 0.34, 3], [0.58, 0.44, 2], [0.48, 0.55, 3],
      [0.56, 0.30, 2], [0.42, 0.47, 2], [0.52, 0.62, 3],
    ];
    const u = Math.max(2, Math.round(this.w / 48));
    for (let i = 0; i < Math.min(marks, SPOTS.length); i++) {
      let [fx, fy, r] = SPOTS[i];
      if (this.facing === -1) fx = 1 - fx;
      const px = Math.round(dx + this.w * fx);
      const py = Math.round(dy + this.h * fy);
      const s = r >= 3 ? u + 1 : u;
      ctx.fillStyle = "#0b0b10";
      ctx.fillRect(px - s, py - s, s * 2, s * 2);
      ctx.fillStyle = "#c01414";
      ctx.fillRect(px - s, py - s, s * 2, 1);
      ctx.fillRect(px - s, py + s - 1, s * 2, 1);
      ctx.fillRect(px - s, py - s, 1, s * 2);
      ctx.fillRect(px + s - 1, py - s, 1, s * 2);
      if (this.kind === "uroboros") {
        ctx.fillStyle = "#ff7a1a";
        ctx.fillRect(px, py, 1, 1);
      }
      // drip below deep holes
      if (r >= 3) {
        ctx.fillStyle = "#7a1016";
        ctx.fillRect(px, py + s, 1, s + 2);
      }
    }
  }
}

