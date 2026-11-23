import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bellmanBackup, solveProfile, recommendAction, sampleNext } from '../js/ai/mdp.js';
import { computePosterior } from '../js/ai/bayes.js';

const load = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf-8'));
const mdp = load('../data/mdp.json');
const data = load('../data/diseases.json');
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('Test case 1', () => {
  const model = { profile: mdp.profiles.red, travelPenalty: mdp.meta.travel_penalty_per_hour };
  const q = bellmanBackup(model, [0, 0, 0], 0, { gamma: 0.9, goCost: 3, travelHours: 1 });
  near(q.observe, -3);
  near(q.go, 14 - 3 - 0.3);
});

test('Test case 2', () => {
  const r = solveProfile(mdp, 'yellow');
  const model = { profile: mdp.profiles.yellow, travelPenalty: mdp.meta.travel_penalty_per_hour };
  r.V.forEach((v, s) => {
    const q = bellmanBackup(model, r.V, s, { gamma: mdp.meta.gamma, goCost: mdp.meta.go_cost, travelHours: 1 });
    near(v, Math.max(q.observe, q.go), 1e-6);
  });
});

test('Test case 3', () => {
  assert.deepEqual(solveProfile(mdp, 'green').policy, ['observe', 'observe', 'observe']);
});

test('Test case 4', () => {
  assert.deepEqual(solveProfile(mdp, 'red').policy, ['go', 'go', 'go']);
  assert.deepEqual(solveProfile(mdp, 'orange').policy, ['go', 'go', 'go']);
});

test('Test case 5', () => {
  assert.deepEqual(solveProfile(mdp, 'yellow').policy, ['observe', 'go', 'go']);
});

test('Test case 6', () => {
  const near1 = solveProfile(mdp, 'red', { travelHours: 1 }).Q[0].go;
  const far4 = solveProfile(mdp, 'red', { travelHours: 4 }).Q[0].go;
  assert.ok(far4 < near1);
});

test('Test case 7', () => {
  const { posterior } = computePosterior(data.conditions, { litter_frequent: true, straining_no_urine: true });
  assert.equal(recommendAction(mdp, data.conditions, posterior, 0).bestAction, 'go');
});

test('Test case 8', () => {
  const { posterior } = computePosterior(data.conditions, { sneezing: true, not_eating: false });
  assert.equal(recommendAction(mdp, data.conditions, posterior, 0).bestAction, 'observe');
});

test('Test case 9', () => {
  assert.equal(sampleNext(mdp, 'red', 0, 'go'), 'treated');
});

test('Test case 10', () => {
  let seed = 12345;
  const rng = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  let worse = 0;
  const N = 4000;
  for (let i = 0; i < N; i++) if (sampleNext(mdp, 'red', 0, 'observe', rng) === 1) worse++;
  assert.ok(Math.abs(worse / N - 0.5) < 0.05, `deterioration rate: ${worse / N}`);
});
