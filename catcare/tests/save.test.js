import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSaveStore, SAVE_VERSION } from '../js/save.js';
import { createWorld } from '../js/world.js';
import { Cat } from '../js/cat.js';
import { Episode, EventDirector } from '../js/episode.js';
import { GameClock } from '../js/clock.js';

const load = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf-8'));
const data = { diseases: load('../data/diseases.json'), mdp: load('../data/mdp.json'), city: load('../data/city.json'), texts: load('../data/episodes.json') };
const seeded = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

function fakeStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k), _m: m };
}

test('Test case 1', () => {
  const store = createSaveStore(fakeStorage());
  assert.equal(store.load(), null);
  assert.equal(store.save({ clockMinutes: 600 }), true);
  const s = store.load();
  assert.equal(s.clockMinutes, 600);
  assert.equal(s.version, SAVE_VERSION);
  assert.ok(s.savedAt > 0);
});

test('Test case 2', () => {
  const store = createSaveStore(fakeStorage());
  store.save({ a: 1 }); store.clear();
  assert.equal(store.load(), null);
});

test('Test case 3', () => {
  assert.equal(createSaveStore(fakeStorage({ 'catcare.save.v1': '{not json' })).load(), null);
  assert.equal(createSaveStore(fakeStorage({ 'catcare.save.v1': JSON.stringify({ version: 999 }) })).load(), null);
});

test('Storage unavailable', () => {
  const broken = { getItem() { throw new Error('Storage unavailable'); }, setItem() { throw new Error('Storage unavailable'); }, removeItem() { throw new Error('x'); } };
  const store = createSaveStore(broken);
  assert.equal(store.save({}), false);
  assert.equal(store.load(), null);
  assert.doesNotThrow(() => store.clear());
});

test('Test case 8', () => {
  const world = createWorld();
  const a = new Cat(world, { rng: seeded(4) });
  const clock = new GameClock();
  for (let i = 0; i < 600; i++) { clock.advance(0.1); a.update(0.1, clock.hour); }
  const json = JSON.parse(JSON.stringify(a.toJSON()));
  const b = new Cat(world, { rng: seeded(9) });
  b.restore(json);
  assert.equal(b.room, a.room);
  assert.equal(b.x, a.x); assert.equal(b.y, a.y);
  assert.deepEqual(b.needs, a.needs);
  assert.equal(b.mode, 'idle');
  assert.ok(world.isWalkable(b.room, { x: b.x, y: b.y }));
  for (let i = 0; i < 300; i++) { clock.advance(0.1); b.update(0.1, clock.hour); }
});

test('Test case 9', () => {
  const ep = new Episode({ data, conditionId: 'urinary', rng: seeded(3), startMinute: 500 });
  ep.check('litter'); ep.observe();
  const copy = Episode.fromJSON(data, JSON.parse(JSON.stringify(ep.toJSON())), seeded(77));
  assert.deepEqual(copy.known, ep.known);
  assert.deepEqual(copy.truths, ep.truths);
  assert.equal(copy.severity, ep.severity);
  assert.equal(copy.minute, ep.minute);
  assert.deepEqual(copy.checked, ep.checked);
  assert.equal(copy.recommendation(12).bestAction, ep.recommendation(12).bestAction);
  assert.equal(copy.decideGo('near', 12).grade, ep.decideGo('near', 12).grade);
});

test('Test case 10', () => {
  const d = new EventDirector({ data, rng: seeded(5), startMinute: 480 });
  d.start(500, 'dental');
  d.active.observe();
  const d2 = new EventDirector({ data, rng: seeded(6), startMinute: 0 });
  d2.restore(JSON.parse(JSON.stringify(d.toJSON())));
  assert.equal(d2.active.condition.id, 'dental');
  assert.equal(d2.active.minute, d.active.minute);
  assert.equal(d2.nextAt, d.nextAt);
});

test('Test case 11', () => {
  const d = new EventDirector({ data, rng: seeded(8), startMinute: 480 });
  d.start(500, 'urinary');
  d.active.decideGo('near', 12);
  const json = d.toJSON();
  assert.equal(json.active, null);
  assert.equal(json.completed.length, 1);
});
