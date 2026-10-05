// Team relay + best-of-3 match logic (pure, headless-testable).
// Format: each side fields an ordered team (1-3 fighters). One fighter per
// side is active; a KO tags in the loser's next member (winner keeps current
// HP — clean wins snowball). The round ends when one team is eliminated or
// the timer expires; first side to `target` round wins takes the match.
//
// JS concept vs Python: factory functions returning dicts (like
// dataclasses) — no classes needed since main.js owns the Fighter objects
// and only asks this module who fights next / who won.
export const TEAM_SIZES = Object.freeze([1, 2, 3]);
export const ROUND_TARGET = 2; // best-of-3: first to 2 round wins
export const ROUND_TIME = 99;  // seconds per round (relay needs room)

import { CHARACTERS } from "./characters/data.js";
import { BASE_HP } from "./combat/data.js";

export function fullHp(kind) {
  return Math.round(BASE_HP * CHARACTERS[kind].stats.health);
}

export function createMatch(p1team, p2team, target = ROUND_TARGET) {
  const side = (team) => ({
    team: [...team], idx: 0, wins: 0,
    dead: team.map(() => false), // KO'd members never return
    hp: team.map(() => null),    // stored HP per member (null = full, fresh)
    rage: team.map(() => 0),     // stored rage per member
  });
  return {
    p1: side(p1team),
    p2: side(p2team),
    round: 1,
    target,
    tagCD: { p1: 0, p2: 0 }, // anti-oscillation lock after a manual tag
    over: false,
    winner: null, // "p1" | "p2" | "draw"
  };
}

// Kind of the currently active fighter for a side.
export function activeKind(side) {
  return side.team[Math.min(side.idx, side.team.length - 1)];
}

// Members still on the bench (alive, not active — tag targets + HUD).
export function benchKinds(side) {
  return side.team.filter((k, i) => i !== side.idx && !side.dead[i]);
}

// Alive member indices other than the active one.
export function aliveOthers(side) {
  const out = [];
  for (let i = 0; i < side.team.length; i++) {
    if (i !== side.idx && !side.dead[i]) out.push(i);
  }
  return out;
}

// Manual-tag target: "next" = first alive member after the active one
// (wrapping); "alt" = the alive member that ISN'T the next one (trio: jump
// straight to the third fighter). Returns -1 when nobody is available.
export function tagTarget(side, which) {
  const others = aliveOthers(side);
  if (others.length === 0) return -1;
  const after = others.filter((i) => i > side.idx);
  const next = after.length > 0 ? after[0] : others[0];
  if (which !== "alt") return next;
  const alt = others.find((i) => i !== next);
  return alt ?? next;
}

// Persist / restore a member's HP + rage across manual tags.
export function saveSlot(side, hp, rage) {
  side.hp[side.idx] = hp;
  side.rage[side.idx] = rage;
}

export function loadSlot(side, idx) {
  const kind = side.team[idx];
  return {
    hp: side.hp[idx] ?? fullHp(kind),
    rage: side.rage[idx] ?? 0,
  };
}

// Resolve a KO against `loser` ("p1" | "p2"). The corpse is marked dead and
// the next alive member tags in (relay order, wrapping past scrambled manual
// tags). Returns "tag", or the round winner side when none remain.
export function onKO(m, loser) {
  const side = m[loser];
  side.dead[side.idx] = true;
  side.hp[side.idx] = 0;
  side.rage[side.idx] = 0;
  for (let k = 1; k <= side.team.length; k++) {
    const i = (side.idx + k) % side.team.length;
    if (!side.dead[i]) {
      side.idx = i;
      return "tag";
    }
  }
  return loser === "p1" ? "p2" : "p1"; // eliminated: other side takes the round
}

// Award a round to `winner` ("p1" | "p2" | "draw"). Draws replay the round
// with no points. Returns "match" when someone hits target, else "next".
export function awardRound(m, winner) {
  if (winner === "draw") return "next";
  m[winner].wins += 1;
  if (m[winner].wins >= m.target) {
    m.over = true;
    m.winner = winner;
    return "match";
  }
  m.round += 1;
  for (const key of ["p1", "p2"]) {
    m[key].idx = 0;
    m[key].dead = m[key].team.map(() => false);
    m[key].hp = m[key].team.map(() => null);
    m[key].rage = m[key].team.map(() => 0);
  }
  m.tagCD = { p1: 0, p2: 0 };
  return "next";
}

// Timer expiry: compare active-fighter HP fractions; tiebreak = fuller bench
// (more reserves, then higher reserve count wins); dead tie = draw (replay).
export function timeoutWinner(aFrac, bFrac, aBench, bBench) {
  if (aFrac > bFrac) return "p1";
  if (bFrac > aFrac) return "p2";
  if (aBench !== bBench) return aBench > bBench ? "p1" : "p2";
  return "draw";
}
