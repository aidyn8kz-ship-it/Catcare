import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../js/world.js';
import { Cat } from '../js/cat.js';
import { GameClock } from '../js/clock.js';

function seeded(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

function simulate(seed, gameDays) {
  const world = createWorld();
  const cat = new Cat(world, { rng: seeded(seed) });
  const clock = new GameClock();
  const dt = 0.1;
  const steps = Math.round((gameDays * 24 * 60) / 3 / dt);
  let maxQuiet = 0, quiet = 0, lastCount = 0;
  const visited = new Set();
  for (let i = 0; i < steps; i++) {
    clock.advance(dt);
    cat.update(dt, clock.hour);
    visited.add(cat.room);
    if (cat.mode !== 'busy') {       // Check that the cat does not collide with furniture
      assert.ok(world.isWalkable(cat.room, { x: cat.x, y: cat.y }), `step ${i}: cat collides with wall ${cat.room} (${cat.x.toFixed(1)}, ${cat.y.toFixed(1)})`);
    }
    for (const v of Object.values(cat.needs)) assert.ok(v >= 0 && v <= 100);
    quiet = cat.history.length === lastCount ? quiet + dt : 0;
    lastCount = cat.history.length;
    maxQuiet = Math.max(maxQuiet, quiet);
  }
  return { cat, visited, maxQuiet };
}

const count = (cat, kind) => cat.history.filter(h => h.kind === kind).length;

test('Test case 1', () => {
  const { cat } = simulate(7, 3);
  assert.ok(count(cat, 'eat') >= 3, `ate ${count(cat, 'eat')}`);
  assert.ok(count(cat, 'sleep') >= 3, `slept ${count(cat, 'sleep')}`);
  assert.ok(count(cat, 'litter') >= 3, `litter ${count(cat, 'litter')}`);
  assert.ok(count(cat, 'play') >= 3, `played ${count(cat, 'play')}`);
});

test('Test case 2', () => {
  const { visited } = simulate(11, 3);
  assert.deepEqual([...visited].sort(), ['bathroom', 'bedroom', 'kitchen', 'living']);
});

test('Test case 3', () => {
  const { maxQuiet } = simulate(23, 3);
  assert.ok(maxQuiet < 120, `longest idle period: ${maxQuiet.toFixed(0)} s`);   // Sleeping lasts about 80 seconds
});

test('Test case 4', () => {
  const a = simulate(1, 1).cat.history.map(h => h.kind).join();
  const b = simulate(2, 1).cat.history.map(h => h.kind).join();
  assert.notEqual(a, b);
});

test('Test case 5', () => {
  const a = simulate(5, 1).cat.history.map(h => `${h.kind}@${h.room}`).join();
  const b = simulate(5, 1).cat.history.map(h => `${h.kind}@${h.room}`).join();
  assert.equal(a, b);
});

test('Test case 6', () => {
  const cat = new Cat(createWorld());
  const names = Object.getOwnPropertyNames(Object.getPrototypeOf(cat)).filter(n => !n.startsWith('_'));
  assert.deepEqual(names.sort(), ['constructor', 'restore', 'setModifiers', 'setSick', 'toJSON', 'update'].sort());   // No direct movement commands
});

test('Test case 7', () => {
  const run = mods => {
    const cat = new Cat(createWorld(), { rng: seeded(3) });
    cat.setModifiers(mods);
    const clock = new GameClock();
    for (let i = 0; i < 4800; i++) { clock.advance(0.1); cat.update(0.1, clock.hour); }
    return cat;
  };
  const healthy = run({});
  const urinary = run({ litterMult: 4 });
  assert.ok(count(urinary, 'litter') > count(healthy, 'litter') * 2, `${count(urinary, 'litter')} versus ${count(healthy, 'litter')}`);
  const refusing = run({ refuseFood: true });
  assert.ok(refusing.history.filter(h => h.kind === 'eat').every(h => h.refused));
  assert.ok(refusing.needs.hunger > 60, `hunger ${refusing.needs.hunger}`);
});
