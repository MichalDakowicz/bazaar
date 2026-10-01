import type { Lang } from '@/lib/categories';

/**
 * Dates as a shopping list wants them: "Wed 24", "9:12", "12m ago". Spelled out
 * from tables rather than `Intl`, so the same instant reads the same on Hermes,
 * on a browser, and in a test.
 */

const DAYS: Record<Lang, readonly string[]> = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  pl: ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'],
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "Wed 24" — a weekday and a day of the month, in local time. */
export function dayLabel(iso: string, lang: Lang): string {
  const date = new Date(iso);
  return `${DAYS[lang][date.getDay()]} ${date.getDate()}`;
}

/** "9:12" — local, 24-hour, no leading zero on the hour. */
export function clock(iso: string): string {
  const date = new Date(iso);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Midnight at the start of the local day `iso` falls on. */
export function startOfDay(ms: number): number {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Midnight at the start of the local Monday on or before `ms`. */
export function startOfWeek(ms: number): number {
  const date = new Date(startOfDay(ms));
  const sinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - sinceMonday);
  return date.getTime();
}

export function isToday(iso: string, now: number): boolean {
  return new Date(iso).getTime() >= startOfDay(now);
}

/** "Just now" · "12m ago" · "5h ago" · "3d ago", then a date (PING.md §12). */
export function relative(iso: string, now: number, lang: Lang): string {
  const elapsed = Math.max(0, now - new Date(iso).getTime());
  if (elapsed < 90_000) return lang === 'pl' ? 'Przed chwilą' : 'Just now';
  if (elapsed < HOUR) {
    const m = Math.round(elapsed / MINUTE);
    return lang === 'pl' ? `${m} min temu` : `${m}m ago`;
  }
  if (elapsed < DAY) {
    const h = Math.round(elapsed / HOUR);
    return lang === 'pl' ? `${h} godz. temu` : `${h}h ago`;
  }
  if (elapsed < 7 * DAY) {
    const d = Math.round(elapsed / DAY);
    return lang === 'pl' ? `${d} ${d === 1 ? 'dzień' : 'dni'} temu` : `${d}d ago`;
  }
  return dayLabel(iso, lang);
}

/** How long a trip has been going: "10 min", "1 h 5 min". */
export function duration(fromIso: string, now: number): string {
  const minutes = Math.max(0, Math.round((now - new Date(fromIso).getTime()) / MINUTE));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
