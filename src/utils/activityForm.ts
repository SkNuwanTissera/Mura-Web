import { Activity } from '../types';
import {
  AvailabilitySlotRow,
  createEmptySlot,
  parseAvailabilitySlots,
  serializeAvailabilitySlots,
} from './availabilitySlots';
import { splitPhone } from './phone';

export interface ActivityFormState {
  name: string;
  category: string;
  providerId: string;
  locationName: string;
  postcode: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  minAge: string;
  maxAge: string;
  priceGbp: string;
  startTime: string;
  endTime: string;
  slots: AvailabilitySlotRow[];
  contactPhone: string;
}

export function emptyActivityFormState(providerId = ''): ActivityFormState {
  return {
    name: '',
    category: '',
    providerId,
    locationName: '',
    postcode: '',
    address: '',
    city: '',
    minAge: '',
    maxAge: '',
    priceGbp: '',
    startTime: '',
    endTime: '',
    slots: [createEmptySlot()],
    contactPhone: '',
  };
}

export function activityFormStateFromActivity(activity: Activity): ActivityFormState {
  return {
    name: activity.name ?? '',
    category: activity.category ?? '',
    providerId: activity.providerId ?? '',
    locationName: activity.locationName ?? '',
    postcode: '',
    address: activity.address ?? '',
    city: activity.city ?? '',
    latitude: activity.latitude,
    longitude: activity.longitude,
    minAge: activity.minAge != null ? String(activity.minAge) : '',
    maxAge: activity.maxAge != null ? String(activity.maxAge) : '',
    priceGbp: activity.priceGbp != null ? String(activity.priceGbp) : '',
    startTime: activity.startTime ?? '',
    endTime: activity.endTime ?? '',
    slots: parseAvailabilitySlots(activity.availabilitySlots),
    contactPhone: activity.contactPhone ?? '',
  };
}

export function activityFormStateToPayload(form: ActivityFormState, providerId: string): Partial<Activity> {
  return {
    providerId,
    name: form.name.trim(),
    category: form.category.trim(),
    locationName: form.locationName.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    latitude: form.latitude,
    longitude: form.longitude,
    minAge: Number(form.minAge),
    maxAge: Number(form.maxAge),
    priceGbp: form.priceGbp ? Number(form.priceGbp) : undefined,
    startTime: form.startTime || undefined,
    endTime: form.endTime || undefined,
    availabilitySlots: serializeAvailabilitySlots(form.slots),
    contactPhone: form.contactPhone.trim() || undefined,
  };
}

export function validateActivityFormState(form: ActivityFormState): string | null {
  if (!form.name.trim()) return 'Activity name is required.';
  if (!form.category.trim()) return 'Category is required.';
  if (!form.providerId) return 'Provider is required.';
  if (!form.locationName.trim()) return 'Location is required.';
  if (!form.minAge || !form.maxAge) return 'Min and max age are required.';
  if (Number(form.minAge) > Number(form.maxAge)) return 'Min age cannot be greater than max age.';
  const { number } = splitPhone(form.contactPhone);
  if (number && number.length < 6) return 'Enter a valid phone number.';
  return null;
}
