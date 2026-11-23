import { ACTIVITY } from './worldData.js';
import { MINUTES_PER_SECOND } from './clock.js';
import { OPPOSITE } from './world.js';

const WALK_SPEED = 24;
const RATES = { hunger: 6, tired: 5, play: 7, litter: 4 };
const clamp = v => Math.min(100, Math.max(0, v));

export class Cat {
  /**
 *
 *
 *
   */
  constructor(world, { rng = Math.random, onActivity = null } = {}) {
    this.world = world;
    this.rng = rng;
    this.onActivity = onActivity;

    this.room = 'living';
    this.x = 60; this.y = 90;
    this.facing = 'right';
    this.stance = 'side';
    this.pose = null;

    this.mode = 'idle';                  // 'idle' | 'walking' | 'busy'
    this.idleTimer = 1;
    this.steps = []; this.stepIndex = 0; this.path = [];
    this.target = null;
    this.busy = null;
    this.animTime = 0;
    this.clockMinutes = 0;

    this.needs = {
      hunger: 25 + rng() * 25, tired: 5 + rng() * 15,
      play: 20 + rng() * 25, litter: 10 + rng() * 15,
    };
    this.sick = false;
    this.modifiers = { litterMult: 1, hideBoost: 0, tiredMult: 1, refuseFood: false, sneeze: false };
    this.effects = [];
    this.sneezeTimer = 8;
    this.history = [];
  }

  update(dt, hour = 12) {
    const gameMin = dt * MINUTES_PER_SECOND;
    this.clockMinutes += gameMin;
    this.animTime += dt;
    this._decay(gameMin, hour);
    this._sneezing(dt);
    if (this.mode === 'idle') {
      this.idleTimer -= dt;
      if (this.idleTimer <= 0) this._decide();
    } else if (this.mode === 'walking') this._walk(dt);
    else if (this.mode === 'busy') this._doActivity(gameMin);
  }

  _decay(gameMin, hour) {
    const night = hour < 6 || hour >= 22;
    const asleep = this.busy?.kind === 'sleep';
    for (const k of Object.keys(RATES)) {
      if (this.busy && ACTIVITY[this.busy.kind].need === k) continue;
      let r = RATES[k];
      if (k === 'tired' && night) r *= 1.6;
      if (k === 'tired') r *= this.modifiers.tiredMult;
      if (k === 'litter') r *= this.modifiers.litterMult;
      if (k === 'hunger' && asleep) r *= 0.5;
      this.needs[k] = clamp(this.needs[k] + (r * gameMin) / 60);
    }
  }

  _allSpots() {
    const list = [];
    for (const [roomId, room] of Object.entries(this.world.rooms)) {
      for (const spot of room.spots) list.push({ kind: spot.kind, room: roomId, spot });
    }
    return list;
  }

  _decide() {
    const r = this.rng;
    const score = {
      eat: this.needs.hunger + r() * 20,
      sleep: this.needs.tired + r() * 20,
      litter: this.needs.litter + r() * 20,
      play: this.needs.play + r() * 20,
      sit: 25 + r() * 25,
      look: 20 + r() * 25,
      hide: 5 + r() * 15 + this.modifiers.hideBoost,
    };
    const kind = Object.keys(score).sort((a, b) => score[b] - score[a])[0];
    const options = this._allSpots().filter(s => s.kind === kind);
    const here = options.filter(s => s.room === this.room);
    const pool = here.length && r() < 0.66 ? here : options;
    this._goTo(pool[Math.floor(r() * pool.length)]);
  }

  _goTo(target) {
    const hops = this.world.route(this.room, target.room);
    if (hops === null) { this.idleTimer = 1; return; }
    this.target = target;
    this.steps = [
      ...hops.map(h => ({ type: 'exit', side: h.side })),
      { type: 'spot' },
    ];
    this.stepIndex = 0;
    this.mode = 'walking';
    if (!this._startStep()) { this.mode = 'idle'; this.idleTimer = 1; }
  }

  _startStep() {
    const step = this.steps[this.stepIndex];
    const goal = step.type === 'exit' ? this.world.doorPoint(step.side) : this.target.spot.feet;
    const path = this.world.findPath(this.room, { x: this.x, y: this.y }, goal);
    if (!path) return false;
    this.path = path.slice(1);
    return true;
  }

  _walk(dt) {
    let budget = WALK_SPEED * dt;
    while (budget > 0 && this.path.length) {
      const p = this.path[0];
      const dx = p.x - this.x, dy = p.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.5) this.facing = dx > 0 ? 'right' : 'left';
      if (dist <= budget) { this.x = p.x; this.y = p.y; budget -= dist; this.path.shift(); }
      else { this.x += (dx / dist) * budget; this.y += (dy / dist) * budget; budget = 0; }
    }
    if (this.path.length === 0) this._stepFinished();
  }

  _stepFinished() {
    const step = this.steps[this.stepIndex];
    if (step.type === 'exit') {
      const nextRoom = this.world.rooms[this.room].exits[step.side].to;
      this.room = nextRoom;
      const p = this.world.doorPoint(OPPOSITE[step.side]);
      this.x = p.x; this.y = p.y;
    } else {
      this._beginActivity();
      return;
    }
    this.stepIndex++;
    if (!this._startStep()) { this.mode = 'idle'; this.idleTimer = 1; }
  }

  _beginActivity() {
    const { kind, spot } = this.target;
    const act = ACTIVITY[kind];
    this.mode = 'busy';
    this.facing = spot.facing === 'front' ? this.facing : spot.facing;
    this.stance = spot.facing === 'front' ? 'front' : 'side';
    this.pose = spot.pose ?? null;
    const refused = kind === 'eat' && this.modifiers.refuseFood;
    this.busy = {
      kind, remaining: refused ? 5 : act.minutes, total: refused ? 5 : act.minutes,
      startNeed: act.need ? this.needs[act.need] : 0, refused,
    };
  }

  _doActivity(gameMin) {
    const b = this.busy;
    const act = ACTIVITY[b.kind];
    b.remaining -= gameMin;
    if (act.need && !b.refused) {
      const done = Math.min(1, Math.max(0, 1 - b.remaining / b.total));
      this.needs[act.need] = clamp(b.startNeed * (1 - done));
    }
    if (b.remaining <= 0) this._finishActivity();
  }

  _finishActivity() {
    const kind = this.busy.kind;
    const act = ACTIVITY[kind];
    const refused = this.busy.refused === true;
    if (act.need && !refused) this.needs[act.need] = 0;
    const entry = { kind, room: this.room, minute: Math.round(this.clockMinutes), refused };
    this.history.push(entry);
    this.onActivity?.(entry);
    this.busy = null;
    this.pose = null;
    this.stance = 'side';
    this.mode = 'idle';
    this.idleTimer = 0.5 + this.rng() * 2;
  }

  setSick(value) { this.sick = value; }

  toJSON() {
    return { room: this.room, x: this.x, y: this.y, facing: this.facing, needs: this.needs };
  }

  restore(s) {
    if (!s) return;
    Object.assign(this, { room: s.room, x: s.x, y: s.y, facing: s.facing });
    this.needs = { ...this.needs, ...s.needs };
    this.mode = 'idle'; this.idleTimer = 1; this.pose = null; this.busy = null;
    this.stance = 'side'; this.path = []; this.steps = []; this.stepIndex = 0; this.target = null;
  }

  setModifiers(m) {
    this.modifiers = { litterMult: 1, hideBoost: 0, tiredMult: 1, refuseFood: false, sneeze: false, ...m };
  }

  _sneezing(dt) {
    this.effects = this.effects.filter(e => e.until > this.animTime);
    if (!this.modifiers.sneeze || this.pose) return;
    this.sneezeTimer -= dt;
    if (this.sneezeTimer <= 0) {
      this.effects.push({ sprite: 'bubble_sneeze', until: this.animTime + 1.4 });
      this.sneezeTimer = 10 + this.rng() * 15;
    }
  }
}
