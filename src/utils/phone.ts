export interface CountryDialCode {
  code: string;
  label: string;
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { code: '+44', label: 'UK (+44)' },
  { code: '+353', label: 'Ireland (+353)' },
  { code: '+1', label: 'US/CA (+1)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+34', label: 'Spain (+34)' },
  { code: '+39', label: 'Italy (+39)' },
  { code: '+31', label: 'Netherlands (+31)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+91', label: 'India (+91)' },
];

export function combinePhone(countryCode: string, number: string): string {
  const digits = number.replace(/\D/g, '');
  if (!digits) return '';
  const code = countryCode || '+44';
  return `${code} ${digits}`;
}

export function splitPhone(full: string | undefined): { countryCode: string; number: string } {
  if (!full?.trim()) {
    return { countryCode: '+44', number: '' };
  }

  const trimmed = full.trim();
  const match = trimmed.match(/^(\+\d{1,4})\s*(.*)$/);
  if (match) {
    return { countryCode: match[1], number: match[2].replace(/\D/g, '') };
  }

  if (trimmed.startsWith('0')) {
    return { countryCode: '+44', number: trimmed.replace(/\D/g, '').replace(/^0/, '') };
  }

  return { countryCode: '+44', number: trimmed.replace(/\D/g, '') };
}
