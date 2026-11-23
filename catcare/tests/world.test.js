import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS, ROOM_ORDER } from '../js/worldData.js';
import { createWorld, smoothPath, buildGrid, toCell } from '../js/world.js';

const world = createWorld();

test('Test case 1', () => {
  const opp = { left: 'right', right: 'left' };
  for (const [id, room] of Object.entries(ROOMS)) {
    for (const [side, ex] of Object.entries(room.exits)) {
      assert.equal(ROOMS[ex.to].exits[opp[side]]?.to, id, `${id}.${side} → ${ex.to}`);
    }
  }
});

test('Test case 2', () => {
  for (const [id, room] of Object.entries(ROOMS)) {
    for (const s of room.spots) assert.ok(world.isWalkable(id, s.feet), `${id}: ${s.kind} ${JSON.stringify(s.feet)}`);
  }
});

test('Test case 3', () => {
  for (const [id, room] of Object.entries(ROOMS)) {
    for (const side of Object.keys(room.exits)) assert.ok(world.isWalkable(id, world.doorPoint(side)), `${id}.${side}`);
  }
});

test('Test case 4', () => {
  for (const [id, room] of Object.entries(ROOMS)) {
    const from = [...Object.keys(room.exits)].map(s => world.doorPoint(s));
    for (const f of from) for (const s of room.spots) {
      const p = world.findPath(id, f, s.feet);
      assert.ok(p, `${id}: path to ${s.kind}`);
    }
  }
});

test('Test case 5', () => {
  const room = 'living';
  const path = world.findPath(room, world.doorPoint('left'), ROOMS.living.spots.find(s => s.kind === 'play').feet);
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
    for (let k = 0; k <= n; k++) {
      const t = n ? k / n : 0;
      assert.ok(world.isWalkable(room, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }));
    }
  }
});

test('Test case 6', () => {
  const grid = buildGrid(ROOMS.living);
  const raw = [{ x: 6, y: 94 }, { x: 10, y: 94 }, { x: 14, y: 94 }, { x: 18, y: 94 }, { x: 22, y: 94 }];
  const s = smoothPath(grid, raw);
  assert.deepEqual(s, [raw[0], raw[4]]);
});

test('Test case 7', () => {
  const hops = world.route('kitchen', 'bathroom');
  assert.deepEqual(hops.map(h => `${h.room}:${h.side}`), ['kitchen:right', 'living:right', 'bedroom:right']);
  assert.deepEqual(world.route('living', 'living'), []);
});

test('Test case 8', () => {
  const grid = buildGrid(ROOMS.living);
  const blocked = p => grid.cost[toCell(p).y][toCell(p).x] === Infinity;
  assert.ok(blocked({ x: 100, y: 70 }));
  assert.ok(!blocked({ x: 100, y: 90 }));
  assert.ok(blocked({ x: 100, y: 10 }));
});
