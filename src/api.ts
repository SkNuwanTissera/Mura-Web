import { Activity, ActivitySearchFilters, CartCheckoutResult, CheckoutSessionResponse, CartItem, Child, User, PageResult } from './types';

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
  return parseJson<User>(response);
}

export async function signupUser(name: string, email: string, password: string): Promise<User> {
  const response = await fetch(`${apiBase}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  return parseJson<User>(response);
}

export async function googleSignInWithToken(idToken: string): Promise<User> {
  const response = await fetch(`${apiBase}/api/auth/google-signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  return parseJson<User>(response);
}

function normalizeActivity(raw: any): Activity {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
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

function normalizeCartItem(raw: any): CartItem {
  return {
    id: raw.id,
    activity: normalizeActivity(raw.activity),
    createdAt: raw.created_at ?? raw.createdAt,
  };
}

export async function fetchCartItems(parentId: string): Promise<CartItem[]> {
  const url = new URL('/api/cart', apiBase);
  url.searchParams.set('parentId', parentId);
  const response = await fetch(url.toString());
  const rawItems = await parseJson<any[]>(response);
  return rawItems.map(normalizeCartItem);
}

export async function addActivityToCart(parentId: string, activityId: string): Promise<CartItem> {
  const response = await fetch(`${apiBase}/api/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parent_id: parentId, activity_id: activityId })
  });
  const rawItem = await parseJson<any>(response);
  return normalizeCartItem(rawItem);
}

export async function removeCartItem(cartItemId: string): Promise<void> {
  await fetch(`${apiBase}/api/cart/${cartItemId}`, {
    method: 'DELETE'
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
    headers: { 'Content-Type': 'application/json' },
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
    method: 'POST'
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
  const response = await fetch(url.toString());
  return parseJson<Child[]>(response);
}

export async function createChild(parentId: string, name: string, dateOfBirth: string): Promise<Child> {
  const url = new URL('/api/children', apiBase);
  url.searchParams.set('parentId', parentId);
  url.searchParams.set('name', name);
  url.searchParams.set('dateOfBirth', dateOfBirth);

  const response = await fetch(url.toString(), { method: 'POST' });
  return parseJson<Child>(response);
}

export async function updateChild(childId: string, child: Child): Promise<Child> {
  const response = await fetch(`${apiBase}/api/children/${childId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(child)
  });
  return parseJson<Child>(response);
}
