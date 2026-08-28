// Helpers shared by the attendance controller.
// Kept framework-free so they're easy to unit test.

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Minutes students are allowed to check in *before* a period officially
// starts, and the grace window *after* it ends.
export const EARLY_WINDOW_MIN = 10;
export const LATE_WINDOW_MIN = 15;

// Below this distance the live capture is considered the same person.
// face-api.js's own docs suggest ~0.6 as the general threshold; we tighten
// it slightly since this gates an attendance record rather than a search.
export const FACE_MATCH_THRESHOLD = 0.5;

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Finds the timetable period a student can currently check into, based on
 * the classroom's weekly timetable and the current server time.
 *
 * Returns null if there's no period happening right now (give or take the
 * early/late grace windows).
 */
export const findActivePeriod = (classroom, now = new Date()) => {
  const dayName = DAY_NAMES[now.getDay()];
  const periods = classroom?.timetable?.[dayName] || [];
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (const period of periods) {
    const start = toMinutes(period.startTime) - EARLY_WINDOW_MIN;
    const end = toMinutes(period.endTime) + LATE_WINDOW_MIN;
    if (nowMin >= start && nowMin <= end) {
      return period;
    }
  }
  return null;
};

/** Midnight (local) for the given date — used as the `date` field on records. */
export const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Standard Euclidean distance between two equal-length descriptor vectors. */
export const euclideanDistance = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return Infinity;
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

export const dayNameFromDate = (date = new Date()) => DAY_NAMES[date.getDay()];

/**
 * Finds the closest enrolled face to a live descriptor among a list of
 * candidates (used for kiosk-mode 1:N recognition). Returns the winning
 * candidate plus its distance, or null if nobody is within threshold.
 */
export const findBestFaceMatch = (descriptor, candidates) => {
  let best = null;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    if (!candidate.faceDescriptor?.length) continue;
    const distance = euclideanDistance(descriptor, candidate.faceDescriptor);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  if (!best || bestDistance > FACE_MATCH_THRESHOLD) return null;
  return { student: best, distance: bestDistance };
};
