export function daysUntil(date: Date) {
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

export function daysSince(date: Date) {
  return Math.max(1, Math.round((Date.now() - date.getTime()) / 86_400_000));
}

export function withinLastDay(date: Date) {
  return Date.now() - date.getTime() <= 86_400_000;
}
