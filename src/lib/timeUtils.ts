// Wall-clock time utilities to handle exact local times from Google Sheets, Biometrics, and HR logs
// without introducing unwanted browser/server timezone offset shifts.

export function parseExactClockTime(timeStr: any): { hours: number; minutes: number } | null {
  if (timeStr === null || timeStr === undefined) return null;
  const str = String(timeStr).trim();
  if (!str) return null;

  // 1. Match AM/PM format (e.g., "09:15 AM", "9:15:00 PM", "05:24PM")
  const ampmMatch = str.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const ampm = ampmMatch[4]?.toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
  }

  // 2. Match ISO / Datetime format e.g. "2026-07-30T09:15:00", "2026-07-30 09:15:00"
  const isoTimeMatch = str.match(/[T\s](\d{1,2}):(\d{2})/);
  if (isoTimeMatch) {
    return {
      hours: parseInt(isoTimeMatch[1], 10),
      minutes: parseInt(isoTimeMatch[2], 10)
    };
  }

  // 3. Simple HH:mm format (e.g., "09:15", "17:30")
  if (str.includes(':')) {
    const parts = str.split(':').map(Number);
    if (!isNaN(parts[0])) {
      return { hours: parts[0], minutes: parts[1] || 0 };
    }
  }

  return null;
}

export function formatExactTime(timeStr: any): string {
  if (!timeStr) return '-';
  const parsed = parseExactClockTime(timeStr);
  if (!parsed) return '-';

  const ampm = parsed.hours >= 12 ? 'PM' : 'AM';
  const displayHours = parsed.hours % 12 === 0 ? 12 : parsed.hours % 12;
  const hStr = displayHours.toString().padStart(2, '0');
  const mStr = parsed.minutes.toString().padStart(2, '0');

  return `${hStr}:${mStr} ${ampm}`;
}
