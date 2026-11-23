import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computePosterior, topCondition, needsVetProbability } from '../js/ai/bayes.js';

const data = JSON.parse(readFileSync(new URL('../data/diseases.json', import.meta.url), 'utf-8'));
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

const toy = [
  { id: 'sick', prior: 0.3, symptom_probabilities: { sneeze: 0.8 }, urgency: 'red' },
  { id: 'fine', prior: 0.7, symptom_probabilities: { sneeze: 0.1 }, urgency: 'green' },
];

test('Test case 1', () => {
  const { posterior } = computePosterior(toy, { sneeze: true });
  near(posterior.sick, 0.24 / 0.31);
  near(posterior.fine, 0.07 / 0.31);
});

test('Test case 2', () => {
  const { posterior } = computePosterior(toy, {});
  near(posterior.sick, 0.3);
  near(posterior.fine, 0.7);
});

test('Test case 3', () => {
  const { posterior } = computePosterior(data.conditions, { litter_frequent: true, vomiting: true });
  near(Object.values(posterior).reduce((a, b) => a + b, 0), 1);
});

test('Test case 4', () => {
  const withSymptom = computePosterior(toy, { sneeze: true }).posterior.sick;
  const withoutSymptom = computePosterior(toy, { sneeze: false }).posterior.sick;
  assert.ok(withoutSymptom < 0.3 && withSymptom > 0.3);
});

test('Test case 5', () => {
  const obs = { litter_frequent: true, straining_no_urine: true };
  const strict = computePosterior(data.conditions, obs).posterior.urinary;
  const soft = computePosterior(data.conditions, obs, { evidenceWeight: 0.5 }).posterior.urinary;
  assert.ok(soft < strict);
});

test('Test case 6', () => {
  const { posterior } = computePosterior(data.conditions, {
    litter_frequent: true, straining_no_urine: true,
  });
  assert.equal(topCondition(posterior).id, 'urinary');
});

test('Test case 7', () => {
  const { posterior } = computePosterior(data.conditions, { sneezing: true, not_eating: false });
  assert.equal(topCondition(posterior).id, 'false_alarm');
});

test('Test case 8', () => {
  const { posterior } = computePosterior(data.conditions, { plant_chewed: true });
  assert.ok(needsVetProbability(data.conditions, posterior) > 0.8);
});
