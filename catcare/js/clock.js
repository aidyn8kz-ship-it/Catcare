
export const MINUTES_PER_SECOND = 3;

export class GameClock {
  constructor(startMinutes = 8 * 60) {
    this.minutes = startMinutes;
  }
  advance(dtSeconds) { this.minutes += dtSeconds * MINUTES_PER_SECOND; }
  get day() { return Math.floor(this.minutes / (24 * 60)) + 1; }
  get hour() { return (this.minutes % (24 * 60)) / 60; }
  get isNight() { return this.hour < 6 || this.hour >= 21; }
  format() {
    const m = Math.floor(this.minutes % (24 * 60));
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    return `Day ${this.day}, ${hh}:${mm}`;
  }
}
