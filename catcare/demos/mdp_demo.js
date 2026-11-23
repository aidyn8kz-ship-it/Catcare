import { readFileSync } from 'node:fs';
import { solveProfile, recommendAction } from '../js/ai/mdp.js';
import { computePosterior, needsVetProbability } from '../js/ai/bayes.js';

const load = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf-8'));
const mdp = load('../data/mdp.json');
const data = load('../data/diseases.json');
const names = Object.fromEntries(data.conditions.map(c => [c.id, c.name_ru]));
const f = x => x.toFixed(1).padStart(6);

console.log('=== INPUT ===');
console.log('States:', mdp.states_ru.join(' / '));
console.log('Actions:', mdp.actions_ru.join(' / '));
console.log('Time step:', mdp.meta.step_hours, 'game hours, gamma =', mdp.meta.gamma);

console.log('\n=== STEPS: value iteration for each urgency profile ===');
for (const profile of Object.keys(mdp.profiles)) {
  const r = solveProfile(mdp, profile, { travelHours: 1 });
  console.log(`\n[${profile}] ${mdp.profiles[profile].description_ru}  (converged after ${r.iterations} iterations)`);
  r.Q.forEach((q, s) => {
    const mark = a => (r.policy[s] === a ? ' ◀ best' : '');
    console.log(`  ${mdp.states_ru[s].padEnd(10)} Observe ${f(q.observe)}${mark('observe')}`.padEnd(46) + `Go ${f(q.go)}${mark('go')}`);
  });
}

console.log('\n=== BAYES + MDP: decisions under uncertainty ===');
const cases = [
  { title: 'Frequent litter use + straining', obs: { litter_frequent: true, straining_no_urine: true } },
  { title: 'One sneeze, eating normally', obs: { sneezing: true, not_eating: false } },
  { title: 'Not eating, lethargic', obs: { not_eating: true, lethargy: true } },
];
for (const c of cases) {
  const { posterior } = computePosterior(data.conditions, c.obs);
  const rec = recommendAction(mdp, data.conditions, posterior, 0, { travelHours: 1 });
  const top = Object.entries(posterior).sort((a, b) => b[1] - a[1])[0];
  console.log(`\n▶ ${c.title}`);
  console.log(`  Bayes: most likely «${names[top[0]]}» (${(top[1] * 100).toFixed(0)}%), P(vet needed) = ${(needsVetProbability(data.conditions, posterior) * 100).toFixed(0)}%`);
  console.log(`  MDP:   expected reward  Observe ${f(rec.expected.observe)}   Go ${f(rec.expected.go)}`);
  console.log(`  ➜ Recommendation: ${rec.bestAction === 'go' ? 'GO TO CLINIC' : 'observe longer'}`);
}

console.log('\n=== WHY THIS WORKS ===');
console.log('An MDP models the cost of waiting: conditions may worsen, and Bellman values compare acting now with waiting and possibly acting later.');
