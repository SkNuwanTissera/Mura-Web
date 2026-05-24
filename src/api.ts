import { Activity, ActivityBooking, ActivitySearchFilters, CartCheckoutResult, CheckoutSessionResponse, CartItem, Child, ChatMessage, ManagedUser, PaymentHistory, Provider, User, PageResult, UserRole } from './types';
import { authHeaders, normalizeAuthUser } from './authStorage';

const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;

async function parseJson<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json();
  }

  const bodyText = await response.text();
  let errorMessage = response.statusText || 'API request failed';

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const errorBody = JSON.parse(bodyText);
      if (errorBody.message) {
        errorMessage = errorBody.message;
      } else if (errorBody.error) {
        errorMessage = errorBody.error;
      } else if (errorBody.details && Array.isArray(errorBody.details)) {
        errorMessage = errorBody.details.join('; ');
      }
    } catch {
      errorMessage = bodyText || errorMessage;
    }
  } else if (bodyText) {
    errorMessage = bodyText;
  }

  throw new Error(errorMessage || 'API request failed');
}

export async function loginUser(email: string, password: string): Promise<User> {
  const response = await fetch(`${apiBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const raw = await parseJson<Record<string, unknown>>(response);
  return normalizeAuthUser(raw);
}

export async function signupUser(name: string, email: string, password: string): Promise<User> {
  const response = await fetch(`${apiBase}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const raw = await parseJson<Record<string, unknown>>(response);
  return normalizeAuthUser(raw);
}

export async function googleSignInWithToken(idToken: string): Promise<User> {
  const response = await fetch(`${apiBase}/api/auth/google-signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  const raw = await parseJson<Record<string, unknown>>(response);
  return normalizeAuthUser(raw);
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await fetch(`${apiBase}/api/auth/me`, { headers: authHeaders(false) });
  const raw = await parseJson<Record<string, unknown>>(response);
  return normalizeAuthUser(raw);
}

function normalizeManagedUser(raw: Record<string, unknown>): ManagedUser {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    email: String(raw.email ?? ''),
    role: (raw.role as UserRole) ?? 'PARENT',
    parentId: (raw.parentId ?? raw.parent_id) as string | undefined,
    providerId: (raw.providerId ?? raw.provider_id) as string | undefined,
    providerName: (raw.providerName ?? raw.provider_name) as string | undefined,
    createdAt: (raw.createdAt ?? raw.created_at) as string | undefined,
  };
}

export async function fetchManagedUsers(): Promise<ManagedUser[]> {
  const response = await fetch(`${apiBase}/api/admin/users`, { headers: authHeaders(false) });
  const rawItems = await parseJson<Record<string, unknown>[]>(response);
  return rawItems.map(normalizeManagedUser);
}

export async function updateUserRole(userId: string, role: UserRole, providerId?: string): Promise<ManagedUser> {
  const response = await fetch(`${apiBase}/api/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ role, providerId }),
  });
  const raw = await parseJson<Record<string, unknown>>(response);
  return normalizeManagedUser(raw);
}

function normalizeActivity(raw: any): Activity {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    providerId: raw.provider_id ?? raw.providerId,
    providerName: raw.provider_name ?? raw.providerName ?? '',
    locationName: raw.location_name ?? raw.locationName ?? '',
    address: raw.address ?? '',
    city: raw.city ?? '',
    latitude: raw.latitude ?? raw.lat ?? null,
    longitude: raw.longitude ?? raw.lon ?? null,
    minAge: raw.min_age ?? raw.minAge ?? 0,
    maxAge: raw.max_age ?? raw.maxAge ?? 0,
    availabilitySlots: raw.availability_slots ?? raw.availabilitySlots ?? [],
    startTime: raw.start_time ?? raw.startTime,
    endTime: raw.end_time ?? raw.endTime,
    priceGbp: raw.price_gbp ?? raw.priceGbp,
    contactPhone: raw.contact_phone ?? raw.contactPhone,
  };
}

function normalizeProvider(raw: any): Provider {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    email: raw.email,
    phone: raw.phone,
    website: raw.website,
    city: raw.city,
    address: raw.address,
    createdAt: raw.created_at ?? raw.createdAt,
  };
}

export async function fetchProviders(): Promise<Provider[]> {
  const response = await fetch(`${apiBase}/api/providers`, { headers: authHeaders(false) });
  const rawItems = await parseJson<any[]>(response);
  return rawItems.map(normalizeProvider);
}

export async function fetchProviderById(id: string): Promise<Provider> {
  const response = await fetch(`${apiBase}/api/providers/${id}`, { headers: authHeaders(false) });
  const raw = await parseJson<any>(response);
  return normalizeProvider(raw);
}

export async function createProvider(data: Omit<Provider, 'id' | 'createdAt'>): Promise<Provider> {
  const response = await fetch(`${apiBase}/api/providers`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const raw = await parseJson<any>(response);
  return normalizeProvider(raw);
}

export async function updateProvider(id: string, data: Partial<Omit<Provider, 'id' | 'createdAt'>>): Promise<Provider> {
  const response = await fetch(`${apiBase}/api/providers/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const raw = await parseJson<any>(response);
  return normalizeProvider(raw);
}

export async function deleteProvider(id: string): Promise<void> {
  await fetch(`${apiBase}/api/providers/${id}`, { method: 'DELETE', headers: authHeaders(false) });
}

export async function fetchActivitiesByProvider(providerId: string): Promise<Activity[]> {
  const response = await fetch(`${apiBase}/api/providers/${providerId}/activities`, { headers: authHeaders(false) });
  const rawItems = await parseJson<any[]>(response);
  return rawItems.map(normalizeActivity);
}

export async function createActivity(data: Partial<Activity>): Promise<Activity> {
  const response = await fetch(`${apiBase}/api/activities`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      provider_id: data.providerId,
      name: data.name,
      category: data.category,
      location_name: data.locationName,
      address: data.address,
      city: data.city,
      min_age: data.minAge,
      max_age: data.maxAge,
      price_gbp: data.priceGbp,
      start_time: data.startTime,
      end_time: data.endTime,
      availability_slots: data.availabilitySlots,
      contact_phone: data.contactPhone,
      latitude: data.latitude,
      longitude: data.longitude,
    }),
  });
  const raw = await parseJson<any>(response);
  return normalizeActivity(raw);
}

export async function updateActivity(id: string, data: Partial<Activity>): Promise<Activity> {
  const response = await fetch(`${apiBase}/api/activities/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      provider_id: data.providerId,
      name: data.name,
      category: data.category,
      location_name: data.locationName,
      address: data.address,
      city: data.city,
      min_age: data.minAge,
      max_age: data.maxAge,
      price_gbp: data.priceGbp,
      start_time: data.startTime,
      end_time: data.endTime,
      availability_slots: data.availabilitySlots,
      contact_phone: data.contactPhone,
      latitude: data.latitude,
      longitude: data.longitude,
    }),
  });
  const raw = await parseJson<any>(response);
  return normalizeActivity(raw);
}

export async function deleteActivity(id: string): Promise<void> {
  await fetch(`${apiBase}/api/activities/${id}`, { method: 'DELETE', headers: authHeaders(false) });
}

export async function searchActivities(filters: ActivitySearchFilters): Promise<PageResult<Activity>> {
  const response = await fetch(`${apiBase}/api/activities/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters)
  });
  const rawItems = await parseJson<any[]>(response);
  const items = rawItems.map(normalizeActivity);
  const totalHeader = response.headers.get('X-Total-Count');
  const total = totalHeader ? Number(totalHeader) : items.length;
  return {
    items,
    total,
    page: filters.page || 1,
    limit: filters.limit || items.length,
  };
}

export async function geocodePostcode(postcode: string): Promise<{ lat: number; lon: number } | undefined> {
  const query = encodeURIComponent(postcode.trim());
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) {
    return undefined;
  }
  return {
    lat: Number(results[0].lat),
    lon: Number(results[0].lon),
  };
}

function normalizeChild(raw: any): Child {
  return {
    id: raw.id,
    name: raw.name,
    dateOfBirth: raw.date_of_birth ?? raw.dateOfBirth,
    age: raw.age,
    preferredCity: raw.preferred_city ?? raw.preferredCity,
    interests: raw.interests,
    maxBudgetGbp: raw.max_budget_gbp ?? raw.maxBudgetGbp,
    availableTimes: raw.available_times ?? raw.availableTimes,
    travelRadiusKm: raw.travel_radius_km ?? raw.travelRadiusKm,
    postcode: raw.postcode,
  };
}

function normalizeCartItem(raw: any): CartItem {
  return {
    id: raw.id,
    child: normalizeChild(raw.child),
    activity: normalizeActivity(raw.activity),
    createdAt: raw.created_at ?? raw.createdAt,
  };
}

function normalizeActivityBooking(raw: any): ActivityBooking {
  return {
    id: raw.id,
    child: raw.child ? normalizeChild(raw.child) : undefined,
    activity: normalizeActivity(raw.activity),
    paymentRecordId: raw.payment_record_id ?? raw.paymentRecordId,
    status: raw.status,
    createdAt: raw.created_at ?? raw.createdAt,
  };
}

function normalizePaymentHistory(raw: any): PaymentHistory {
  return {
    id: raw.id,
    stripeSessionId: raw.stripe_session_id ?? raw.stripeSessionId,
    stripePaymentIntentId: raw.stripe_payment_intent_id ?? raw.stripePaymentIntentId,
    amountGbp: raw.amount_gbp ?? raw.amountGbp ?? 0,
    currency: raw.currency ?? 'GBP',
    status: raw.status ?? 'paid',
    customerEmail: raw.customer_email ?? raw.customerEmail,
    billingName: raw.billing_name ?? raw.billingName,
    createdAt: raw.created_at ?? raw.createdAt,
  };
}

export async function fetchCartItems(parentId: string): Promise<CartItem[]> {
  const url = new URL('/api/cart', apiBase);
  url.searchParams.set('parentId', parentId);
  const response = await fetch(url.toString(), { headers: authHeaders(false) });
  const rawItems = await parseJson<any[]>(response);
  return rawItems.map(normalizeCartItem);
}

export async function fetchBookings(parentId: string): Promise<ActivityBooking[]> {
  const url = new URL('/api/bookings', apiBase);
  url.searchParams.set('parentId', parentId);
  const response = await fetch(url.toString(), { headers: authHeaders(false) });
  const rawItems = await parseJson<any[]>(response);
  return rawItems.map(normalizeActivityBooking);
}

export async function fetchPaymentHistory(parentId: string): Promise<PaymentHistory[]> {
  const url = new URL('/api/payments/history', apiBase);
  url.searchParams.set('parentId', parentId);
  const response = await fetch(url.toString(), { headers: authHeaders(false) });
  const rawItems = await parseJson<any[]>(response);
  return rawItems.map(normalizePaymentHistory);
}

export async function addActivityToCart(parentId: string, activityId: string, childId: string): Promise<CartItem> {
  const response = await fetch(`${apiBase}/api/cart`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ parent_id: parentId, activity_id: activityId, child_id: childId })
  });
  const rawItem = await parseJson<any>(response);
  return normalizeCartItem(rawItem);
}

export async function removeCartItem(cartItemId: string): Promise<void> {
  await fetch(`${apiBase}/api/cart/${cartItemId}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  });
}

export async function createCheckoutSession(request: {
  parentId: string;
  billingName?: string;
  billingEmail?: string;
  billingAddressLine1?: string;
  billingCity?: string;
  billingPostcode?: string;
  billingCountry?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutSessionResponse> {
  const response = await fetch(`${apiBase}/api/cart/checkout-session`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      parent_id: request.parentId,
      billing_name: request.billingName,
      billing_email: request.billingEmail,
      billing_address_line1: request.billingAddressLine1,
      billing_city: request.billingCity,
      billing_postcode: request.billingPostcode,
      billing_country: request.billingCountry,
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
    })
  });

  const result = await parseJson<any>(response);
  return {
    checkoutUrl: result.checkoutUrl ?? result.checkout_url
  };
}

export async function checkoutCart(parentId: string): Promise<CartCheckoutResult> {
  const url = new URL('/api/cart/checkout', apiBase);
  url.searchParams.set('parentId', parentId);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: authHeaders(false),
  });
  const result = await parseJson<any>(response);
  return {
    checkedOutItems: Array.isArray(result.checked_out_items)
      ? result.checked_out_items.map(normalizeCartItem)
      : result.checkedOutItems.map(normalizeCartItem),
    totalPrice: result.total_price ?? result.totalPrice ?? 0,
    count: result.count ?? 0,
  };
}

export async function getCategories(): Promise<string[]> {
  const response = await fetch(`${apiBase}/api/activities/categories`);
  return parseJson<string[]>(response);
}

export async function getCities(): Promise<string[]> {
  const response = await fetch(`${apiBase}/api/activities/cities`);
  return parseJson<string[]>(response);
}

export async function fetchChildren(parentId: string): Promise<Child[]> {
  const url = new URL('/api/children', apiBase);
  url.searchParams.set('parentId', parentId);
  const response = await fetch(url.toString(), { headers: authHeaders(false) });
  const rawItems = await parseJson<any[]>(response);
  return rawItems.map(normalizeChild);
}

export type ChildInput = Omit<Child, 'id'>;

export async function createChild(parentId: string, child: ChildInput): Promise<Child> {
  const url = new URL('/api/children', apiBase);
  url.searchParams.set('parentId', parentId);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(child)
  });
  return parseJson<Child>(response);
}

export async function updateChild(childId: string, child: Child): Promise<Child> {
  const response = await fetch(`${apiBase}/api/children/${childId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(child)
  });
  return parseJson<Child>(response);
}

function normalizeChatMessage(raw: any): ChatMessage {
  return {
    id: raw.id,
    role: raw.role,
    content: raw.content,
    childId: raw.childId ?? raw.child_id,
    activities: Array.isArray(raw.activities) ? raw.activities.map(normalizeActivity) : undefined,
    createdAt: raw.createdAt ?? raw.created_at,
  };
}

export async function fetchChatHistory(parentId: string, childId: string): Promise<ChatMessage[]> {
  const url = new URL('/api/chat/history', apiBase);
  url.searchParams.set('parentId', parentId);
  url.searchParams.set('childId', childId);
  const response = await fetch(url.toString(), { headers: authHeaders(false) });
  const rawItems = await parseJson<any[]>(response);
  return rawItems.map(normalizeChatMessage);
}

export async function sendChatMessage(parentId: string, childId: string, message: string): Promise<ChatMessage> {
  const response = await fetch(`${apiBase}/api/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ parentId, childId, message }),
  });
  const raw = await parseJson<any>(response);
  return normalizeChatMessage(raw);
}
