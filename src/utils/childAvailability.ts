export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const TIME_PERIOD_LABELS = ['Morning', 'Afternoon', 'Evening'] as const;

export type ParsedAvailability = {
  days: boolean[];
  periods: boolean[];
  labels: string[];
  hasStructuredData: boolean;
};

const DAY_ALIASES: Record<string, number> = {
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

function emptyAvailability(): ParsedAvailability {
  return {
    days: Array(7).fill(false),
    periods: [false, false, false],
    labels: [],
    hasStructuredData: false,
  };
}

export function parseChildAvailability(text?: string | null): ParsedAvailability {
  if (!text?.trim()) {
    return emptyAvailability();
  }

  const normalized = text.toLowerCase().trim();
  const days = Array(7).fill(false);
  const periods = [false, false, false];
  let hasStructuredData = false;

  if (/\bweekends?\b/.test(normalized)) {
    days[5] = true;
    days[6] = true;
    hasStructuredData = true;
  }

  if (/\bweekdays?\b/.test(normalized)) {
    for (let index = 0; index < 5; index += 1) {
      days[index] = true;
    }
    hasStructuredData = true;
  }

  if (/\bmon\s*[-–]\s*fri\b/.test(normalized) || /\bmonday\s*[-–]\s*friday\b/.test(normalized)) {
    for (let index = 0; index < 5; index += 1) {
      days[index] = true;
    }
    hasStructuredData = true;
  }

  Object.entries(DAY_ALIASES).forEach(([alias, index]) => {
    const pattern = new RegExp(`\\b${alias}\\b`, 'i');
    if (pattern.test(normalized)) {
      days[index] = true;
      hasStructuredData = true;
    }
  });

  if (/\b(mornings?|before\s*noon|\bam\b)\b/.test(normalized)) {
    periods[0] = true;
    hasStructuredData = true;
  }

  if (/\b(afternoons?|\bpm\b|after\s*school|afterschool)\b/.test(normalized)) {
    periods[1] = true;
    hasStructuredData = true;
  }

  if (/\b(evenings?|nights?)\b/.test(normalized)) {
    periods[2] = true;
    hasStructuredData = true;
  }

  const anyDay = days.some(Boolean);
  const anyPeriod = periods.some(Boolean);

  if (anyDay && !anyPeriod) {
    periods[0] = true;
    periods[1] = true;
    periods[2] = true;
  }

  if (anyPeriod && !anyDay) {
    for (let index = 0; index < 5; index += 1) {
      days[index] = true;
    }
  }

  const labels = hasStructuredData
    ? []
    : text
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

  return {
    days,
    periods,
    labels,
    hasStructuredData: hasStructuredData || labels.length > 0,
  };
}

/** Rows = morning/afternoon/evening, columns = Mon–Sun */
export function buildAvailabilityGrid(parsed: ParsedAvailability): boolean[][] {
  return TIME_PERIOD_LABELS.map((_, periodIndex) =>
    WEEKDAY_LABELS.map((_, dayIndex) => parsed.days[dayIndex] && parsed.periods[periodIndex])
  );
}
