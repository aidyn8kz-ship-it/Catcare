
import { computePosterior, needsVetProbability, topCondition } from './ai/bayes.js';
import { solveProfile, recommendAction, sampleNext } from './ai/mdp.js';
import { routeToClinic } from './ai/astar.js';

export const STEP_MINUTES = 360;
export const EVIDENCE_WEIGHT = 0.7;
const ALERT_DELAY = 20;
const STARS = { great: 3, calm: 3, cautious: 2, late: 1, unneeded: 1 };

export class Episode {
  /**
   * @param data.diseases  data/diseases.json
   * @param data.mdp       data/mdp.json
   * @param data.city      data/city.json
   * @param data.texts     data/episodes.json
   */
  constructor({ data, conditionId, rng = Math.random, startMinute = 0 }) {
    this.data = data;
    this.rng = rng;
    this.condition = data.diseases.conditions.find(c => c.id === conditionId);
    if (!this.condition) throw new Error(`Unknown condition: ${conditionId}`);
    this.profile = this.condition.urgency;          // green | yellow | orange | red
    this.severity = 0;
    this.startMinute = startMinute;
    this.minute = startMinute;
    this.sinceStep = 0;
    this.calmSteps = 0;
    this.finished = false;
    this.outcome = null;
    this.hintUsed = false;
    this.checked = {};

    this.truths = this._sampleTruths();
    this.known = {};
    for (const s of data.diseases.symptoms.filter(s => s.auto)) this._learn(s.id);
  }

/*
 */
  _p(symptomId) {
    return this.condition.symptom_probabilities[symptomId] ?? 0;
  }

  _sampleTruths() {
    const truths = {};
    for (const s of this.data.diseases.symptoms) truths[s.id] = this.rng() < this._p(s.id);
    const autos = this.data.diseases.symptoms.filter(s => s.auto).map(s => s.id);
    if (!autos.some(id => truths[id])) {
      truths[autos.sort((a, b) => this._p(b) - this._p(a))[0]] = true;
    }
    return truths;
  }

  _learn(symptomId) {
    this.known[symptomId] = { value: this.truths[symptomId], minute: this.minute };
  }

  _escalate() {
    for (const s of this.data.diseases.symptoms) {
      if (!this.truths[s.id] && this._p(s.id) >= 0.2 && this.rng() < 0.5) this.truths[s.id] = true;
      if (s.auto) this._learn(s.id);
    }
  }

  modifiers() {
    const t = this.truths;
    const worse = this.severity >= 1;
    return {
      litterMult: t.litter_frequent ? (worse ? 5 : 4) : 1,
      refuseFood: !!t.not_eating,
      hideBoost: t.hiding ? (worse ? 60 : 45) : 0,
      tiredMult: t.lethargy ? 1.8 : 1,
      sneeze: !!t.sneezing,
    };
  }

  get alertVisible() { return !this.finished && this.minute - this.startMinute >= ALERT_DELAY; }
  get looksSick() { return !this.finished && this.profile !== 'green' && this.severity >= 1; }
  get severityText() { return this.data.texts.severity_ru[this.severity]; }

  tick(minutes) {
    if (this.finished) return [];
    const events = [];
    this.minute += minutes;
    this.sinceStep += minutes;
    while (this.sinceStep >= STEP_MINUTES && !this.finished) {
      this.sinceStep -= STEP_MINUTES;
      this._step(events);
    }
    return events;
  }

  _step(events) {
    if (this.profile === 'green') {
      this.calmSteps++;
      if (this.calmSteps >= 2) {
        this._finish('calm', this._text('resolved_ru'), 0);
        events.push({ type: 'resolved', outcome: this.outcome });
      }
      return;
    }
    const next = sampleNext(this.data.mdp, this.profile, this.severity, 'observe', this.rng);
    if (typeof next === 'number' && next > this.severity) {
      this.severity = next;
      this._escalate();
      events.push({ type: 'worse', severity: next });
    }
  }

  check(checkId) {
    const check = this.data.diseases.checks.find(c => c.id === checkId);
    const events = this.tick(check.minutes);
    if (this.finished) return { events, revealed: [] };
    for (const id of check.symptoms) this._learn(id);
    this.checked[checkId] = this.minute;
    return { events, revealed: check.symptoms };
  }

  observe() { return this.tick(STEP_MINUTES); }

  markHint() { this.hintUsed = true; }

  evidence() {
    return Object.fromEntries(Object.entries(this.known).map(([id, k]) => [id, k.value]));
  }

  redFlags() {
    const flags = this.data.diseases.red_flags.filter(rf => rf.all_of.every(id => this.known[id]?.value === true));
    if (this.known.not_eating?.value === true && this.minute - this.startMinute >= 24 * 60) {
      flags.push({ id: 'rf_24h', when_ru: 'Has not eaten for over 24 hours', advice_ru: 'Seek urgent veterinary care: the 24-hour rule.' });
    }
    return flags;
  }

  recommendation(hour) {
    const conditions = this.data.diseases.conditions;
    const { posterior, steps } = computePosterior(conditions, this.evidence(), { evidenceWeight: EVIDENCE_WEIGHT });
    const route = routeToClinic(this.data.city, hour);
    const travelHours = route.best?.travelHours ?? 1;
    const rec = recommendAction(this.data.mdp, conditions, posterior, this.severity, { travelHours });
    const redFlags = this.redFlags();
    return {
      posterior, steps, route, travelHours,
      top: topCondition(posterior),
      needsVet: needsVetProbability(conditions, posterior),
      expected: rec.expected,
      mdpAction: rec.bestAction,
      redFlags,
      bestAction: redFlags.length ? 'go' : rec.bestAction,
    };
  }

  decideGo(clinicId, hour) {
    const { options } = routeToClinic(this.data.city, hour);
    const option = options.find(o => o.clinic.id === clinicId);
    if (!option?.reachable) return { error: 'unreachable' };
    if (!option.openOnArrival) return { error: 'closed' };

    const solved = solveProfile(this.data.mdp, this.profile, { travelHours: option.travelHours });
    const policyAction = solved.policy[this.severity];
    let grade;
    if (this.profile === 'green') grade = 'unneeded';
    else if (policyAction === 'observe') grade = 'cautious';
    else if (this.severity === 2) grade = 'late';
    else grade = 'great';

    this._finish(grade, this._text(`${grade}_ru`), solved.Q[this.severity].go);
    this.outcome.travelMinutes = Math.round(option.travelHours * 60);
    this.outcome.clinic = option.clinic.name_ru;
    this.outcome.clinicId = option.clinic.id;
    return this.outcome;
  }

  _text(key) {
    const t = this.data.texts.conditions[this.condition.id];
    return t[key] ?? t.great_ru ?? '';
  }

  _finish(grade, text, reward) {
    this.finished = true;
    this.outcome = {
      grade, stars: STARS[grade], text_ru: text, fact_ru: this._text('fact_ru'), reward,
      conditionId: this.condition.id, conditionName: this.condition.name_ru,
      severity: this.severity, hintUsed: this.hintUsed,
      hour: (this.minute % (24 * 60)) / 60,
      checksUsed: Object.keys(this.checked).length,
    };
  }

  toJSON() {
    return {
      conditionId: this.condition.id, severity: this.severity, truths: this.truths, known: this.known,
      startMinute: this.startMinute, minute: this.minute, sinceStep: this.sinceStep, calmSteps: this.calmSteps,
      finished: this.finished, outcome: this.outcome, hintUsed: this.hintUsed, checked: this.checked,
    };
  }

  static fromJSON(data, s, rng = Math.random) {
    const ep = new Episode({ data, conditionId: s.conditionId, rng, startMinute: s.startMinute });
    Object.assign(ep, {
      severity: s.severity, truths: s.truths, known: s.known, minute: s.minute, sinceStep: s.sinceStep,
      calmSteps: s.calmSteps, finished: s.finished, outcome: s.outcome, hintUsed: s.hintUsed, checked: s.checked,
    });
    return ep;
  }
}

// ---------------------------------------------------------------------------
export class EventDirector {
  /**
 *
 *
   */
  constructor({ data, rng = Math.random, startMinute = 480, firstDelay = 180, gap = [720, 1440] }) {
    this.data = data;
    this.rng = rng;
    this.gap = gap;
    this.nextAt = startMinute + firstDelay;
    this.active = null;
    this.recent = [];
    this.completed = [];
  }

  start(nowMinute, conditionId = null) {
    const ids = this.data.diseases.conditions.map(c => c.id);
    const pool = ids.filter(id => !this.recent.includes(id));
    const id = conditionId ?? pool[Math.floor(this.rng() * pool.length)];
    this.recent = [id];
    this.active = new Episode({ data: this.data, conditionId: id, rng: this.rng, startMinute: nowMinute });
    return this.active;
  }

  advance(dtMinutes, nowMinute) {
    const result = { started: null, events: [] };
    if (this.active) {
      result.events = this.active.tick(dtMinutes);
      if (this.active.finished) this.#complete(nowMinute);
    } else if (nowMinute >= this.nextAt) {
      result.started = this.start(nowMinute);
    }
    return result;
  }

  finishActive(nowMinute) {
    if (this.active?.finished) this.#complete(nowMinute);
  }

  toJSON() {
    return {
      nextAt: this.nextAt, recent: this.recent,
      completed: this.active?.finished ? [...this.completed, this.active.outcome] : this.completed,
      active: this.active && !this.active.finished ? this.active.toJSON() : null,
    };
  }

  restore(s, nowMinute) {
    if (!s) return;
    this.nextAt = s.nextAt ?? this.nextAt;
    this.recent = s.recent ?? [];
    this.completed = s.completed ?? [];
    this.active = s.active ? Episode.fromJSON(this.data, s.active, this.rng) : null;
  }

  #complete(nowMinute) {
    this.completed.push(this.active.outcome);
    this.active = null;
    this.nextAt = nowMinute + this.gap[0] + this.rng() * (this.gap[1] - this.gap[0]);
  }
}
