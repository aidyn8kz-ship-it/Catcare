import { readFileSync } from 'node:fs';
import { parseGrid, routeToClinic } from '../js/ai/astar.js';
import { solveProfile } from '../js/ai/mdp.js';

const load = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf-8'));
const city = load('../data/city.json');
const mdp = load('../data/mdp.json');

function draw(path, target) {
  const set = new Set(path.map(p => `${p.x},${p.y}`));
  console.log('   ' + city.rows[0].split('').map((_, i) => i).join(' '));
  city.rows.forEach((row, y) => {
    const line = [...row].map((ch, x) => {
      if (x === city.home.x && y === city.home.y) return '🏠';
      if (x === target.x && y === target.y) return '🏥';
      if (set.has(`${x},${y}`)) return '· ';
      return ch === '#' ? '██' : ch === '~' ? '~~' : '  ';
    }).join('');
    console.log(` ${y} ${line}`);
  });
}

console.log('=== INPUT ===');
console.log('Map', city.rows[0].length, '×', city.rows.length, '| 🏠 home | █ buildings | ~ traffic (costly)');
for (const c of city.clinics) console.log(' -', c.name_ru, `(${c.x},${c.y})`);

for (const [label, hour] of [['DAYTIME, 12:00', 12], ['NIGHTTIME, 23:00', 23]]) {
  console.log(`\n=== ${label} ===`);
  const { options, best } = routeToClinic(city, hour);
  for (const o of options) {
    console.log(` ${o.clinic.name_ru}: route cost ${o.cost}, travel time ${(o.travelHours * 60).toFixed(0)} min, ` +
      `on arrival ${o.openOnArrival ? 'OPEN' : 'CLOSED'}, expanded nodes: ${o.expanded}`);
  }
  console.log(` ➜ Selected: ${best.clinic.name_ru}\n`);
  draw(best.path, best.clinic);

  const r = solveProfile(mdp, 'red', { travelHours: best.travelHours });
  console.log(`\n MDP link (urgent case): travel time ${(best.travelHours * 60).toFixed(0)} min → ` +
    `Q(go) = ${r.Q[0].go.toFixed(1)}, Q(observe) = ${r.Q[0].observe.toFixed(1)}`);
}

console.log('\n=== WHY THIS WORKS ===');
console.log('A* finds low-cost paths on a map with obstacles and different travel costs, using a heuristic to guide its search.');
