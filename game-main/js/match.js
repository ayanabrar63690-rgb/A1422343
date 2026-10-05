export const TEAM_SIZES = Object.freeze([1, 2, 3]);
export const ROUND_TARGET = 2;
export const ROUND_TIME = 99;

import { CHARACTERS } from "./characters/data.js";
import { BASE_HP } from "./combat/data.js";
import { isUroborosUnlocked, isCheatWeskerUnlocked } from "./ui/unlock.js";
import { isUroborosBanned } from "./net/gate.js";

const EDGE = Object.freeze({
  wesker: Object.freeze({ wesker: 0, homelander: 1, wolverine: 0, hulk: -2, ironman: 2, thor: 1, uroboros: 0 }),
  homelander: Object.freeze({ wesker: -1, homelander: 0, wolverine: 1, hulk: -1, ironman: -1, thor: -1, uroboros: 0 }),
  wolverine: Object.freeze({ wesker: 0, homelander: -1, wolverine: 0, hulk: -2, ironman: 1, thor: 0, uroboros: 0 }),
  hulk: Object.freeze({ wesker: 2, homelander: 1, wolverine: 2, hulk: 0, ironman: -2, thor: 0, uroboros: 0 }),
  ironman: Object.freeze({ wesker: -2, homelander: 1, wolverine: -1, hulk: 2, ironman: 0, thor: -1, uroboros: 0 }),
  thor: Object.freeze({ wesker: -1, homelander: 1, wolverine: 0, hulk: 0, ironman: 1, thor: 0, uroboros: 0, doom: 0 }),
  doom: Object.freeze({ wesker: 0, homelander: 1, wolverine: 0, hulk: 1, ironman: 0, thor: 0, uroboros: 0, doom: 0 }),
  spiderman: Object.freeze({ wesker: 0, homelander: 1, wolverine: 0, hulk: 1, ironman: 0, thor: 0, uroboros: 0 }),
  uroboros: Object.freeze({ wesker: 0, homelander: 0, wolverine: 0, hulk: 0, ironman: 0, thor: 0, uroboros: 0 }),
});

function edge(a, b) {
  return EDGE[a]?.[b] ?? 0;
}

export function draftCounterTeam(foeTeam, size) {
  const unlocked = isUroborosUnlocked() && !isUroborosBanned();
  const kinds = Object.keys(CHARACTERS).filter((k) => (k !== "uroboros" || unlocked) && (k !== "cheatwesker" || isCheatWeskerUnlocked()));
  const picked = [];
  for (let i = 0; i < size; i++) {
    const foe = foeTeam[i % foeTeam.length];
    const best = kinds
      .filter((k) => !picked.includes(k))
      .sort((a, b) => (edge(b, foe) - edge(a, foe)) || (kinds.indexOf(a) - kinds.indexOf(b)))[0];
    picked.push(best ?? kinds[i % kinds.length]);
  }
  return picked;
}

export function fullHp(kind) {
  return Math.round(BASE_HP * CHARACTERS[kind].stats.health);
}

export function createMatch(p1team, p2team, target = ROUND_TARGET) {
  const side = (team) => ({
    team: [...team], idx: 0, wins: 0,
    dead: team.map(() => false),
    hp: team.map(() => null),
    rage: team.map(() => 0),
    vuln: team.map(() => false),
  });
  return {
    p1: side(p1team),
    p2: side(p2team),
    round: 1,
    target,
    tagCD: { p1: 0, p2: 0 },
    over: false,
    winner: null,
  };
}

export function activeKind(side) {
  return side.team[Math.min(side.idx, side.team.length - 1)];
}

export function benchKinds(side) {
  return side.team.filter((k, i) => i !== side.idx && !side.dead[i]);
}

export function aliveOthers(side) {
  const out = [];
  for (let i = 0; i < side.team.length; i++) {
    if (i !== side.idx && !side.dead[i]) out.push(i);
  }
  return out;
}

export function tagTarget(side, which) {
  const others = aliveOthers(side);
  if (others.length === 0) return -1;
  const after = others.filter((i) => i > side.idx);
  const next = after.length > 0 ? after[0] : others[0];
  if (which !== "alt") return next;
  const alt = others.find((i) => i !== next);
  return alt ?? next;
}

export function saveSlot(side, hp, rage, vuln = false) {
  side.hp[side.idx] = hp;
  side.rage[side.idx] = rage;
  side.vuln[side.idx] = !!vuln;
}

export function loadSlot(side, idx) {
  const kind = side.team[idx];
  return {
    hp: side.hp[idx] ?? fullHp(kind),
    rage: side.rage[idx] ?? 0,
    vuln: side.vuln[idx] ?? false,
  };
}

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
  return loser === "p1" ? "p2" : "p1";
}

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

export function timeoutWinner(aFrac, bFrac, aBench, bBench) {
  if (aFrac > bFrac) return "p1";
  if (bFrac > aFrac) return "p2";
  if (aBench !== bBench) return aBench > bBench ? "p1" : "p2";
  return "draw";
}

