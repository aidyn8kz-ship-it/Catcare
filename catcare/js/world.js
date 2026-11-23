import { ROOMS, CELL, ROOM_W, ROOM_H, FEET_MIN_Y, FEET_MAX_Y, DOOR } from './worldData.js';
import { astar } from './ai/astar.js';

const GX = ROOM_W / CELL;
const GY = ROOM_H / CELL;
const GY_MIN = FEET_MIN_Y / CELL;          // 16
const GY_MAX = Math.floor(FEET_MAX_Y / CELL); // 24

export const toCell = p => ({ x: Math.floor(p.x / CELL), y: Math.floor(p.y / CELL) });
export const cellCenter = c => ({ x: c.x * CELL + CELL / 2, y: c.y * CELL + CELL / 2 });

export function buildGrid(room) {
  const cost = Array.from({ length: GY }, (_, gy) =>
    Array.from({ length: GX }, () => (gy < GY_MIN || gy > GY_MAX ? Infinity : 1)));
  for (const o of room.obstacles) {
    for (let gx = Math.floor(o.x0 / CELL); gx <= Math.floor(o.x1 / CELL); gx++) {
      for (let gy = GY_MIN; gy <= Math.floor(o.y1 / CELL); gy++) cost[gy][gx] = Infinity;
    }
  }
  return { cost, width: GX, height: GY };
}

const walkable = (grid, p) => {
  const c = toCell(p);
  return c.x >= 0 && c.y >= 0 && c.x < grid.width && c.y < grid.height && grid.cost[c.y][c.x] !== Infinity;
};

function clearLine(grid, a, b) {
  const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
  for (let i = 0; i <= n; i++) {
    const t = n === 0 ? 0 : i / n;
    if (!walkable(grid, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return false;
  }
  return true;
}

export function smoothPath(grid, points) {
  if (points.length <= 2) return points;
  const out = [points[0]];
  let i = 0;
  while (i < points.length - 1) {
    let j = points.length - 1;
    while (j > i + 1 && !clearLine(grid, points[i], points[j])) j--;
    out.push(points[j]);
    i = j;
  }
  return out;
}

export function createWorld() {
  const grids = {};
  for (const [id, room] of Object.entries(ROOMS)) grids[id] = buildGrid(room);

  return {
    rooms: ROOMS,
    grids,

    findPath(roomId, from, to) {
      const grid = grids[roomId];
      const r = astar(grid, toCell(from), toCell(to));
      if (!r) return null;
      const pts = r.path.map(cellCenter);
      pts[pts.length - 1] = { x: to.x, y: to.y };
      return smoothPath(grid, pts);
    },

    route(fromRoom, toRoom) {
      if (fromRoom === toRoom) return [];
      const prev = { [fromRoom]: null };
      const queue = [fromRoom];
      while (queue.length) {
        const cur = queue.shift();
        for (const [side, ex] of Object.entries(ROOMS[cur].exits)) {
          if (ex.to in prev) continue;
          prev[ex.to] = { room: cur, side };
          if (ex.to === toRoom) {
            const hops = [];
            let r = toRoom;
            while (prev[r]) { hops.unshift({ room: prev[r].room, side: prev[r].side }); r = prev[r].room; }
            return hops;
          }
          queue.push(ex.to);
        }
      }
      return null;
    },

    doorPoint(side) { return cellCenter(DOOR[side]); },
    isWalkable(roomId, p) { return walkable(grids[roomId], p); },
  };
}

export const OPPOSITE = { left: 'right', right: 'left' };
