export function hhmmToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(":").map((x) => parseInt(x, 10));
  return h * 60 + m;
}

export function minutesToHhmm(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function addMinutesToHhmm(hhmm, add) {
  return minutesToHhmm(hhmmToMinutes(hhmm) + add);
}

export function compareHhmm(a, b) {
  return hhmmToMinutes(a) - hhmmToMinutes(b);
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  const as = hhmmToMinutes(aStart);
  const ae = hhmmToMinutes(aEnd);
  const bs = hhmmToMinutes(bStart);
  const be = hhmmToMinutes(bEnd);
  return as < be && bs < ae;
}

export function dayOfWeekFromDate(dateStr) {

  const d = new Date(dateStr + "T00:00:00");
  return d.getDay();
}
