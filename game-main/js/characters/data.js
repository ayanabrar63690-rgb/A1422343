// Not frozen at the top level: players can register custom fighters at
// runtime (js/characters/custom.js). Entries themselves stay frozen.
export const CHARACTERS = {
  wesker: Object.freeze({
    id: "wesker",
    name: "WESKER",
    title: "The Betrayer",
    desc: "Black coat • sunglasses • superhuman swagger",
    accent: "#ff3030",

    stats: Object.freeze({
      attackSpeed: 1.30,
      moveSpeed: 1.35,
      damage: 0.90,
      health: 1.00,
    }),
  }),

  cheatwesker: Object.freeze({
    id: "cheatwesker",
    name: "WESKER ◆ CHEAT",
    title: "The Betrayer, Buffed",
    desc: "AK422 special • permanent enrage • Tricell cruise E • mad dash",
    accent: "#ff5a1a",

    stats: Object.freeze({
      attackSpeed: 1.30,
      moveSpeed: 1.35,
      damage: 0.90,
      health: 0.85,
    }),
  }),
  homelander: Object.freeze({
    id: "homelander",
    name: "HOMELANDER",
    title: "The Patriot",
    desc: "Blue suit • red cape • golden eagle",
    accent: "#3e6bff",
    stats: Object.freeze({
      attackSpeed: 1.00,
      moveSpeed: 1.00,
      damage: 1.15,
      health: 1.10,
    }),
  }),
  wolverine: Object.freeze({
    id: "wolverine",
    name: "WOLVERINE",
    title: "The Best There Is",
    desc: "Yellow suit • black mask • adamantium claws",
    accent: "#ffd23e",

    stats: Object.freeze({
      attackSpeed: 1.25,
      moveSpeed: 1.10,
      damage: 1.08,
      health: 0.95,
    }),
  }),
  hulk: Object.freeze({
    id: "hulk",
    name: "HULK",
    title: "The Strongest There Is",
    desc: "Green mass • purple pants • seismic slam",
    accent: "#54e03a",

    stats: Object.freeze({
      attackSpeed: 0.95,
      moveSpeed: 0.85,
      damage: 1.40,
      health: 1.35,
    }),
  }),
  ironman: Object.freeze({
    id: "ironman",
    name: "IRON MAN",
    title: "The Futurist",
    desc: "Red plating • gold faceplate • repulsor zoning",
    accent: "#ff8c1a",

    stats: Object.freeze({
      attackSpeed: 1.00,
      moveSpeed: 0.95,
      damage: 0.95,
      health: 1.00,
    }),
  }),
  thor: Object.freeze({
    id: "thor",
    name: "THOR",
    title: "God of Thunder",
    desc: "Winged helm • red cape • Mjolnir bruiser",
    accent: "#7fd4ff",

    stats: Object.freeze({
      attackSpeed: 1.05,
      moveSpeed: 0.95,
      damage: 1.10,
      health: 1.15,
    }),
  }),
  spiderman: Object.freeze({
    id: "spiderman",
    name: "SPIDER-MAN",
    title: "Web-Head",
    desc: "Red mask • web-shooters • aerial trickster",
    accent: "#ff3b3b",

    stats: Object.freeze({
      attackSpeed: 1.15,
      moveSpeed: 1.05,
      damage: 0.50,
      health: 0.95,
    }),
  }),
  doom: Object.freeze({
    id: "doom",
    name: "DR. DOOM",
    title: "Monarch of Latveria",
    desc: "Steel mask • green cloak • plasma + missiles",
    accent: "#2fae5a",

    stats: Object.freeze({
      attackSpeed: 1.00,
      moveSpeed: 0.90,
      damage: 1.05,
      health: 1.15,
    }),
  }),
  uroboros: Object.freeze({
    id: "uroboros",
    name: "UROBOROS",
    title: "Unstable Evolution",
    desc: "Shirtless Wesker • tentacle mass • hidden",
    accent: "#ff7a1a",
    hidden: true,

    stats: Object.freeze({
      attackSpeed: 1.05,
      moveSpeed: 0.95,
      damage: 1.35,
      health: 1.45,
    }),
  }),
};

// Custom fighters carry their full build data under `custom` so the
// sprite/specials systems can reconstruct art and abilities per fighter.
export function registerCharacter(def) {
  CHARACTERS[def.id] = Object.freeze({
    title: "",
    desc: "",
    accent: "#ffffff",
    hidden: false,
    ...def,
  });
  return CHARACTERS[def.id];
}

