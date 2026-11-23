
export const SPRITE_FEET = {
  cat_walk0: { fx: 15, fy: 19 }, cat_walk1: { fx: 15, fy: 19 },
  cat_sick0: { fx: 15, fy: 20 }, cat_sick1: { fx: 15, fy: 20 },
  cat_sit: { fx: 11, fy: 23 },
};

export function describeCat(cat) {
  if (cat.pose) {
    return { sprite: cat.pose.sprite, x: cat.pose.x, y: cat.pose.y, anchor: cat.pose.anchor, flip: false,
             zzz: cat.pose.sprite === 'cat_sleep' };
  }
  const prefix = cat.sick ? 'cat_sick' : 'cat_walk';
  let sprite;
  if (cat.mode === 'walking') sprite = prefix + (Math.floor(cat.animTime * 4) % 2);
  else if (cat.stance === 'front') sprite = 'cat_sit';
  else sprite = prefix + '0';
  return { sprite, x: cat.x, y: cat.y, anchor: 'feet', flip: cat.facing === 'left', zzz: false };
}

/**
 *
 * @param assets  { rooms: {id: Image}, sprites: {name: Image} }
 * @param view    { roomId, cat, clock, alert }
 */
export function drawFrame(ctx, assets, view) {
  const { roomId, cat, clock, alert = false, sparkle = false, petStarted = -Infinity } = view;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 160, 100);
  ctx.drawImage(assets.rooms[roomId], 0, 0);

  if (cat.room === roomId) {
    const d = describeCat(cat);
    const img = assets.sprites[d.sprite];
    let dx, dy;
    if (d.anchor === 'tl') { dx = d.x; dy = d.y; }
    else if (d.anchor === 'bc') { dx = d.x - img.width / 2; dy = d.y - img.height; }
    else { const f = SPRITE_FEET[d.sprite]; dx = d.x - f.fx; dy = d.y - f.fy; }
    dx = Math.round(dx); dy = Math.round(dy);

    if (d.flip) {
      const f = SPRITE_FEET[d.sprite] ?? { fx: img.width / 2 };
      ctx.save();
      ctx.translate(Math.round(d.x), 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -f.fx, dy);
      ctx.restore();
    } else {
      ctx.drawImage(img, dx, dy);
    }
    const petAge = cat.animTime - petStarted;
    if (petAge >= 0 && petAge < 1.4) {
      const offset = Math.floor(petAge * 9);
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1.4 - petAge) * 2);
      ctx.fillStyle = '#f05485';
      ctx.font = '9px sans-serif';
      ctx.fillText('♥', Math.round(dx + img.width / 2) - 4, Math.max(9, dy - 2 - offset));
      ctx.restore();
    }
    if (d.zzz) ctx.drawImage(assets.sprites.zzz, dx + 26, dy - 4);
    for (const e of cat.effects ?? []) {
      if (e.until > cat.animTime) ctx.drawImage(assets.sprites[e.sprite], Math.round(cat.x) - 7, Math.round(cat.y) - 36);
    }
    if (alert && Math.floor(cat.animTime * 2) % 2 === 0) {
      const ay = cat.pose ? Math.round(cat.pose.y) - 14 : Math.round(cat.y) - 36;
      const ax = cat.pose ? Math.round(cat.pose.x) + 8 : Math.round(cat.x) - 5;
      ctx.drawImage(assets.sprites.bubble_exclaim, ax, Math.max(0, ay));
    }
  }

  if (sparkle && roomId === 'living' && Math.floor(cat.animTime * 2) % 2 === 0) {
    ctx.fillStyle = '#f6d64b';
    ctx.fillRect(95, 10, 1, 4); ctx.fillRect(93, 12, 5, 1);
  }

  if (clock.isNight) {
    ctx.fillStyle = 'rgba(15, 25, 70, 0.38)';
    ctx.fillRect(0, 0, 160, 100);
  }
}
