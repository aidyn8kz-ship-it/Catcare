//
//

export function parseGrid(rows) {
  const cost = rows.map(row => [...row].map(ch => {
    if (ch === '#') return Infinity;
    if (ch === '.') return 1;
    if (ch === '~') return 3;
    if (/[2-9]/.test(ch)) return Number(ch);
    throw new Error(`Unknown map character: "${ch}"`);
  }));
  return { cost, width: cost[0].length, height: cost.length };
}

const key = (x, y) => `${x},${y}`;
const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * @param {{cost:number[][], width:number, height:number}} grid
 * @param {{x:number,y:number}} start
 * @param {{x:number,y:number}} goal
 * @returns {{path:{x:number,y:number}[], cost:number, expanded:number} | null}
 *
 */
export function astar(grid, start, goal) {
  const g = new Map([[key(start.x, start.y), 0]]);
  const cameFrom = new Map();
  const closed = new Set();
  const open = [{ ...start, f: manhattan(start, goal), h: manhattan(start, goal) }];
  let expanded = 0;

  while (open.length > 0) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bi].f || (open[i].f === open[bi].f && open[i].h < open[bi].h)) bi = i;
    }
    const cur = open.splice(bi, 1)[0];
    const ck = key(cur.x, cur.y);
    if (closed.has(ck)) continue;
    closed.add(ck);
    expanded++;

    if (cur.x === goal.x && cur.y === goal.y) {
      const path = [{ x: cur.x, y: cur.y }];
      let k = ck;
      while (cameFrom.has(k)) {
        const p = cameFrom.get(k);
        path.push({ x: p.x, y: p.y });
        k = key(p.x, p.y);
      }
      return { path: path.reverse(), cost: g.get(ck), expanded };
    }

    for (const [dx, dy] of DIRS) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= grid.width || ny >= grid.height) continue;
      const stepCost = grid.cost[ny][nx];
      if (stepCost === Infinity) continue;
      const nk = key(nx, ny);
      if (closed.has(nk)) continue;
      const tentative = g.get(ck) + stepCost;
      if (tentative < (g.get(nk) ?? Infinity)) {
        g.set(nk, tentative);
        cameFrom.set(nk, { x: cur.x, y: cur.y });
        const h = manhattan({ x: nx, y: ny }, goal);
        open.push({ x: nx, y: ny, f: tentative + h, h });
      }
    }
  }
  return null;
}

export function isOpenAt(clinic, hour) {
  if (clinic.always_open) return true;
  const h = ((hour % 24) + 24) % 24;
  return h >= clinic.open_from && h < clinic.open_to;
}

/**
 *
 *
 *
 *
 *
 */
export function routeToClinic(city, hour) {
  const grid = parseGrid(city.rows);
  const { minutes_per_cost: mpc } = city.meta;

  const options = city.clinics.map(clinic => {
    const route = astar(grid, city.home, { x: clinic.x, y: clinic.y });
    if (!route) return { clinic, reachable: false, openOnArrival: false };
    const travelHours = (route.cost * mpc) / 60;
    return {
      clinic,
      reachable: true,
      path: route.path,
      cost: route.cost,
      expanded: route.expanded,
      travelHours,
      openOnArrival: isOpenAt(clinic, hour + travelHours),
    };
  });

  const best = options
    .filter(o => o.reachable && o.openOnArrival)
    .sort((a, b) => a.cost - b.cost)[0] ?? null;

  return { options, best };
}
