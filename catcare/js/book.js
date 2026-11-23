
import { assetUrl } from './resources.js';

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

export function buildSpreads(itemCount) {
  const spreads = [{ left: { type: 'cover' }, right: { type: 'intro' } }];
  for (let i = 0; i < itemCount; i += 2) {
    spreads.push({ left: { type: 'item', index: i }, right: i + 1 < itemCount ? { type: 'item', index: i + 1 } : { type: 'blank' } });
  }
  spreads.push({ left: { type: 'emergency' }, right: { type: 'about' } });
  return spreads;
}

export function spreadOfItem(index) { return 1 + Math.floor(index / 2); }

/**
 * @param opts.dialog       <dialog>
 * @param opts.book         data/book.json
 * @param opts.getProgress  () => Progress
 *
 */
export function createBook({ dialog, book, getProgress, onSeen = () => {} }) {
  const spreads = buildSpreads(book.items.length);
  let current = 0;
  let animate = false;

  const domain = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } };

  function page(def) {
    const progress = getProgress();
    switch (def.type) {
      case 'cover':
        return el('div', { class: 'page cover' },
          el('img', { src: assetUrl('assets/sprites/book_closed.png'), alt: '', class: 'pix big' }),
          el('h2', { text: book.meta.title_ru }),
          el('p', { class: 'muted', text: `Unlocked pages: ${progress.pages.length} of ${book.items.length}` }));
      case 'intro':
        return el('div', { class: 'page' }, el('h3', { text: 'How It Works' }), el('p', { text: book.intro_ru }),
          el('p', { class: 'muted', text: book.meta.note_ru }));
      case 'emergency':
        return el('div', { class: 'page' }, el('h3', { text: book.emergency.title_ru }),
          el('ol', {}, book.emergency.steps_ru.map(t => el('li', { text: t }))));
      case 'about':
        return el('div', { class: 'page' }, el('h3', { text: 'Evidence Confidence' }),
          el('ul', { class: 'legend' }, Object.entries(book.meta.confidence_ru).map(([k, t]) =>
            el('li', {}, el('span', { class: `tag ${k}`, text: confidenceMark(k) }), ' ' + t))),
          el('p', { class: 'muted', text: 'Sources are listed on each page. This is an educational game, not a replacement for veterinary care.' }));
      case 'blank':
        return el('div', { class: 'page blank' });
      case 'item': {
        const item = book.items[def.index];
        const open = progress.pages.includes(item.id);
        if (!open) {
          return el('div', { class: 'page locked' },
            el('img', { src: assetUrl(`assets/items/${item.icon}.png`), alt: '', class: 'pix big silhouette' }),
            el('h3', { text: 'Page Locked' }),
            el('p', { class: 'muted', text: '🔒 Complete a case successfully to unlock this page.' }));
        }
        const isNew = progress.unseenPages.includes(item.id);
        return el('div', { class: 'page' },
          el('div', { class: 'item-head' },
            el('img', { src: assetUrl(`assets/items/${item.icon}.png`), alt: '', class: 'pix' }),
            el('div', {},
              el('h3', { text: item.name_ru }),
              el('div', { class: 'tags' },
                el('span', { class: `tag ${item.confidence}`, text: `${confidenceMark(item.confidence)} ${book.meta.confidence_ru[item.confidence]}` }),
                isNew ? el('span', { class: 'new', text: 'new' }) : null))),
          el('p', {}, el('b', { text: 'Why It Is Dangerous: ' }), item.why_ru),
          el('p', {}, el('b', { text: 'Possible Signs: ' }), item.signs_ru),
          el('p', { class: 'tip', text: item.tip_ru }),
          el('p', { class: 'src' }, 'Sources: ', item.sources.map((u, i) =>
            [i ? ', ' : '', el('a', { href: u, target: '_blank', rel: 'noopener noreferrer', text: domain(u) })])));
      }
      default: return el('div', { class: 'page' });
    }
  }

  function confidenceMark(k) { return k === 'high' ? '●' : k === 'general' ? '◐' : '○'; }

  function render() {
    const s = spreads[current];
    const progress = getProgress();
    const left = page(s.left), right = page(s.right);

    const seenNow = [s.left, s.right].filter(p => p.type === 'item').map(p => book.items[p.index].id);

    const spread = el('div', { class: 'spread' + (animate ? ' turn' : '') }, left, el('div', { class: 'spine', 'aria-hidden': 'true' }), right);
    dialog.replaceChildren(
      el('div', { class: 'dlg-head' },
        el('h2', { text: '📖 ' + book.meta.title_ru }),
        el('button', { type: 'button', class: 'link', 'aria-label': 'Close Book', onclick: () => dialog.close(), text: '✕' })),
      spread,
      el('div', { class: 'book-nav' },
        el('button', { type: 'button', class: 'secondary', disabled: current === 0, onclick: () => go(-1), text: '‹ Back' }),
        el('span', { class: 'muted', 'aria-live': 'polite', text: `Spread ${current + 1} of ${spreads.length}` }),
        el('button', { type: 'button', class: 'secondary', disabled: current === spreads.length - 1, onclick: () => go(1), text: 'Next ›' })),
    );
    animate = false;
    let changed = false;
    for (const id of seenNow) if (progress.markSeen(id)) changed = true;
    if (changed) onSeen();
  }

  function go(delta) {
    const next = Math.min(spreads.length - 1, Math.max(0, current + delta));
    if (next === current) return;
    current = next; animate = true; render();
    dialog.querySelector('.book-nav button:not(:disabled)')?.focus?.();
  }

  dialog.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { go(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
  });

  return {
    open(itemId = null) {
      const idx = itemId ? book.items.findIndex(i => i.id === itemId) : -1;
      current = idx >= 0 ? spreadOfItem(idx) : 0;
      render();
      if (!dialog.open) dialog.showModal();
    },
  };
}
