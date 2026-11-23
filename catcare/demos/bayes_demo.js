import { readFileSync } from 'node:fs';
import { computePosterior, topCondition, needsVetProbability } from '../js/ai/bayes.js';

const data = JSON.parse(readFileSync(new URL('../data/diseases.json', import.meta.url), 'utf-8'));
const names = Object.fromEntries(data.conditions.map(c => [c.id, c.name_ru]));
const sym = Object.fromEntries(data.symptoms.map(s => [s.id, s.text_ru]));
const pct = p => (p * 100).toFixed(1).padStart(5) + '%';

const observed = { litter_frequent: true, straining_no_urine: true };

console.log('=== INPUT: owner observations ===');
for (const [id, present] of Object.entries(observed)) console.log(` ${present ? '✔' : '✘'} ${sym[id]}`);

const { posterior, steps } = computePosterior(data.conditions, observed);

console.log('\n=== STEPS: prior × likelihood for each symptom ===');
for (const s of steps) {
  const f = s.factors.map(x => x.likelihood.toFixed(2)).join(' × ');
  console.log(` ${names[s.conditionId].padEnd(48)} ${s.prior.toFixed(2)} × ${f} = ${s.score.toExponential(2)}`);
}

console.log('\n=== RESULT: normalized posterior ===');
for (const [id, p] of Object.entries(posterior).sort((a, b) => b[1] - a[1])) {
  console.log(` ${pct(p)}  ${'█'.repeat(Math.round(p * 30))} ${names[id]}`);
}
const top = topCondition(posterior);
console.log(`\nMost likely: ${names[top.id]} (${pct(top.probability)})`);
console.log(`P(vet needed) = ${pct(needsVetProbability(data.conditions, posterior))}`);

console.log('\n=== WHY THIS WORKS ===');
console.log('Bayes multiplies each prior by the likelihood of the observed evidence to compare possible conditions.');
