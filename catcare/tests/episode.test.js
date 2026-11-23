import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Episode, EventDirector, STEP_MINUTES } from '../js/episode.js';

const load = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf-8'));
const data = { diseases: load('../data/diseases.json'), mdp: load('../data/mdp.json'),
               city: load('../data/city.json'), texts: load('../data/episodes.json') };
const seeded = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const make = (conditionId, seed = 1) => new Episode({ data, conditionId, rng: seeded(seed), startMinute: 0 });
function makeWith(conditionId, symptomId) {
  for (let seed = 1; seed < 500; seed++) { const ep = make(conditionId, seed); if (ep.truths[symptomId]) return ep; }
  throw new Error('Check 1');
}
const allChecks = ep => data.diseases.checks.forEach(c => ep.check(c.id));
const rate = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).filter(Boolean).length / n;

test('Test case 2', () => {
  for (const c of data.diseases.conditions) for (let seed = 1; seed <= 50; seed++) {
    const ep = make(c.id, seed);
    const autos = data.diseases.symptoms.filter(s => s.auto).map(s => s.id);
    assert.ok(autos.some(id => ep.truths[id]), `${c.id} seed ${seed}`);
    for (const id of autos) assert.ok(id in ep.known);
  }
});

test('Test case 3', () => {
  const ep = make('urinary');
  assert.ok(!('straining_no_urine' in ep.known));
  const { revealed } = ep.check('litter');
  assert.deepEqual(revealed, ['straining_no_urine', 'vocalizing_litter']);
  assert.ok('straining_no_urine' in ep.known);
  assert.ok(!('plant_chewed' in ep.known));
});

test('Test case 4', () => {
  const ep = make('respiratory');
  ep.check('breathing');
  assert.equal(ep.minute, 15);
});

test('Test case 5', () => {
  const ep = make('false_alarm');
  const events = [...ep.tick(STEP_MINUTES), ...ep.tick(STEP_MINUTES)];
  assert.equal(ep.severity, 0);
  assert.equal(events.at(-1).type, 'resolved');
  assert.equal(ep.outcome.grade, 'calm');
  assert.equal(ep.outcome.stars, 3);
});

test('Test case 6', () => {
  const share = rate(500, i => {
    const ep = make('urinary', 500 + i);
    for (let k = 0; k < 4; k++) ep.observe();
    return ep.severity === 2;
  });
  assert.ok(share > 0.7, `critical rate: ${share}`);   // Expected near 0.80 from the transition matrix
});

test('Test case 7', () => {
  assert.equal(make('urinary').decideGo('near', 12).grade, 'great');
  assert.equal(make('urinary').decideGo('near', 12).stars, 3);
  assert.equal(make('respiratory').decideGo('near', 12).grade, 'cautious');
  assert.equal(make('false_alarm').decideGo('near', 12).grade, 'unneeded');
  const late = make('urinary'); late.severity = 2;
  assert.equal(late.decideGo('near', 12).grade, 'late');
});

test('Test case 8', () => {
  assert.equal(make('urinary').decideGo('near', 23).error, 'closed');
  const ok = make('urinary').decideGo('night', 23);
  assert.equal(ok.grade, 'great');
  assert.ok(ok.travelMinutes > 25);
});

test('Test case 9', () => {
  let found = 0;
  for (let seed = 1; seed <= 80 && found < 5; seed++) {
    const ep = make('urinary', seed);
    ep.check('litter');
    if (ep.known.straining_no_urine.value) {
      found++;
      const r = ep.recommendation(12);
      assert.equal(r.bestAction, 'go');
      assert.ok(r.redFlags.length > 0);
    }
  }
  assert.ok(found >= 3);
});

test('Test case 10', () => {
  const ep = makeWith('not_eating', 'not_eating');
  assert.ok(ep.known.not_eating.value);
  assert.ok(!ep.redFlags().some(f => f.id === 'rf_24h'));
  ep.tick(24 * 60);
  assert.ok(ep.redFlags().some(f => f.id === 'rf_24h'));
});

test('Test case 11', () => {
  const goRate = id => rate(200, i => { const ep = make(id, 900 + i); allChecks(ep); return ep.recommendation(12).bestAction === 'go'; });
  assert.ok(goRate('urinary') >= 0.9, 'urinary');
  assert.ok(goRate('lily_poisoning') >= 0.85, 'lily');
  assert.ok(goRate('not_eating') >= 0.75, 'not_eating');
  assert.ok(goRate('false_alarm') <= 0.05, 'false_alarm');
  assert.ok(goRate('dental') <= 0.1, 'Check 12');
});

test('Test case 13', () => {
  for (const c of data.diseases.conditions) {
    const acc = rate(200, i => { const ep = make(c.id, 300 + i); allChecks(ep); return ep.recommendation(12).top.id === c.id; });
    assert.ok(acc >= 0.8, `${c.id}: ${acc}`);
  }
});

test('Test case 14', () => {
  assert.equal(makeWith('not_eating', 'not_eating').modifiers().refuseFood, true);
  assert.ok(makeWith('urinary', 'litter_frequent').modifiers().litterMult >= 4);
  assert.equal(makeWith('respiratory', 'sneezing').modifiers().sneeze, true);
});

test('Test case 15', () => {
  const a = make('urinary'); const b = make('urinary');
  b.markHint();
  assert.equal(a.decideGo('near', 12).hintUsed, false);
  assert.equal(b.decideGo('near', 12).hintUsed, true);
});

test('Test case 16', () => {
  const d = new EventDirector({ data, rng: seeded(42), startMinute: 480, firstDelay: 180 });
  assert.equal(d.advance(1, 500).started, null);
  const first = d.advance(1, 480 + 180).started;
  assert.ok(first);
  assert.equal(d.advance(1, 700).started, null);
  first.decideGo('near', 12);
  d.advance(1, 800);
  assert.equal(d.active, null);
  assert.equal(d.completed.length, 1);
  assert.ok(d.nextAt >= 800 + 720 && d.nextAt <= 800 + 1440);
  const second = d.start(900);
  assert.notEqual(second.condition.id, first.condition.id);
});
