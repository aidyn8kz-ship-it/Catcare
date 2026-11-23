
const CELL = 24;

export const MAP_SIZE = city => ({ w: city.rows[0].length * CELL, h: city.rows.length * CELL });

/**
 *
 * @param city   data/city.json
 *
 */
export function drawCityMap(ctx, city, routes = []) {
  const { w, h } = MAP_SIZE(city);
  ctx.clearRect(0, 0, w, h);
  city.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const px = x * CELL, py = y * CELL;
    if (ch === '#') {
      ctx.fillStyle = '#7a6a5a'; ctx.fillRect(px, py, CELL, CELL);
      ctx.fillStyle = '#5e5044'; ctx.fillRect(px + 3, py + 3, CELL - 6, CELL - 6);
    } else if (ch === '~') {
      ctx.fillStyle = '#f0e2bd'; ctx.fillRect(px, py, CELL, CELL);
      ctx.fillStyle = '#e09a2c';
      for (let i = -CELL; i < CELL; i += 8) { ctx.fillRect(px + Math.max(0, i), py + Math.max(0, -i), 4, 4); }
      ctx.fillRect(px + 3, py + 3, CELL - 6, 4); ctx.fillRect(px + 3, py + CELL - 7, CELL - 6, 4);
    } else {
      ctx.fillStyle = '#f0e2bd'; ctx.fillRect(px, py, CELL, CELL);
    }
    ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.strokeRect(px + .5, py + .5, CELL - 1, CELL - 1);
  }));

  for (const r of routes) {
    if (!r.path) continue;
    ctx.save();
    ctx.strokeStyle = r.color; ctx.lineWidth = r.width ?? 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.setLineDash(r.dashed ? [8, 8] : []);
    ctx.beginPath();
    r.path.forEach((p, i) => {
      const cx = p.x * CELL + CELL / 2, cy = p.y * CELL + CELL / 2;
      if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
    ctx.restore();
  }

  const hx = city.home.x * CELL, hy = city.home.y * CELL;
  ctx.fillStyle = '#c53a45'; ctx.fillRect(hx + 4, hy + 8, CELL - 8, CELL - 12);
  ctx.beginPath(); ctx.moveTo(hx + 2, hy + 9); ctx.lineTo(hx + CELL / 2, hy + 2); ctx.lineTo(hx + CELL - 2, hy + 9); ctx.fill();
  for (const c of city.clinics) {
    const cx = c.x * CELL, cy = c.y * CELL;
    ctx.fillStyle = '#3d9a58'; ctx.fillRect(cx + 3, cy + 3, CELL - 6, CELL - 6);
    ctx.fillStyle = '#fff'; ctx.fillRect(cx + CELL / 2 - 2, cy + 6, 4, CELL - 12); ctx.fillRect(cx + 6, cy + CELL / 2 - 2, CELL - 12, 4);
  }
}
