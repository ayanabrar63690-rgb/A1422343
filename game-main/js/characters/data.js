// Static character data. M7 will add speed/damage/health modifiers here —
// for M1 this is identity + colors only (no magic numbers elsewhere).
// JS concept vs Python: `Object.freeze` ≈ a read-only dict; it prevents
// accidental mutation of shared config at runtime.
export const CHARACTERS = Object.freeze({
  wesker: Object.freeze({
    id: "wesker",
    name: "WESKER",
    title: "The Betrayer",
    desc: "Black coat • sunglasses • superhuman swagger",
    accent: "#ff3030",
    // M7 base stats, stored as multipliers over the shared tables.
    // attackSpeed divides the fighter's own startup/active/recovery only
    // (stun dealt, reach, and lunge distance are untouched). moveSpeed
    // scales walk/sneak/air-drift/dash (jump arc stays shared on purpose).
    stats: Object.freeze({
      attackSpeed: 1.30, // +30% faster LMB/RMB — the speedster
      moveSpeed: 1.35,   // +35% faster movement — fastest on roster by far
      damage: 0.90,      // -10% MELEE damage only (gun/specials unscaled, see movesFor)
      health: 1.00,      // +0% health — fastest, frailest, lightest per button
    }),
  }),
  homelander: Object.freeze({
    id: "homelander",
    name: "HOMELANDER",
    title: "The Patriot",
    desc: "Blue suit • red cape • golden eagle",
    accent: "#3e6bff",
    stats: Object.freeze({
      attackSpeed: 1.00, // +0% attack speed
      moveSpeed: 1.00,   // +0% movement
      damage: 1.15,      // +15% melee damage (post-Samurai-Edge compensation)
      health: 1.10,      // +10% health
    }),
  }),
  wolverine: Object.freeze({
    id: "wolverine",
    name: "WOLVERINE",
    title: "The Best There Is",
    desc: "Yellow suit • black mask • adamantium claws",
    accent: "#ffd23e",
    // Rushdown regenerator: fastest hands, short reach, chip+bleed tax.
    stats: Object.freeze({
      attackSpeed: 1.25, // +25% faster normals
      moveSpeed: 1.10,   // +10% movement
      damage: 1.08,      // +8% attack damage
      health: 0.95,      // -5% health (regen sustains instead)
    }),
  }),
  hulk: Object.freeze({
    id: "hulk",
    name: "HULK",
    title: "The Strongest There Is",
    desc: "Green mass • purple pants • seismic slam",
    accent: "#54e03a",
    // Super-heavy grappler: slowest hands and feet, biggest numbers, LARGE
    // frame (see SIZE in fighter.js + size-aware boxes in combat.js).
    stats: Object.freeze({
      attackSpeed: 0.95, // -5% slower normals (still slowest, no longer free pressure)
      moveSpeed: 0.85,   // -15% movement (walks you down, doesn't chase)
      damage: 1.35,      // +35% attack damage
      health: 1.35,      // +35% health (135 HP wall)
    }),
  }),
});
