import test from 'node:test';
import assert from 'node:assert/strict';
import { drawFrame, describeCat } from '../js/render.js';
import { createWorld } from '../js/world.js';
import { Cat } from '../js/cat.js';
import { GameClock } from '../js/clock.js';

function fakeCtx() {
  const calls = [];
  const rec = name => (...args) => calls.push([name, ...args]);
  return { calls, imageSmoothingEnabled: true, fillStyle: '',
    clearRect: rec('clearRect'), drawImage: rec('drawImage'), save: rec('save'), restore: rec('restore'),
    translate: rec('translate'), scale: rec('scale'), fillRect: rec('fillRect') };
}
const img = (w, h) => ({ width: w, height: h });
const assets = {
  rooms: { living: img(160, 100), kitchen: img(160, 100), bedroom: img(160, 100), bathroom: img(160, 100) },
  sprites: { cat_walk0: img(30, 22), cat_walk1: img(30, 22), cat_sick0: img(30, 22), cat_sick1: img(30, 22),
    cat_sit: img(22, 24), cat_sleep: img(28, 15), cat_peek: img(16, 8), bubble_exclaim: img(11, 13), bubble_sneeze: img(15, 12), zzz: img(12, 10) },
};

test('Test case 1', () => {
  const cat = new Cat(createWorld());
  const clock = new GameClock();
  const poses = [
    () => { cat.mode = 'walking'; cat.pose = null; },
    () => { cat.mode = 'busy'; cat.stance = 'front'; },
    () => { cat.stance = 'side'; cat.facing = 'left'; },
    () => { cat.pose = { sprite: 'cat_sleep', x: 74, y: 37, anchor: 'tl' }; },
    () => { cat.pose = { sprite: 'cat_peek', x: 76, y: 68, anchor: 'tl' }; },
    () => { cat.pose = { sprite: 'cat_sit', x: 41, y: 43, anchor: 'bc' }; },
    () => { cat.pose = null; cat.sick = true; },
  ];
  for (const set of poses) {
    set();
    const ctx = fakeCtx();
    drawFrame(ctx, assets, { roomId: 'living', cat, clock, alert: true });
    assert.ok(ctx.calls.filter(c => c[0] === 'drawImage').length >= 2);
  }
});

test('Test case 2', () => {
  const cat = new Cat(createWorld());
  cat.room = 'bathroom';
  const ctx = fakeCtx();
  drawFrame(ctx, assets, { roomId: 'kitchen', cat, clock: new GameClock() });
  assert.equal(ctx.calls.filter(c => c[0] === 'drawImage').length, 1);
});

test('Test case 3', () => {
  const cat = new Cat(createWorld());
  const clock = new GameClock(23 * 60);
  const ctx = fakeCtx();
  drawFrame(ctx, assets, { roomId: 'living', cat, clock });
  assert.ok(ctx.calls.some(c => c[0] === 'fillRect'));
});

test('Test case 4', () => {
  const cat = new Cat(createWorld());
  cat.pose = { sprite: 'cat_sleep', x: 74, y: 37, anchor: 'tl' };
  assert.equal(describeCat(cat).zzz, true);
  cat.pose = null; cat.facing = 'left'; cat.mode = 'walking';
  assert.equal(describeCat(cat).flip, true);
});
