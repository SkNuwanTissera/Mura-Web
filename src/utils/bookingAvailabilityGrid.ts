import { WEEKDAY_LABELS, TIME_PERIOD_LABELS } from './childAvailability';

const DAY_INDEX: Record<string, number> = {
  mon: 0,
  monday: 0,
  tue: 1,
  tues: 1,
  tuesday: 1,
  wed: 2,
  wednesday: 2,
  thu: 3,
  thur: 3,
  thurs: 3,
  thursday: 3,
  fri: 4,
  friday: 4,
  sat: 5,
  saturday: 5,
  sun: 6,
  sunday: 6,
};

function parseTimeMinutes(time: string): number | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function timeToPeriodIndex(time: string): number {
  const minutes = parseTimeMinutes(time);
  if (minutes == null) {
    return 1;
  }
  if (minutes < 12 * 60) {
    return 0;
  }
  if (minutes < 17 * 60) {
    return 1;
  }
  return 2;
}

export function mapBookingSlotToGridIndices(
  availabilitySlot?: string | null
): { dayIndex: number; periodIndex: number } | null {
  if (!availabilitySlot?.trim()) {
    return null;
  }

  const trimmed = availabilitySlot.trim();
  const pipeParts = trimmed.split('|');
  if (pipeParts.length >= 2) {
    const dayIndex = DAY_INDEX[pipeParts[0].trim().toLowerCase()];
    if (dayIndex == null) {
      return null;
    }
    return { dayIndex, periodIndex: timeToPeriodIndex(pipeParts[1]) };
  }

  const legacy = trimmed.match(/^(\w+)\s+(\d{1,2}:\d{2})/i);
  if (legacy) {
    const dayIndex = DAY_INDEX[legacy[1].toLowerCase()];
    if (dayIndex == null) {
      return null;
    }
    return { dayIndex, periodIndex: timeToPeriodIndex(legacy[2]) };
  }

  const label = trimmed.toLowerCase();
  let dayIndex: number | undefined;
  for (const [alias, index] of Object.entries(DAY_INDEX)) {
    if (label.includes(alias)) {
      dayIndex = index;
      break;
    }
  }
  if (dayIndex == null) {
    return null;
  }

  let periodIndex = 1;
  if (/\bmorning\b/.test(label)) {
    periodIndex = 0;
  } else if (/\bevening\b/.test(label)) {
    periodIndex = 2;
  } else if (/\bafternoon\b/.test(label)) {
    periodIndex = 1;
  }

  return { dayIndex, periodIndex };
}

export function createEmptyBookingCountGrid(): number[][] {
  return TIME_PERIOD_LABELS.map(() => WEEKDAY_LABELS.map(() => 0));
}

export function buildChildBookingCountGrid(
  bookings: Array<{ child?: { id: string }; availabilitySlot?: string; status: string }>,
  childId: string
): number[][] {
  const grid = createEmptyBookingCountGrid();

  for (const booking of bookings) {
    if (booking.child?.id !== childId) {
      continue;
    }
    if (booking.status?.toUpperCase() !== 'CONFIRMED') {
      continue;
    }
    const indices = mapBookingSlotToGridIndices(booking.availabilitySlot);
    if (!indices) {
      continue;
    }
    grid[indices.periodIndex][indices.dayIndex] += 1;
  }

  return grid;
}
