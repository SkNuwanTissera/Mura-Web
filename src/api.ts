import { Activity, ActivitySearchFilters, Child, User } from './types';

const apiBase = import.meta.env.VITE_API_BASE_URL || '';

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

export async function searchActivities(filters: ActivitySearchFilters): Promise<Activity[]> {
  const response = await fetch(`${apiBase}/api/activities/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...filters, limit: 50 })
  });
  return parseJson<Activity[]>(response);
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
  const url = new URL(`${apiBase}/api/children`);
  url.searchParams.set('parentId', parentId);
  const response = await fetch(url.toString());
  return parseJson<Child[]>(response);
}

export async function createChild(parentId: string, name: string, dateOfBirth: string): Promise<Child> {
  const url = new URL(`${apiBase}/api/children`);
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
