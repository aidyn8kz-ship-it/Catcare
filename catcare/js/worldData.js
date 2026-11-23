//

export const CELL = 4;
export const ROOM_W = 160;
export const ROOM_H = 100;
export const FEET_MIN_Y = 64;
export const FEET_MAX_Y = 99;

export const DOOR = { left: { x: 1, y: 23 }, right: { x: 38, y: 23 } };

export const ROOM_ORDER = ['kitchen', 'living', 'bedroom', 'bathroom'];

export const ACTIVITY = {
  eat:    { need: 'hunger', minutes: 20,  title: 'eating' },
  sleep:  { need: 'tired',  minutes: 240, title: 'sleeping' },
  litter: { need: 'litter', minutes: 8,   title: 'using the litter box' },
  play:   { need: 'play',   minutes: 45,  title: 'playing' },
  sit:    { need: null,     minutes: 40,  title: 'resting' },
  look:   { need: null,     minutes: 50,  title: 'looking out the window' },
  hide:   { need: null,     minutes: 90,  title: 'hiding' },
};

export const ROOMS = {
  kitchen: {
    name: 'Kitchen',
    exits: { right: { to: 'living' } },
    obstacles: [{ x0: 4, x1: 78, y1: 82 }, { x0: 118, x1: 153, y1: 82 }],
    spots: [
      { kind: 'eat', feet: { x: 26, y: 92 }, facing: 'right' },
      { kind: 'sit', feet: { x: 96, y: 92 }, facing: 'front' },
    ],
  },
  living: {
    name: 'Living Room',
    exits: { left: { to: 'kitchen' }, right: { to: 'bedroom' } },
    obstacles: [
      { x0: 4, x1: 26, y1: 80 },
      { x0: 62, x1: 120, y1: 80 },
      { x0: 130, x1: 150, y1: 84 },
    ],
    spots: [
      { kind: 'play',  feet: { x: 124, y: 90 }, facing: 'right' },
      { kind: 'sleep', feet: { x: 84, y: 90 }, facing: 'right', pose: { sprite: 'cat_sleep', x: 74, y: 37, anchor: 'tl' } },
      { kind: 'hide',  feet: { x: 84, y: 90 }, facing: 'right', pose: { sprite: 'cat_peek', x: 76, y: 68, anchor: 'tl' } },
      { kind: 'sit',   feet: { x: 60, y: 90 }, facing: 'front' },
      { kind: 'look',  feet: { x: 41, y: 90 }, facing: 'front', pose: { sprite: 'cat_sit', x: 41, y: 43, anchor: 'bc' } },
    ],
  },
  bedroom: {
    name: 'Bedroom',
    exits: { left: { to: 'living' }, right: { to: 'bathroom' } },
    obstacles: [
      { x0: 4, x1: 34, y1: 82 },
      { x0: 38, x1: 58, y1: 82 },
      { x0: 72, x1: 150, y1: 82 },
    ],
    spots: [
      { kind: 'sleep', feet: { x: 100, y: 90 }, facing: 'right', pose: { sprite: 'cat_sleep', x: 92, y: 44, anchor: 'tl' } },
      { kind: 'look',  feet: { x: 64, y: 90 }, facing: 'front', pose: { sprite: 'cat_sit', x: 56, y: 42, anchor: 'bc' } },
      { kind: 'sit',   feet: { x: 75, y: 92 }, facing: 'front' },
    ],
  },
  bathroom: {
    name: 'Bathroom',
    exits: { left: { to: 'bedroom' } },
    obstacles: [
      { x0: 4, x1: 72, y1: 83 },
      { x0: 88, x1: 116, y1: 82 },
      { x0: 120, x1: 138, y1: 82 },
    ],
    spots: [
      { kind: 'litter', feet: { x: 144, y: 93 }, facing: 'left' },
      { kind: 'sit',    feet: { x: 36, y: 92 }, facing: 'front' },
    ],
  },
};
