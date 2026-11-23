//
//
//
//
//   Q(s, a) = R(s, a) + γ · Σ P(s' | s, a) · V(s')
//   V(s)    = max_a Q(s, a)
//

export function bellmanBackup(model, V, s, { gamma, goCost, travelHours }) {
  const { observe_transitions, observe_reward, go_benefit } = model.profile;
  const penalty = model.travelPenalty[s] * travelHours;

  let expectedNext = 0;
  observe_transitions[s].forEach((p, sNext) => { expectedNext += p * V[sNext]; });
  const qObserve = observe_reward[s] + gamma * expectedNext;

  const qGo = go_benefit[s] - goCost - penalty;

  return { observe: qObserve, go: qGo };
}

/**
 *
 *
 *
 *
 * @param {string} profileName 'green' | 'yellow' | 'orange' | 'red'
 *
 * @returns {{ V, Q, policy, iterations }}
 */
export function solveProfile(mdpData, profileName, opts = {}) {
  const { travelHours = 1 } = opts;
  const { gamma, go_cost: goCost, travel_penalty_per_hour } = mdpData.meta;
  const profile = mdpData.profiles[profileName];
  if (!profile) throw new Error(`Unknown profile: ${profileName}`);

  const model = { profile, travelPenalty: travel_penalty_per_hour };
  const n = mdpData.states.length;
  let V = new Array(n).fill(0);
  let Q = [];
  let iterations = 0;

  for (let it = 0; it < 1000; it++) {
    iterations = it + 1;
    const newV = new Array(n);
    Q = [];
    let delta = 0;
    for (let s = 0; s < n; s++) {
      const q = bellmanBackup(model, V, s, { gamma, goCost, travelHours });
      Q.push(q);
      newV[s] = Math.max(q.observe, q.go);
      delta = Math.max(delta, Math.abs(newV[s] - V[s]));
    }
    V = newV;
    if (delta < 1e-9) break;
  }

  const policy = Q.map(q => (q.go > q.observe ? 'go' : 'observe'));
  return { V, Q, policy, iterations };
}

/**
 *
 *
 *
 *
 *
 *
 *
 *
 * @param {number} stateIdx    0 stable | 1 worse | 2 critical
 */
export function recommendAction(mdpData, conditions, posterior, stateIdx = 0, opts = {}) {
  const cache = {};
  const expected = { observe: 0, go: 0 };
  const parts = [];

  for (const c of conditions) {
    const p = posterior[c.id] ?? 0;
    if (p === 0) continue;
    cache[c.urgency] ??= solveProfile(mdpData, c.urgency, opts);
    const q = cache[c.urgency].Q[stateIdx];
    expected.observe += p * q.observe;
    expected.go += p * q.go;
    parts.push({ conditionId: c.id, probability: p, urgency: c.urgency, q });
  }

  const bestAction = expected.go > expected.observe ? 'go' : 'observe';
  return { bestAction, expected, parts };
}

/**
 *
 *
 *
 */
export function sampleNext(mdpData, profileName, stateIdx, action, rng = Math.random) {
  if (action === 'go') return 'treated';
  const row = mdpData.profiles[profileName].observe_transitions[stateIdx];
  let r = rng();
  for (let s = 0; s < row.length; s++) {
    r -= row[s];
    if (r < 0) return s;
  }
  return row.length - 1;
}
