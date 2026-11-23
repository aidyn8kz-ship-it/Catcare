
const NIGHT_HOURS = h => h < 8 || h >= 20;

export const ACHIEVEMENTS = [
  { id: 'guardian',   icon: '🛡️', title: 'Cat Guardian',       desc: 'Get a sick cat to the vet in time.',
    test: o => o.grade === 'great' },
  { id: 'sharp_eye',  icon: '👁️', title: 'Sharp-Eyed Owner',   desc: 'Recognize danger and seek care before the condition gets worse.',
    test: o => o.grade === 'great' && o.severity === 0 },
  { id: 'calm_head',  icon: '🌿', title: 'Calm Under Pressure',      desc: 'Stay calm when a warning turns out to be false.',
    test: o => o.grade === 'calm' },
  { id: 'night_shift', icon: '🌙', title: 'Night Shift',         desc: 'Get the cat to a 24-hour clinic in time at night.',
    test: o => o.grade === 'great' && o.clinicId === 'night' && NIGHT_HOURS(o.hour) },
  { id: 'own_mind',   icon: '🧠', title: 'Independent Thinker',           desc: 'Make the right decision without an AI hint.',
    test: o => (o.grade === 'great' || o.grade === 'calm') && !o.hintUsed },
  { id: 'thorough',   icon: '🔍', title: 'Thorough Observer',  desc: 'Complete every check in a single case.',
    test: o => o.checksUsed >= 5 },
  { id: 'lily_guard', icon: '🌸', title: 'Lily Protector',        desc: 'Get timely help for a cat exposed to lilies.',
    test: o => o.conditionId === 'lily_poisoning' && o.grade === 'great' },
  { id: 'veteran',    icon: '🐾', title: 'Experienced Owner',        desc: 'Complete five cases.',
    test: (o, p) => p.episodes.length >= 5 },
  { id: 'librarian',  icon: '📚', title: 'Handbook Expert',          desc: 'Unlock every page of the Cat Safety Handbook.',
    test: (o, p) => p.pages.length >= p.bookIds.length },
];

export class Progress {
  /**
   * @param book  data/book.json
   */
  constructor(book) {
    this.book = book;
    this.bookIds = book.items.map(i => i.id);
    this.pages = [];
    this.seen = [];
    this.achievements = {};      // id → { day }
    this.episodes = [];
  }

  /**
 *
 *
   */
  record(outcome, { day = 1 } = {}) {
    this.episodes.push({
      conditionId: outcome.conditionId, grade: outcome.grade, stars: outcome.stars,
      hintUsed: outcome.hintUsed, day,
    });

    let page = null;
    if (outcome.stars >= 2) {
      const preferred = this.book.preferred_page?.[outcome.conditionId];
      const id = preferred && !this.pages.includes(preferred)
        ? preferred
        : this.bookIds.find(x => !this.pages.includes(x));
      if (id) { this.pages.push(id); page = this.book.items.find(i => i.id === id); }
    }

    const gained = [];
    for (const a of ACHIEVEMENTS) {
      if (this.achievements[a.id]) continue;
      if (a.test(outcome, this)) { this.achievements[a.id] = { day }; gained.push(a); }
    }
    return { achievements: gained, page };
  }

  get unseenPages() { return this.pages.filter(id => !this.seen.includes(id)); }
  markSeen(id) { if (this.pages.includes(id) && !this.seen.includes(id)) { this.seen.push(id); return true; } return false; }

  get stars() { return this.episodes.reduce((s, e) => s + e.stars, 0); }

  toJSON() { return { pages: this.pages, seen: this.seen, achievements: this.achievements, episodes: this.episodes }; }
  restore(s) {
    if (!s) return;
    this.pages = (s.pages ?? []).filter(id => this.bookIds.includes(id));
    this.seen = (s.seen ?? []).filter(id => this.pages.includes(id));
    this.achievements = s.achievements ?? {};
    this.episodes = s.episodes ?? [];
  }
}
