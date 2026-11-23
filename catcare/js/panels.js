import { ACHIEVEMENTS } from './progress.js';

function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null) node.append(kid);
  return node;
}

export function createAchievements({ dialog, getProgress }) {
  function render() {
    const p = getProgress();
    const got = ACHIEVEMENTS.filter(a => p.achievements[a.id]).length;
    dialog.replaceChildren(
      el('div', { class: 'dlg-head' },
        el('h2', { text: '🏆 Achievements' }),
        el('button', { type: 'button', class: 'link', 'aria-label': 'Close', onclick: () => dialog.close(), text: '✕' })),
      el('p', { class: 'muted', text: `Earned ${got} of ${ACHIEVEMENTS.length} · case stars: ${p.stars} · completed cases: ${p.episodes.length}` }),
      el('div', { class: 'ach-grid' }, ACHIEVEMENTS.map(a => {
        const have = p.achievements[a.id];
        return el('div', { class: 'ach' + (have ? ' got' : '') },
          el('div', { class: 'ach-icon', 'aria-hidden': 'true', text: a.icon }),
          el('div', {},
            el('b', { text: a.title }),
            el('div', { class: 'muted', text: a.desc }),
            el('div', { class: 'ach-state', text: have ? `Earned (day ${have.day})` : 'Still Locked' })));
      })));
  }
  return { open() { render(); if (!dialog.open) dialog.showModal(); } };
}

export function createConfirm({ dialog }) {
  return {
    ask({ title, text, yes = 'Yes', no = 'Cancel', onYes }) {
      dialog.replaceChildren(
        el('h2', { text: title }),
        el('p', { text }),
        el('div', { class: 'btnrow' },
          el('button', { type: 'button', class: 'secondary big', onclick: () => dialog.close(), text: no }),
          el('button', { type: 'button', class: 'primary big', onclick: () => { dialog.close(); onYes(); }, text: yes })));
      dialog.showModal();
      dialog.querySelector('button')?.focus();
    },
  };
}
