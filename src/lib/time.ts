import type { TFunction } from 'i18next';

/** "Just now" · "40m" · "3h" · "2d" · then a short date (Feed Post meta, comments). */
export function timeAgo(date: Date, t: TFunction, now = new Date()) {
  const s = Math.max(0, (now.getTime() - date.getTime()) / 1000);
  if (s < 60) return t('time.justNow');
  if (s < 3600) return t('time.minutes', { n: Math.floor(s / 60) });
  if (s < 86400) return t('time.hours', { n: Math.floor(s / 3600) });
  if (s < 86400 * 7) return t('time.days', { n: Math.floor(s / 86400) });
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** "Today 7:20 PM" / "Yesterday 7:20 PM" / "Nov 3 · 7:20 PM" (8.2 Auto context). */
export function photoMoment(date: Date, t: TFunction, now = new Date()) {
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day(now) - day(date)) / 86400000);
  if (diff === 0) return t('time.today', { time });
  if (diff === 1) return t('time.yesterday', { time });
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${time}`;
}
