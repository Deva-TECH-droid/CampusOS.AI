// Helpers shared by the attendance controller.

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Attendance window in minutes as required by Requirement 10 (3 minutes from period start)
export const ATTENDANCE_WINDOW_MINUTES = 3;

// Below this distance the live capture is considered the same person.
export const FACE_MATCH_THRESHOLD = 0.5;

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Finds the timetable period for current time.
 * Enforces the 3-minute open window requirement:
 * During first 3 minutes: window is OPEN.
 * After 3 minutes: window is CLOSED.
 */
export const findActivePeriod = (classroom, now = new Date()) => {
  const dayName = DAY_NAMES[now.getDay()];
  const periods = classroom?.timetable?.[dayName] || [];
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowSec = now.getSeconds();

  for (const period of periods) {
    const start = toMinutes(period.startTime);
    const end = toMinutes(period.endTime);

    // If we're within the period's overall duration
    if (nowMin >= start && nowMin < end) {
      const minutesElapsed = nowMin - start;
      const isOpen = minutesElapsed < ATTENDANCE_WINDOW_MINUTES;
      const closeTimeMin = start + ATTENDANCE_WINDOW_MINUTES;
      const closeTimeH = String(Math.floor(closeTimeMin / 60)).padStart(2, "0");
      const closeTimeM = String(closeTimeMin % 60).padStart(2, "0");

      const secondsRemaining = isOpen
        ? (ATTENDANCE_WINDOW_MINUTES - minutesElapsed) * 60 - nowSec
        : 0;

      return {
        ...period,
        isOpen,
        windowMinutes: ATTENDANCE_WINDOW_MINUTES,
        windowCloseTime: `${closeTimeH}:${closeTimeM}`,
        secondsRemaining: Math.max(0, secondsRemaining),
        minutesElapsed,
        attendanceStatus: isOpen ? "OPEN" : "CLOSED",
      };
    }
  }

  // If no period is occurring right now, check if one starts in the next 15 minutes
  for (const period of periods) {
    const start = toMinutes(period.startTime);
    if (nowMin < start && nowMin >= start - 15) {
      return {
        ...period,
        isOpen: false,
        attendanceStatus: "UPCOMING",
        startsInMinutes: start - nowMin,
      };
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
 * Finds the closest enrolled face to a live descriptor among a list of candidates.
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
