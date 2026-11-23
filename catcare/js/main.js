import { ROOM_ORDER, ROOMS, ACTIVITY } from './worldData.js';
import { createWorld } from './world.js';
import { Cat } from './cat.js';
import { GameClock, MINUTES_PER_SECOND } from './clock.js';
import { drawFrame, describeCat, SPRITE_FEET } from './render.js';
import { EventDirector } from './episode.js';
import { createInspect } from './ui.js';
import { Progress } from './progress.js';
import { createBook } from './book.js';
import { createAchievements, createConfirm } from './panels.js';
import { createSaveStore } from './save.js';
import { loadImage, loadJSON } from './resources.js';

const ROOM_IDS = ROOM_ORDER;
const SPRITE_NAMES = ['cat_walk0', 'cat_walk1', 'cat_sick0', 'cat_sick1', 'cat_sit', 'cat_sleep', 'cat_peek',
  'bubble_exclaim', 'bubble_sneeze', 'zzz', 'book_closed'];

async function loadAssets() {
  const rooms = {}, sprites = {};
  await Promise.all([
    ...ROOM_IDS.map(async id => { rooms[id] = await loadImage(`assets/rooms/${id}.png`); }),
    ...SPRITE_NAMES.map(async n => { sprites[n] = await loadImage(`assets/sprites/${n}.png`); }),
  ]);
  return { rooms, sprites };
}

async function loadData() {
  const names = { diseases: 'diseases', mdp: 'mdp', city: 'city', texts: 'episodes', book: 'book' };
  const entries = await Promise.all(Object.entries(names).map(async ([key, file]) => [key, await loadJSON(file)]));
  return Object.fromEntries(entries);
}

async function start() {
  const $ = id => document.getElementById(id);
  const themeBtn = $('themeBtn');
  const applyTheme = theme => {
    document.documentElement.dataset.theme = theme;
    themeBtn.setAttribute('aria-pressed', String(theme === 'dark'));
    $('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
    $('themeLabel').textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  };
  let initialTheme = 'light';
  try { initialTheme = localStorage.getItem('catcare-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch {}
  applyTheme(initialTheme);
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('catcare-theme', next); } catch {}
  });
  const canvas = $('screen');
  const ctx = canvas.getContext('2d');
  const statusEl = $('status'), clockEl = $('clock'), tabsEl = $('tabs'), followEl = $('follow');
  const alertBar = $('alertBar'), dialog = $('inspect');
  const pauseBtn = $('pauseBtn'), pauseDialog = $('pauseDlg');

  let assets, data;
  try { [assets, data] = await Promise.all([loadAssets(), loadData()]); }
  catch (e) { statusEl.textContent = `Load error: ${e.message}. Launch the game with npm start, Live Server, or GitHub Pages, or open dist/catcare.html.`; return; }

  const world = createWorld();
  const cat = new Cat(world);
  const clock = new GameClock();
  const director = new EventDirector({ data, startMinute: clock.minutes });
  const progress = new Progress(data.book);
  const store = createSaveStore();
  let viewRoom = cat.room;
  let lastActive = null;
  let resetting = false;
  let paused = false;

  const gatherState = () => ({ paused, clockMinutes: clock.minutes, cat: cat.toJSON(), director: director.toJSON(), progress: progress.toJSON() });
  const saveNow = () => !resetting && store.save(gatherState());

  const toastEl = $('toast');
  let toastTimer = 0;
  function showToast(text, ms = 6000) {
    toastEl.textContent = text; toastEl.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
  }
  const updateBookDot = () => { $('bookDot').hidden = progress.unseenPages.length === 0; };

  const saved = store.load();
  if (saved) {
    paused = saved.paused === true;
    clock.minutes = saved.clockMinutes ?? clock.minutes;
    cat.restore(saved.cat);
    director.restore(saved.director);
    progress.restore(saved.progress);
    viewRoom = cat.room;
  }

  function pauseGame() {
    if (paused || resetting) return;
    paused = true;
    $('pauseSaveError').hidden = saveNow();
  }

  function showPause() {
    if (!pauseDialog.open) pauseDialog.showModal();
  }

  function openPause() {
    pauseGame();
    showPause();
  }

  function updatePageVisibility() {
    if (document.hidden) pauseGame();
    else if (paused) showPause();
  }

  pauseBtn.addEventListener('click', openPause);
  pauseBtn.disabled = false;
  pauseDialog.addEventListener('cancel', e => e.preventDefault());
  $('resumeBtn').addEventListener('click', () => {
    paused = false;
    last = performance.now();
    pauseDialog.close();
    saveNow();
  });

  function refreshCat() {
    const ep = director.active;
    cat.setModifiers(ep && !ep.finished ? ep.modifiers() : {});
    cat.setSick(!!ep?.looksSick);
  }

  function fastForward(minutes) {
    const stepSec = 0.5;
    const steps = Math.ceil(minutes / (stepSec * MINUTES_PER_SECOND));
    for (let i = 0; i < steps; i++) { clock.advance(stepSec); cat.update(stepSec, clock.hour); }
  }

  const book = createBook({ dialog: $('bookDlg'), book: data.book, getProgress: () => progress,
    onSeen: () => { updateBookDot(); saveNow(); } });
  const achievements = createAchievements({ dialog: $('achDlg'), getProgress: () => progress });
  const confirmDialog = createConfirm({ dialog: $('confirmDlg') });

  const inspect = createInspect({
    dialog, data,
    getEpisode: () => director.active,
    getClock: () => clock,
    fastForward,
    onPause: openPause,
    onChange: () => { refreshCat(); saveNow(); },
    onOutcome: outcome => {
      const rewards = progress.record(outcome, { day: clock.day });
      updateBookDot();
      saveNow();
      return rewards;
    },
    openBook: id => book.open(id),
    onFinish: () => { director.finishActive(clock.minutes); refreshCat(); lastActive = director.active; updateAlert(); saveNow(); },
  });

  $('bookBtn').addEventListener('click', () => book.open());
  $('trophyBtn').addEventListener('click', () => achievements.open());
  $('resetBtn').addEventListener('click', () => confirmDialog.ask({
    title: 'Start over?',
    text: 'All progress will be erased: game time, achievements, and unlocked book pages. This cannot be undone.',
    yes: 'Yes, start over', no: 'No, keep progress',
    onYes: () => { resetting = true; store.clear(); location.reload(); },
  }));

  const BOOK_SPOT = { x0: 72, x1: 100, y0: 14, y1: 24 };
  const toNative = e => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 160, y: ((e.clientY - r.top) / r.height) * 100 };
  };
  const overBook = p => viewRoom === 'living' && p.x >= BOOK_SPOT.x0 && p.x <= BOOK_SPOT.x1 && p.y >= BOOK_SPOT.y0 && p.y <= BOOK_SPOT.y1;
  canvas.addEventListener('click', e => { if (overBook(toNative(e))) book.open(); });
  const catBounds = () => {
    if (viewRoom !== cat.room) return null;
    const d = describeCat(cat);
    const img = assets.sprites[d.sprite];
    let x, y;
    if (d.anchor === 'tl') { x = d.x; y = d.y; }
    else if (d.anchor === 'bc') { x = d.x - img.width / 2; y = d.y - img.height; }
    else { const feet = SPRITE_FEET[d.sprite]; x = d.x - (d.flip ? img.width - feet.fx : feet.fx); y = d.y - feet.fy; }
    return { x, y, width: img.width, height: img.height };
  };
  let petStarted = -Infinity;
  canvas.addEventListener('dblclick', e => {
    const p = toNative(e), r = catBounds();
    if (!paused && r && p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height) {
      e.preventDefault();
      petStarted = cat.animTime;
    }
  });
  canvas.addEventListener('mousemove', e => {
    const p = toNative(e), r = catBounds();
    canvas.classList.toggle('hot', overBook(p) || !!(r && p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height));
  });
  $('inspectBtn').addEventListener('click', () => inspect.open());

  function updateAlert() {
    const show = !!director.active?.alertVisible;
    if (alertBar.hidden === show) alertBar.hidden = !show;
  }

  const tabButtons = {};
  for (const id of ROOM_IDS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = ROOMS[id].name;
    b.addEventListener('click', () => { followEl.checked = false; viewRoom = id; refreshTabs(); });
    tabsEl.appendChild(b);
    tabButtons[id] = b;
  }
  const refreshTabs = () => { for (const id of ROOM_IDS) tabButtons[id].setAttribute('aria-pressed', String(id === viewRoom)); };
  followEl.addEventListener('change', () => { if (followEl.checked) { viewRoom = cat.room; refreshTabs(); } });
  refreshTabs();

  // ---------- Game loop ----------
  let last = performance.now();
  let uiTimer = 0.25;
  function frame(now) {
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
    last = now;

    if (!paused && !dialog.open) {
      clock.advance(dt);
      cat.update(dt, clock.hour);
      const r = director.advance(dt * MINUTES_PER_SECOND, clock.minutes);
      if (r.started || r.events.length || lastActive !== director.active) { refreshCat(); lastActive = director.active; }
    }

    if (followEl.checked && viewRoom !== cat.room) { viewRoom = cat.room; refreshTabs(); }
    drawFrame(ctx, assets, { roomId: viewRoom, cat, clock, alert: !!director.active?.alertVisible, sparkle: progress.unseenPages.length > 0, petStarted });

    uiTimer += dt;
    if (uiTimer >= 0.25) {
      uiTimer = 0;
      updateAlert();
      clockEl.textContent = clock.format();
      statusEl.textContent = cat.room === viewRoom
        ? `You are in the ${ROOMS[viewRoom].name}. The cat is here.`
        : `You are in the ${ROOMS[viewRoom].name}. The cat is elsewhere.`;

    }
    requestAnimationFrame(frame);
  }
  refreshCat(); lastActive = director.active; updateBookDot(); refreshTabs();
  updatePageVisibility();
  if (saved && !paused) showToast(`Welcome back! Your game resumes at ${clock.format()}.`);
  requestAnimationFrame(frame);

  setInterval(() => { if (!paused) saveNow(); }, 5000);
  document.addEventListener('visibilitychange', updatePageVisibility);
  window.addEventListener('pagehide', pauseGame);
  window.addEventListener('pageshow', updatePageVisibility);

  window.__catcare = { director, cat, clock, inspect, progress, book, store, saveNow }; // Browser test hooks
}

start();
