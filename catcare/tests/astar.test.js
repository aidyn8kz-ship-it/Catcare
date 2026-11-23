import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseGrid, astar, isOpenAt, routeToClinic } from '../js/ai/astar.js';

const city = JSON.parse(readFileSync(new URL('../data/city.json', import.meta.url), 'utf-8'));

test('Test case 1', () => {
  const grid = parseGrid(['.....', '.....', '.....']);
  const r = astar(grid, { x: 0, y: 0 }, { x: 4, y: 2 });
  assert.equal(r.cost, 6);
  assert.equal(r.path.length, 7);
});

test('Test case 2', () => {
  const r = astar(parseGrid(['..']), { x: 0, y: 0 }, { x: 0, y: 0 });
  assert.equal(r.cost, 0);
  assert.equal(r.path.length, 1);
});

test('Test case 3', () => {
  const grid = parseGrid(['..#..', '..#..', '.....']);
  const r = astar(grid, { x: 0, y: 0 }, { x: 4, y: 0 });
  assert.equal(r.cost, 8);
  assert.ok(r.path.every(p => grid.cost[p.y][p.x] !== Infinity));
});

test('Test case 4', () => {
  const grid = parseGrid(['.#.', '.#.', '.#.']);
  assert.equal(astar(grid, { x: 0, y: 0 }, { x: 2, y: 0 }), null);
});

test('Test case 5', () => {
  const cheapDetour = parseGrid(['.~.', '...']);
  assert.equal(astar(cheapDetour, { x: 0, y: 0 }, { x: 2, y: 0 }).cost, 4);
  const noDetour = parseGrid(['.~.']);
  assert.equal(astar(noDetour, { x: 0, y: 0 }, { x: 2, y: 0 }).cost, 4);
});

function bfsCost(grid, s, t) {
  const dist = new Map([[`${s.x},${s.y}`, 0]]);
  const q = [s];
  while (q.length) {
    const c = q.shift();
    if (c.x === t.x && c.y === t.y) return dist.get(`${c.x},${c.y}`);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = c.x + dx, ny = c.y + dy;
      if (nx < 0 || ny < 0 || nx >= grid.width || ny >= grid.height) continue;
      if (grid.cost[ny][nx] === Infinity || dist.has(`${nx},${ny}`)) continue;
      dist.set(`${nx},${ny}`, dist.get(`${c.x},${c.y}`) + 1);
      q.push({ x: nx, y: ny });
    }
  }
  return null;
}

test('Test case 6', () => {
  let seed = 2024;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  for (let i = 0; i < 300; i++) {
    const rows = Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => (rnd() < 0.28 ? '#' : '.')).join(''));
    const grid = parseGrid(rows);
    const s = { x: 0, y: 0 }, t = { x: 7, y: 7 };
    grid.cost[0][0] = 1; grid.cost[7][7] = 1;
    const a = astar(grid, s, t);
    const b = bfsCost(grid, s, t);
    assert.equal(a ? a.cost : null, b, `map #${i}`);
  }
});

test('Test case 7', () => {
  const near = city.clinics.find(c => c.id === 'near');
  assert.equal(isOpenAt(near, 12), true);
  assert.equal(isOpenAt(near, 23), false);
  assert.equal(isOpenAt(near, 7.9), false);
});

test('Test case 8', () => {
  const { options } = routeToClinic(city, 12);
  assert.ok(options.every(o => o.reachable));
});

test('Test case 9', () => {
  assert.equal(routeToClinic(city, 12).best.clinic.id, 'near');
  assert.equal(routeToClinic(city, 23).best.clinic.id, 'night');
});

test('Test case 10', () => {
  assert.equal(routeToClinic(city, 19 + 55 / 60).best.clinic.id, 'night');
});

test('Test case 11', () => {
  const o = routeToClinic(city, 12).options[0];
  assert.equal(o.travelHours, (o.cost * city.meta.minutes_per_cost) / 60);
});
