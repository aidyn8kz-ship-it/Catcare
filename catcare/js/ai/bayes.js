//
//
//
//   P(C | S1, S2, ...)  ~  P(C) * P(S1 | C) * P(S2 | C) * ...
//
//

const MIN_P = 0.001;

function clamp(p) {
  return Math.min(1 - MIN_P, Math.max(MIN_P, p));
}

/**
 *
 *
 *
 *
 *
 *
 *
 * @param {Object} [options]
 *
 *
 * @returns {{ posterior: Object, steps: Array }}
 *
 *
 */
export function computePosterior(conditions, observed, options = {}) {
  const { defaultP = 0.02, evidenceWeight = 1 } = options;

  const steps = [];
  let total = 0;

  for (const c of conditions) {
    let score = c.prior;
    const factors = [];

    for (const [symptomId, present] of Object.entries(observed)) {
      const pSymptom = clamp(c.symptom_probabilities?.[symptomId] ?? defaultP);
      const likelihood = present ? pSymptom : 1 - pSymptom;
      const used = Math.pow(likelihood, evidenceWeight);
      factors.push({ symptomId, present, likelihood: used });
      score *= used;
    }

    steps.push({ conditionId: c.id, prior: c.prior, factors, score });
    total += score;
  }

  const posterior = {};
  for (const s of steps) {
    s.posterior = total > 0 ? s.score / total : 0;
    posterior[s.conditionId] = s.posterior;
  }

  return { posterior, steps };
}

export function topCondition(posterior) {
  let bestId = null;
  let bestP = -1;
  for (const [id, p] of Object.entries(posterior)) {
    if (p > bestP) {
      bestP = p;
      bestId = id;
    }
  }
  return { id: bestId, probability: bestP };
}

/**
 *
 *
 *
 */
export function needsVetProbability(conditions, posterior, urgentLevels = ['red', 'orange']) {
  let sum = 0;
  for (const c of conditions) {
    if (urgentLevels.includes(c.urgency)) sum += posterior[c.id] ?? 0;
  }
  return sum;
}
