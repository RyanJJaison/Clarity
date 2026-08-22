/** Counts consecutive days (ending today) that have at least one timestamp. */
export function computeStreak(timestamps: string[], today: Date = new Date()): number {
  if (timestamps.length === 0) return 0;
  const days = new Set(timestamps.map((t) => t.slice(0, 10)));
  let streak = 0;
  const cursor = new Date(today);
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
