import { Activity, ActivitySearchFilters, Child } from './types';

const apiBase = import.meta.env.VITE_API_BASE_URL || '';

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'API request failed');
  }
  return response.json();
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
