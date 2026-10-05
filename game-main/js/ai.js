import { CHARACTERS } from "./characters/data.js";
import { BASE_HP, RAGE } from "./combat/data.js";
import { arena } from "./arena.js";
import { Missiles } from "./effects.js";

export const AI_PROFILE = Object.freeze({
  wesker: Object.freeze({
    retreatGap: 0,
    poke: Object.freeze({ min: 150, max: 260, move: "heavy", p: 0.12, easyP: 0.03 }),
    reach: Object.freeze({ min: 150, max: 260 }),
    heavyMix: true,
    approach: Object.freeze({ tool: "shadow", min: 220, max: 520, medium: 0.05, extreme: 0.12 }),
  }),
  homelander: Object.freeze({
    retreatGap: 0,
    poke: Object.freeze({ min: 150, max: 300, move: "dash", p: 0.15, easyP: 0.03 }),
    reach: Object.freeze({ min: 0, max: 0 }),
    heavyMix: false,
    approach: null,
  }),
  wolverine: Object.freeze({
    retreatGap: 0,
    poke: Object.freeze({ min: 110, max: 240, move: "heavy", p: 0.14, easyP: 0.03 }),
    reach: Object.freeze({ min: 0, max: 0 }),
    heavyMix: true,
    approach: null,
  }),
  hulk: Object.freeze({
    retreatGap: 0,
    poke: Object.freeze({ min: 150, max: 300, move: "heavy", p: 0.15, easyP: 0.03 }),
    reach: Object.freeze({ min: 0, max: 0 }),
    heavyMix: true,
    approach: null,
  }),
  ironman: Object.freeze({
    retreatGap: 170,
    poke: null,
    reach: Object.freeze({ min: 0, max: 0 }),
    heavyMix: false,
    approach: Object.freeze({ tool: "repulsor", min: 220, max: 520, medium: 0.12, extreme: 0.12 }),
  }),
  thor: Object.freeze({
    retreatGap: 0,
    poke: Object.freeze({ min: 150, max: 280, move: "heavy", p: 0.14, easyP: 0.03 }),
    reach: Object.freeze({ min: 150, max: 260 }),
    heavyMix: true,
    approach: null,
  }),
  doom: Object.freeze({
    retreatGap: 170,
    poke: Object.freeze({ min: 150, max: 280, move: "heavy", p: 0.14, easyP: 0.03 }),
    reach: Object.freeze({ min: 150, max: 260 }),
    heavyMix: true,
    approach: Object.freeze({ tool: "barrage", min: 260, max: 620, medium: 0.10, extreme: 0.14 }),
  }),
  spiderman: Object.freeze({
    retreatGap: 140,
    poke: Object.freeze({ min: 130, max: 260, move: "heavy", p: 0.13, easyP: 0.03 }),
    reach: Object.freeze({ min: 150, max: 260 }),
    heavyMix: true,
    approach: Object.freeze({ tool: "zip", min: 220, max: 520, medium: 0.05, extreme: 0.12 }),
  }),
  uroboros: Object.freeze({
    retreatGap: 0,
    poke: Object.freeze({ min: 150, max: 300, move: "heavy", p: 0.15, easyP: 0.03 }),
    reach: Object.freeze({ min: 150, max: 260 }),
    heavyMix: true,
    approach: null,
  }),
});

const THINK = Object.freeze({ easy: 0.38, medium: 0.20, extreme: 0.09 });
const MISTAKE = Object.freeze({ easy: 0.22, medium: 0.07, extreme: 0.003 });
const LINK = Object.freeze({ easy: 0.4, medium: 0.8, extreme: 1.0 });
const GUARD = Object.freeze({ easy: 0.30, medium: 0.65, extreme: 0.93 });

const BUSY = Object.freeze(["GRAB", "THROWN", "HITSTUN", "KDOWN", "KO", "SPECIAL"]);

// Missile-dodge read rate per difficulty (rest is a clean miss).
const MISSILE_DODGE = Object.freeze({ easy: 0.20, medium: 0.55, extreme: 0.985 });

// Nobody reacts on launch frame: the missile must be this old (seconds)
// before each brain even acknowledges it.
const MISSILE_REACT = Object.freeze({ easy: 0.28, medium: 0.15, extreme: 0.08 });

function rayActiveNow(foe) {
  return (foe.state === "ATTACK" && foe.attackMove && foe.attackMove.ray) ||
    (foe.state === "SPECIAL" && ["laser", "unibeam", "burst", "godblast"].includes(foe.specialId));
}

function foeCommitted(foe) {
  if (foe.state === "ATTACK" && foe.phase === "recovery") return true;
  if (foe.state === "KDOWN") return true;
  if (foe.state === "GRAB" && (foe.phase === "recover" || foe.phase === "toss")) return true;
  if (foe.state === "SPECIAL" && foe.special && foe.special.phase === "recover") return true;
  if (foe.state === "LAND") return true;
  return false;
}

export class AIController {
  constructor(diff = "medium", rng = Math.random) {
    this.diff = diff;
    this.rng = rng;
    this.thinkT = 0;
    this.dashCD = 0;
    this.jumpCD = 0;
    this.specialCD = 0;
    this.blitzCD = 0;
    this.fleeCD = 0;
    this.foeGuardStreak = 0;
    this.foeRayStreak = 0;
    this.foeAirStreak = 0;
    this.order = { move: 0, crouch: false, guard: false };
  }

  get reaction() {
    return THINK[this.diff] ?? THINK.medium;
  }

  update(dt, me, foe, ctx = null) {
    if (me.hp <= 0 || foe.hp <= 0) {

      me.moving = 0; me.crouchHeld = false; me.blockHeld = false;
      return;
    }
    if (me.freezeT > 0) {

      me.moving = 0; me.crouchHeld = false; me.blockHeld = false;
      return;
    }
    this.thinkT -= dt;
    this.dashCD -= dt;
    this.jumpCD -= dt;
    this.specialCD -= dt;
    this.blitzCD -= dt;
    this.fleeCD -= dt;
    if (foe.state === "BLOCK") this.foeGuardStreak += dt;
    else this.foeGuardStreak = 0;

    if (!foe.grounded) this.foeAirStreak += dt;
    else this.foeAirStreak = 0;

    if (rayActiveNow(foe)) this.foeRayStreak += dt;
    else this.foeRayStreak = 0;
    if (this.thinkT <= 0) {

      this.thinkT = this.reaction * (0.8 + this.rng() * 0.4);
      this.think(me, foe, ctx);
    }
    me.moving = this.order.move;
    me.crouchHeld = this.order.crouch;
    me.blockHeld = this.order.guard;
  }

  think(me, foe, ctx = null) {
    if (BUSY.includes(me.state)) return;
    const gap = Math.abs(foe.x - me.x);
    const toFoe = foe.x >= me.x ? 1 : -1;
    const R = this.rng;
    const prof = AI_PROFILE[me.kind] ?? AI_PROFILE.wesker;
    let move = 0, crouch = false, guard = false;

    if (ctx && ctx.side && (ctx.tagCD ?? 0) <= 0 && me.hp > 0 &&
      me.rage >= RAGE.PER_LEVEL / 2 && this.diff !== "easy") {
      const fullOf = (k) => Math.round(BASE_HP * CHARACTERS[k].stats.health);
      const benchHealthy = ctx.side.team.some((k, i) =>
        i !== ctx.side.idx && !ctx.side.dead[i] &&
        (ctx.side.hp[i] ?? fullOf(k)) > me.hp);
      const rotP = this.diff === "extreme" ? 0.5 : 0.2;
      if (me.hp / me.maxHp < 0.30 && benchHealthy && R() < rotP) me.queueTag("next");
      else if (ctx.ahead && (ctx.clock ?? 99) < 20 && benchHealthy &&
        me.hp / me.maxHp < 0.75 && R() < rotP) me.queueTag("next");
    }

    if (this.matchup(me, foe, gap, toFoe, R)) return;

    if (this.missileDodge(me, R)) return;

    const foeRay = (foe.state === "ATTACK" && foe.phase === "startup" && foe.grounded &&
      foe.attackMove && foe.attackMove.ray) ? "poke"
      : (foe.state === "SPECIAL" && foe.special && foe.special.phase === "startup" &&
      ["laser", "unibeam", "burst", "godblast"].includes(foe.specialId)) ? "super" : null;

    const streakMin = this.diff === "extreme" ? 0.5 : 1.0;
    const streaking = this.foeRayStreak > streakMin && rayActiveNow(foe);
    const sneakable = me.grounded &&
      (me.state === "IDLE" || me.state === "WALK" || me.state === "SNEAK" ||
       me.state === "CROUCH" || me.state === "BLOCK");
    if (((foeRay && gap > 200) || (streaking && gap > 150)) && sneakable) {

      const sneakP = this.diff === "extreme" ? 0.75
        : this.diff === "medium" ? (streaking ? 0.4 : (foeRay === "super" ? 0.25 : 0.0)) : 0.0;
      if (R() < sneakP) {
        this.order = { move: toFoe, crouch: true, guard: false };
        return;
      }
    }

    if (this.diff === "extreme" && (me.kind === "wesker" || me.kind === "cheatwesker") && typeof me.tryShadow === "function" &&
      me.grounded && me.hp > 0 && this.foeRayStreak > 0.8 &&
      (me.state === "IDLE" || me.state === "WALK" || me.state === "SNEAK" ||
       me.state === "CROUCH" || me.state === "BLOCK") &&
      gap > 150 && gap < 520 && this.blitzCD <= 0) {
      me.tryShadow(toFoe);
      this.blitzCD = 2.5;
      this.order = { move: 0, crouch: false, guard: false };
      return;
    }

    const foeSwing = foe.state === "ATTACK" && foe.phase === "startup" && foe.grounded;
    const foeCharging = foe.state === "SPECIAL" && gap < 420;

    const grabTell = foe.state === "GRAB" && foe.phase === "startup" && gap < 200;
    if ((foeSwing && gap < 320) || foeCharging || grabTell) {
      const incomingLaser = foe.state === "SPECIAL" && foe.specialId === "laser" &&
        foe.special && foe.special.phase === "startup";
      if (incomingLaser && this.diff === "extreme" && R() < 0.8) {
        crouch = true;
      } else if (grabTell && me.grounded &&
        (me.state === "IDLE" || me.state === "WALK") &&
        R() < (this.diff === "extreme" ? 0.7 : this.diff === "medium" ? 0.3 : 0.0)) {
        me.pressLight();
        move = 0;
      } else if (foe.kind === "wolverine" && foeSwing && gap < 200 && this.diff === "extreme" &&
        this.dashCD <= 0 && R() < 0.4) {
        me.queueDash(-toFoe);
        this.dashCD = 1.0;
      } else if (R() < GUARD[this.diff]) {
        guard = true;
        move = -toFoe;

        const lvl = foe.state === "ATTACK" ? foe.attackMove && foe.attackMove.level : "mid";
        crouch = lvl === "low";
      } else if (R() < 0.5) {
        guard = true;
        move = -toFoe;
        crouch = R() < 0.5;
      }

      const tackleIn = foe.state === "SPECIAL" && foe.specialId === "jaguar" &&
        foe.special && foe.special.phase === "dash" && gap < 220;
      const jumpP = this.diff === "extreme" ? 0.7 : this.diff === "medium" ? 0.25 : 0.05;
      if (tackleIn && this.jumpCD <= 0 && R() < jumpP) {
        me.queueJump();
        this.jumpCD = 1.0;
        guard = false;
        crouch = false;
      }
    } else if (foeCommitted(foe) || foe.state === "HITSTUN" || foe.state === "BLOCKSTUN") {

      const blitzStates = me.state === "IDLE" || me.state === "WALK" ||
        me.state === "SNEAK" || me.state === "CROUCH" || me.state === "BLOCK";
      const blitzP = this.diff === "extreme" ? 0.6 : this.diff === "medium" ? 0.25 : 0.0;
      if ((me.kind === "wesker" || me.kind === "cheatwesker") && typeof me.tryShadow === "function" &&
        me.grounded && blitzStates && gap > 200 && gap < 450 &&
        this.blitzCD <= 0 && R() < blitzP) {
        me.tryShadow(toFoe);
        this.blitzCD = 2.5;
      }
      this.strike(me, foe, gap, toFoe, R, true, prof);
      move = gap > 140 ? toFoe : 0;
    } else {

      if (this.openerSuper(me, foe, gap)) {
        this.order = { move: 0, crouch: false, guard: false };
      } else if (!me.grounded || !foe.grounded) {

        if (foe.grounded === false && me.grounded && foe.y < me.y - 120 && gap < 130 &&
          this.diff === "extreme" && this.dashCD <= 0) {
          me.queueDash(toFoe);
          this.dashCD = 1.0;
        }

        const airP = this.diff === "extreme" ? (this.foeAirStreak > 1.0 ? 0.6 : 0.3)
          : this.diff === "medium" ? 0.15 : 0.0;
        if (foe.grounded === false && me.grounded && gap < 160 && this.jumpCD <= 0 && R() < airP) {
          me.queueJump();
          this.jumpCD = 1.0;
        }
        move = toFoe;
        this.specials(me, foe, gap, R);
      } else {

        if (prof.retreatGap > 0 && gap < prof.retreatGap) {
          move = -toFoe;
          const backP = this.diff === "extreme" ? 0.4 : this.diff === "medium" ? 0.2 : 0.05;
          if (this.dashCD <= 0 && R() < backP) {
            me.queueDash(-toFoe);
            this.dashCD = 1.2;
          }
        } else if (gap > 320) {
          move = toFoe;
          const dashP = this.diff === "extreme" ? 0.5 : this.diff === "medium" ? 0.25 : 0.05;
          if (this.dashCD <= 0 && R() < dashP) {
            me.queueDash(toFoe);
            this.dashCD = 1.2;
          }
        } else if (gap > 150) {
          move = toFoe;
        } else if (gap < 85) {

          const foeCornered = this.diff === "extreme" &&
            (foe.x < 180 || foe.x > arena.width - 180);
          const backP = this.diff === "extreme" ? 0.3 : this.diff === "medium" ? 0.15 : 0.05;
          if (!foeCornered && this.dashCD <= 0 && R() < backP) {
            me.queueDash(-toFoe);
            this.dashCD = 1.2;
          } else {
            move = toFoe;
          }
        }
        if (gap < 150) this.strike(me, foe, gap, toFoe, R, false, prof);
        else if (prof.approach && prof.approach.tool === "repulsor" && typeof me.tryRepulsor === "function" &&
          me.grounded && gap > prof.approach.min && gap < prof.approach.max &&
          R() < (this.diff === "easy" ? 0.02 : 0.12)) {
          me.tryRepulsor();
        } else if (prof.approach && prof.approach.tool === "zip" && typeof me.tryWebZip === "function" &&
          (me.state === "IDLE" || me.state === "WALK") &&
          gap > prof.approach.min && gap < prof.approach.max &&
          R() < (this.diff === "easy" ? 0.0 : this.diff === "medium" ? prof.approach.medium : prof.approach.extreme)) {
          me.tryWebZip(toFoe);
        } else if (prof.approach && prof.approach.tool === "shadow" && typeof me.tryShadow === "function" &&
          (me.state === "IDLE" || me.state === "WALK") && me.grounded &&
          gap > prof.approach.min && gap < prof.approach.max &&
          R() < (this.diff === "easy" ? 0.0 : this.diff === "medium" ? prof.approach.medium : prof.approach.extreme)) {
          me.tryShadow(toFoe);
        } else if (prof.approach && prof.approach.tool === "photon" && typeof me.tryPhoton === "function" &&
          me.grounded && gap > prof.approach.min && gap < prof.approach.max &&
          R() < (this.diff === "easy" ? 0.02 : 0.12)) {
          me.tryPhoton();
        } else if (prof.approach && prof.approach.tool === "barrage" && typeof me.tryBarrage === "function" &&
          me.grounded && gap > prof.approach.min && gap < prof.approach.max &&
          R() < (this.diff === "easy" ? 0.0 : this.diff === "medium" ? prof.approach.medium : prof.approach.extreme)) {
          me.tryBarrage(foe);
        } else if (prof.poke && gap < prof.poke.max && gap > prof.poke.min &&
          (prof.poke.move !== "dash" || this.dashCD <= 0) &&
          R() < (this.diff === "easy" ? prof.poke.easyP : prof.poke.p)) {

          if (prof.poke.move === "heavy") me.pressHeavy();
          else { me.queueDash(toFoe); this.dashCD = 1.2; }
        }
        this.specials(me, foe, gap, R);
        }
      }

    if (!me.grounded && (me.state === "JUMP" || me.state === "FALL") &&
      Math.abs(foe.x - me.x) < 140 && me.y - foe.y < 160 && R() < 0.35) {
      me.pressLight();
    }
    if (R() < MISTAKE[this.diff]) {
      const m = R();
      if (m < 0.3) { guard = false; crouch = false; }
      else if (m < 0.5) { move = -toFoe; }
      else if (m < 0.7 && this.jumpCD <= 0) { me.queueJump(); this.jumpCD = 1; }
      else if (m < 0.9 && gap > 250) { me.pressLight(); }
      else { move = 0; }
    }

    this.order = { move, crouch, guard };
  }

  strike(me, foe, gap, toFoe, R, punish, prof = null) {
    const P = prof ?? AI_PROFILE[me.kind] ?? AI_PROFILE.wesker;
    if (me.state === "ATTACK") {
      if (me.attackMove && me.attackMove.chainTo &&
        (me.phase === "active" || me.phase === "recovery") && R() < LINK[this.diff]) {
        me.pressLight();
      }
      return;
    }
    if (me.state !== "IDLE" && me.state !== "WALK" && me.state !== "CROUCH" && me.state !== "SNEAK" && me.state !== "BLOCK") return;
    const foeTurtling = foe.state === "BLOCK" || foe.state === "BLOCKSTUN" || this.foeGuardStreak > 0.5;

    const cornered = this.diff === "extreme" &&
      (foe.x < 180 || foe.x > arena.width - 180);
    const grabP = (this.diff === "easy" ? 0.05 : this.diff === "medium" ? 0.15 : 0.22) +
      (foeTurtling ? 0.35 : 0) + (cornered ? 0.25 : 0);
    if (gap < 100 && R() < grabP) {
      me.pressGrab();
      return;
    }
    if (gap > 150 && !punish) return;
    if (punish && P.reach.max > 0 && gap >= P.reach.min && gap < P.reach.max && R() < 0.5) {
      me.pressHeavy();
      return;
    }

    const mix = R();

    if (foe.kind === "wolverine" && (foe.state === "ATTACK" || foe.state === "SPECIAL") && R() < 0.25) {
      if (this.dashCD <= 0) { me.queueDash(-toFoe); this.dashCD = 1.0; return; }
    }
    if (mix < 0.12 && gap < 100) me.pressGrab();
    else if (mix < 0.22 && P.heavyMix) me.pressHeavy();
    else me.pressLight();
  }

  missileDodge(me, R) {
    if (!me.grounded) { this.fleeCD = 0; return false; }
    // Sky blasts are slipped by a dash overlapping impact (dash lasts
    // 0.18s), so: sprint early for distance, dash late for the slip.
    // Dashing on sight would end long before the 0.5s missile lands.
    const DASH_AT = 0.17;
    let tx = null, best = Infinity;
    const radius = this.fleeCD > 0 ? 400 : 150;
    const react = MISSILE_REACT[this.diff] ?? 0.15;
    for (const m of Missiles.list) {
      const tti = m.fall - m.t;
      if (!(tti > 0 && tti <= 0.55)) continue;
      if (m.t < react) continue;
      if (Math.abs(m.tx - me.x) > radius) continue;
      if (tti < best) { best = tti; tx = m.tx; }
    }
    if (tx === null) { this.fleeCD = 0; return false; }
    const dir = me.x >= tx ? 1 : -1;
    this.fleeCD = 0.7;
    if (best > DASH_AT) {
      this.order = { move: dir, crouch: false, guard: false };
      return true;
    }
    if (this.dashCD <= 0) {
      if ((me.kind === "wesker" || me.kind === "cheatwesker") && typeof me.tryShadow === "function" &&
        this.blitzCD <= 0 && R() < 0.5) {
        me.tryShadow(dir);
        this.blitzCD = 2.5;
        this.order = { move: 0, crouch: false, guard: false };
        return true;
      }
      if (["IDLE", "WALK", "SNEAK", "CROUCH", "BLOCK"].includes(me.state)) {
        const rate = MISSILE_DODGE[this.diff] ?? 0.55;
        if (R() < rate) {
          me.queueDash(dir);
          this.dashCD = 1.0;
        }
      }
    }
    this.order = { move: dir, crouch: false, guard: false };
    return true;
  }

  matchup(me, foe, gap, toFoe, R) {
    const pro = this.diff === "extreme";
    const solid = pro || this.diff === "medium";

    if (pro && foe.kind === "hulk" && foe.state === "ATTACK" && foe.phase === "startup" &&
      gap < 220 && this.dashCD <= 0 && R() < 0.5) {
      me.queueDash(-toFoe);
      this.dashCD = 1.2;
      this.order = { move: 0, crouch: false, guard: false };
      return true;
    }

    if (foe.state === "ATTACK" && foe.phase === "recovery" &&
      foe.attackMove && foe.attackMove.ray && gap < 500 && gap > 120 &&
      this.dashCD <= 0 && solid &&
      R() < (this.diff === "extreme" ? 1.0 : 0.3)) {
      me.queueDash(toFoe);
      this.dashCD = 1.2;
      this.order = { move: 0, crouch: false, guard: false };
      return true;
    }

    if (pro && foe.kind === "homelander" && foe.state === "SPECIAL" && foe.specialId === "laser" &&
      foe.special && foe.special.phase === "recover" &&
      gap < 500 && gap > 120 && this.dashCD <= 0) {
      me.queueDash(toFoe);
      this.dashCD = 1.2;
      this.order = { move: 0, crouch: false, guard: false };
      return true;
    }

    if (pro && (foe.kind === "wesker" || foe.kind === "cheatwesker") && foe.state === "SPECIAL" && foe.specialId === "shadow" &&
      foe.special && foe.special.phase === "vanish" && gap < 170 && R() < 0.6) {
      me.pressLight();
      return true;
    }
    return false;
  }

  openerSuper(me, foe, gap) {
    if (this.specialCD > 0 || me.rageLevel < 1) return false;
    const lvl = me.rageLevel;
    if (foe.hp <= 32 && lvl >= 3 && gap < 380 && me.trySpecial("ragemode", foe)) {
      this.specialCD = 1.0;
      return true;
    }
    if (foe.hp <= 20 && lvl >= 1 && gap < 380 && gap > 150 && me.trySpecial("jaguar", foe)) {
      this.specialCD = 1.0;
      return true;
    }
    return false;
  }

  specials(me, foe, gap, R) {
    if (this.specialCD > 0 || me.rageLevel < 1) return;
    const lvl = me.rageLevel;
    const fire = (id) => {
      if (me.trySpecial(id, foe)) { this.specialCD = 1.0; return true; }
      return false;
    };
    const rate = this.diff === "extreme" ? 0.4 : this.diff === "medium" ? 0.25 : 0.05;
    if (lvl >= 2 && gap < 220 && R() < rate) { fire("phantom"); return; }
    if (lvl >= 1 && gap >= 150 && gap < 420 && R() < rate) { fire("jaguar"); return; }
    if (this.diff === "easy" && lvl >= 1 && gap < 220 && R() < 0.1) fire("jaguar");
  }
}

