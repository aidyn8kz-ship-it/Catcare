import { routeToClinic } from './ai/astar.js';
import { drawCityMap, MAP_SIZE } from './cityMap.js';

const GRADES = {
  great:    { title: 'Right on Time!',                emoji: '🌟' },
  calm:     { title: 'Calm and Collected',        emoji: '🌿' },
  cautious: { title: 'Careful and Sensible',     emoji: '👍' },
  late:     { title: 'A Little Late',              emoji: '⏰' },
  unneeded: { title: 'False Alarm',          emoji: '🤷' },
};

function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null) node.append(kid);
  return node;
}

/**
 *
 * @param opts.data         { diseases, mdp, city, texts }
 *
 *
 *
 *
 *
 *
 *
 *
 */
export function createInspect({ dialog, data, getEpisode, getClock, fastForward, onPause, onChange, onFinish, onOutcome, openBook }) {
  let view = 'main';          // 'main' | 'clinics' | 'outcome'
  let message = '';
  let outcome = null;
  let rewards = null;
  let hintOpen = false;

  const symText = Object.fromEntries(data.diseases.symptoms.map(s => [s.id, s.text_ru]));
  const condName = Object.fromEntries(data.diseases.conditions.map(c => [c.id, c.name_ru]));

  function handleEvents(events) {
    for (const e of events) {
      if (e.type === 'worse') message = 'Time passed, and the cat’s condition got worse.';
      if (e.type === 'resolved') setOutcome(e.outcome);
    }
  }

  function setOutcome(o) {
    outcome = o;
    rewards = onOutcome(o);
    view = 'outcome';
  }

  function doCheck(id) {
    const ep = getEpisode();
    const check = data.diseases.checks.find(c => c.id === id);
    message = '';
    handleEvents(ep.check(id).events);
    fastForward(check.minutes);
    onChange();
    render();
  }

  function doObserve() {
    const ep = getEpisode();
    message = 'Six hours passed with no noticeable changes.';
    handleEvents(ep.observe());
    fastForward(360);
    onChange();
    render();
  }

  function doGo(clinicId) {
    const ep = getEpisode();
    const clock = getClock();
    const res = ep.decideGo(clinicId, clock.hour);
    if (res.error) { message = res.error === 'closed' ? 'This clinic will be closed when you arrive.' : 'No route is available.'; render(); return; }
    setOutcome(res);
    fastForward(res.travelMinutes);
    onChange();
    render();
  }

  function finish() {
    dialog.close();
    const o = outcome;
    view = 'main'; message = ''; outcome = null; rewards = null; hintOpen = false;
    onFinish(o);
  }

  function seenSection(ep) {
    const sy = Object.entries(ep.known);
    const present = sy.filter(([, k]) => k.value).map(([id]) => symText[id]);
    const absent = sy.filter(([, k]) => !k.value).map(([id]) => symText[id]);
    const stale = sy.some(([id, k]) => !data.diseases.symptoms.find(s => s.id === id).auto && ep.minute - k.minute >= 360);
    return el('section', {},
      el('h3', { text: 'What You Notice' }),
      el('p', { class: 'severity', text: ep.severityText }),
      present.length
        ? el('ul', {}, present.map(t => el('li', { text: t })))
        : el('p', { class: 'muted', text: 'Nothing specific yet.' }),
      absent.length ? el('p', { class: 'muted', text: 'Not observed: ' + absent.join(', ').toLowerCase() + '.' }) : null,
      stale ? el('p', { class: 'muted', text: 'Some checks are outdated. Consider checking again.' }) : null,
    );
  }

  function checksSection(ep) {
    return el('section', {},
      el('h3', { text: 'Check Symptoms' }),
      el('p', { class: 'muted', text: 'Each check takes time, and the cat may get worse while you investigate.' }),
      el('div', { class: 'btnrow' }, data.diseases.checks.map(c =>
        el('button', { type: 'button', class: 'secondary', onclick: () => doCheck(c.id) },
          (ep.checked[c.id] != null ? '✓ ' : '') + c.label_ru + ` (${c.minutes} min)`))),
    );
  }

  function hintSection(ep) {
    const clock = getClock();
    const d = el('details', { class: 'hint-box' }, el('summary', { text: '🤖 AI Hint (Bayes + MDP)' }));
    if (hintOpen) d.setAttribute('open', '');
    d.addEventListener('toggle', () => {
      if (d.open && !hintOpen) { hintOpen = true; ep.markHint(); render(); }
    });
    if (!hintOpen) {
      d.append(el('p', { class: 'muted', text: 'Using the hint will prevent you from earning the No AI Hint badge.' }));
      return d;
    }
    const r = ep.recommendation(clock.hour);
    const sorted = Object.entries(r.posterior).sort((a, b) => b[1] - a[1]);
    d.append(
      el('h4', { text: 'Bayes: Most Likely Conditions' }),
      el('div', { class: 'bars' }, sorted.map(([id, p]) =>
        el('div', { class: 'bar-row' },
          el('span', { text: condName[id] }),
          el('div', { class: 'bar' }, el('span', { style: `width:${Math.round(p * 100)}%` })),
          el('b', { text: Math.round(p * 100) + '%' })))),
      el('p', { text: `Probability of needing a vet: ${Math.round(r.needsVet * 100)}%.` }),
      el('h4', { text: 'MDP: Comparing Your Options' }),
      el('p', { text: `Expected reward: observe ${r.expected.observe.toFixed(1)}, visit clinic ${r.expected.go.toFixed(1)} (travel about ${Math.round(r.travelHours * 60)} min).` }),
      r.redFlags.length ? el('p', { class: 'flag', text: '🚩 ' + r.redFlags.map(f => `${f.when_ru}. ${f.advice_ru}`).join(' ') }) : null,
      el('p', { class: 'advice', text: r.bestAction === 'go' ? '➜ Recommendation: go to the clinic.' : '➜ Recommendation: continue observing.' }),
      el('p', { class: 'muted', text: 'This educational model uses assumed values and cannot provide a diagnosis.' }),
    );
    return d;
  }

  function mainView(ep) {
    return [
      el('div', { class: 'meta', text: getClock().format() }),
      message ? el('p', { class: 'message', role: 'status', text: message }) : null,
      seenSection(ep),
      checksSection(ep),
      hintSection(ep),
      el('section', {},
        el('h3', { text: 'What Should You Do?' }),
        el('div', { class: 'btnrow' },
          el('button', { type: 'button', class: 'secondary big', onclick: doObserve, text: '🕒 Observe for 6 More Hours' }),
          el('button', { type: 'button', class: 'primary big', onclick: () => { view = 'clinics'; message = ''; render(); }, text: '🚑 Go to a Clinic' }))),
    ];
  }

  function clinicsView() {
    const clock = getClock();
    const { options } = routeToClinic(data.city, clock.hour);
    const canvas = el('canvas', { class: 'citymap', 'aria-label': 'City map with routes' });
    const { w, h } = MAP_SIZE(data.city);
    canvas.width = w; canvas.height = h;
    const colors = ['#c53a45', '#2f6fd0'];
    queueMicrotask(() => drawCityMap(canvas.getContext('2d'), data.city,
      options.filter(o => o.reachable).map((o, i) => ({ path: o.path, color: colors[i % colors.length], dashed: !o.openOnArrival, width: 5 }))));
    return [
      el('div', { class: 'meta', text: clock.format() }),
      el('h3', { text: 'Where Should You Go?' }),
      message ? el('p', { class: 'message', role: 'status', text: message }) : null,
      canvas,
      el('p', { class: 'muted', text: '🏠 home · green cross: clinic · orange: heavy traffic · dashed route: clinic closed on arrival' }),
      el('div', { class: 'clinics' }, options.map((o, i) =>
        el('div', { class: 'clinic' },
          el('span', { class: 'swatch', style: `background:${colors[i % colors.length]}` }),
          el('div', {},
            el('b', { text: o.clinic.name_ru }),
            el('div', { class: 'muted', text: o.reachable
              ? `Travel ≈ ${Math.round(o.travelHours * 60)} min · ${o.openOnArrival ? 'open on arrival' : 'CLOSED on arrival'}`
              : 'Unreachable' })),
          el('button', { type: 'button', class: 'primary', disabled: !o.reachable || !o.openOnArrival, onclick: () => doGo(o.clinic.id), text: 'Go Here' })))),
      el('button', { type: 'button', class: 'link', onclick: () => { view = 'main'; message = ''; render(); }, text: '← Back to the Cat' }),
    ];
  }

  function rewardsBlock() {
    if (!rewards || (!rewards.achievements.length && !rewards.page)) return null;
    return el('div', { class: 'rewards' },
      el('h4', { text: 'Rewards' }),
      rewards.achievements.map(a => el('p', { class: 'reward' }, el('span', { 'aria-hidden': 'true', text: a.icon + ' ' }), el('b', { text: a.title }), ' · ' + a.desc)),
      rewards.page ? el('p', { class: 'reward' },
        '📖 New handbook page: ', el('b', { text: rewards.page.name_ru }), ' ',
        el('button', { type: 'button', class: 'secondary', onclick: () => openBook(rewards.page.id), text: 'Open Book' })) : null);
  }

  function outcomeView() {
    const g = GRADES[outcome.grade];
    const stars = '★'.repeat(outcome.stars) + '☆'.repeat(3 - outcome.stars);
    return [
      el('div', { class: 'outcome' },
        el('div', { class: 'emoji', text: g.emoji }),
        el('h3', { text: g.title }),
        el('div', { class: 'stars', 'aria-label': `${outcome.stars} out of 3 stars`, text: stars }),
        el('p', { text: outcome.text_ru }),
        outcome.clinic ? el('p', { class: 'muted', text: `${outcome.clinic}, travel time ${outcome.travelMinutes} min.` }) : null,
        el('p', { class: 'fact' }, el('b', { text: 'Good to Know: ' }), outcome.fact_ru),
        !outcome.hintUsed ? el('p', { class: 'badge', text: '🏅 No AI Hint' }) : null,
        rewardsBlock(),
        el('button', { type: 'button', class: 'primary big', onclick: finish, text: 'Continue' })),
    ];
  }

  function render() {
    const ep = getEpisode();
    if (!ep && view !== 'outcome') { dialog.close(); return; }
    const head = el('div', { class: 'dlg-head inspect-head' },
      el('h2', { text: view === 'outcome' ? 'Outcome' : '❗ Something Is Wrong With the Cat' }),
      el('div', { class: 'dlg-actions' },
        el('button', { type: 'button', onclick: onPause, text: 'Pause' }),
        view === 'outcome' ? null : el('button', { type: 'button', class: 'link', 'aria-label': 'Close', onclick: () => dialog.close(), text: '✕' })));
    const body = view === 'main' ? mainView(ep) : view === 'clinics' ? clinicsView() : outcomeView();
    dialog.replaceChildren(head, ...body.filter(Boolean));
  }

  return {
    open() { if (!dialog.open) { view = 'main'; render(); dialog.showModal(); } },
    render,
  };
}
