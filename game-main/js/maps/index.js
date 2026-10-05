import { forest } from "./forest.js";
import { lab } from "./lab.js";
import { city } from "./city.js";

export const MAPS = Object.freeze({ forest, lab, city });
export const MAP_IDS = Object.freeze(Object.keys(MAPS));

export function pickMap(id) {
  if (id === "random") {
    const ids = MAP_IDS;
    return MAPS[ids[Math.floor(Math.random() * ids.length)]];
  }
  return MAPS[id] ?? MAPS.forest;
}

