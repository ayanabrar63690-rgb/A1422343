export const VIEW_W = 960;
export const VIEW_H = 540;

export const SPRITE_W = 36;
export const SPRITE_H = 52;
export const SPRITE_SCALE = 3;
export const ARENA_W = 1600;
export const GROUND_Y = 452;
export const WALK_PREVIEW_SPEED = 220;

export const SETTINGS = { wolvieSpin: true };

export const MOVE = Object.freeze({
  WALK_SPEED: 240,
  SNEAK_SPEED: 95,
  AIR_CONTROL: 175,
  JUMP_VEL: 720,
  GRAVITY: 2100,
  JUMP_STARTUP: 0.07,
  LAND_LAG: 0.12,
  DASH_TIME: 0.18,
  DASH_FWD_SPEED: 560,
  DASH_BACK_SPEED: 470,
  TAP_WINDOW: 0.28,
  GUARD_RANGE: 260,

  BODY_DIST: 70,
  ARENA_MARGIN: 60,
  BACKPEDAL_MULT: 0.85,
  KDOWN_TIME: 0.40,
  KDOWN_FALL: 0.25,
  KDOWN_RISE: 0.30,
});

export const STATE = Object.freeze({
  MENU: "MENU",
  CHAR_SELECT: "CHAR_SELECT",
  MAP_SELECT: "MAP_SELECT",
  FIGHT: "FIGHT",
});

