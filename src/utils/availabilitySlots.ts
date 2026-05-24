export interface AvailabilitySlotRow {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  capacity: number;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WEEKDAYS = DAYS;

export function createEmptySlot(): AvailabilitySlotRow {
  return {
    id: crypto.randomUUID(),
    day: 'Mon',
    startTime: '09:00',
    endTime: '10:00',
    capacity: 10,
  };
}

/** Stored as: Mon|09:00|10:00|10 */
export function serializeAvailabilitySlots(slots: AvailabilitySlotRow[]): string[] {
  return slots
    .filter((s) => s.day && s.startTime && s.endTime)
    .map((s) => `${s.day}|${s.startTime}|${s.endTime}|${Math.max(1, s.capacity || 1)}`);
}

export function parseAvailabilitySlots(raw: string[] | undefined): AvailabilitySlotRow[] {
  if (!raw?.length) return [createEmptySlot()];

  return raw.map((line, index) => {
    const pipeParts = line.split('|');
    if (pipeParts.length >= 4) {
      return {
        id: `slot-${index}`,
        day: pipeParts[0],
        startTime: pipeParts[1],
        endTime: pipeParts[2],
        capacity: Math.max(1, Number(pipeParts[3]) || 1),
      };
    }

    const legacy = line.match(/^(\w+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/i);
    if (legacy) {
      return {
        id: `slot-${index}`,
        day: legacy[1],
        startTime: legacy[2].padStart(5, '0'),
        endTime: legacy[3].padStart(5, '0'),
        capacity: 1,
      };
    }

    return { ...createEmptySlot(), id: `slot-${index}` };
  });
}

export function formatAvailabilitySlotLabel(line: string): string {
  const slot = parseAvailabilitySlots([line])[0];
  const places = slot.capacity === 1 ? '1 place' : `${slot.capacity} places`;
  return `${slot.day} ${slot.startTime}–${slot.endTime} (${places} available)`;
}
