export interface UkAddressOption {
  id: string;
  label: string;
  line1: string;
  city: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
}

const apiBase = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

function formatUkPostcode(raw: string): string {
  const normalized = raw.replace(/\s+/g, '').toUpperCase();
  if (normalized.length <= 3) return normalized;
  return `${normalized.slice(0, -3)} ${normalized.slice(-3)}`;
}

function normalizeOption(raw: Record<string, unknown>): UkAddressOption {
  return {
    id: String(raw.id ?? ''),
    label: String(raw.label ?? ''),
    line1: String(raw.line1 ?? raw.line_1 ?? ''),
    city: String(raw.city ?? ''),
    postcode: String(raw.postcode ?? ''),
    latitude: raw.latitude != null ? Number(raw.latitude) : undefined,
    longitude: raw.longitude != null ? Number(raw.longitude) : undefined,
  };
}

/** Lookup via Mura backend (proxies getAddress.io — avoids browser CORS). */
async function lookupViaBackend(postcode: string): Promise<UkAddressOption[]> {
  const url = new URL('/api/address/uk', apiBase);
  url.searchParams.set('postcode', postcode);
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Address lookup failed (${res.status})`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((item) => normalizeOption(item as Record<string, unknown>));
}

async function lookupViaPostcodesIo(postcode: string): Promise<UkAddressOption[]> {
  const compact = postcode.replace(/\s+/g, '');
  const pcRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(compact)}`);
  if (!pcRes.ok) return [];
  const pcData = await pcRes.json();
  if (!pcData.result) return [];

  const city =
    pcData.result.admin_district ||
    pcData.result.post_town ||
    pcData.result.parish ||
    '';
  return [
    {
      id: 'postcode-centroid',
      label: `${city} (${postcode})`,
      line1: '',
      city,
      postcode,
      latitude: pcData.result.latitude,
      longitude: pcData.result.longitude,
    },
  ];
}

export async function lookupUkAddressesByPostcode(postcode: string): Promise<UkAddressOption[]> {
  const formatted = formatUkPostcode(postcode);
  if (!formatted) {
    throw new Error('Enter a valid UK postcode.');
  }

  const backendResults = await lookupViaBackend(formatted);
  if (backendResults.length > 0) {
    return backendResults;
  }

  const fallback = await lookupViaPostcodesIo(formatted);
  if (fallback.length > 0) {
    return fallback;
  }

  throw new Error(
    'No addresses found for that postcode. Add GETADDRESS_API_KEY to the Mura backend .env and restart the server.'
  );
}
