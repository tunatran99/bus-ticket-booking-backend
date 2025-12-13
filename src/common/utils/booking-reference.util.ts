import { randomBytes } from 'crypto';

const DEFAULT_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export interface BookingReferenceOptions {
  /**
   * Optional custom prefix (letters/numbers only). Defaults to "BT".
   */
  prefix?: string;
  /**
   * Timestamp to encode inside the reference. Defaults to the current date in UTC.
   */
  timestamp?: Date;
  /**
   * How many random characters to append before the checksum. Defaults to 5.
   */
  randomLength?: number;
}

const sanitizePrefix = (raw?: string) => {
  if (!raw) {
    return 'BT';
  }
  const cleaned = raw.replace(/[^A-Za-z0-9]/g, '').slice(0, 4);
  return cleaned.length ? cleaned.toUpperCase() : 'BT';
};

const formatDatePart = (date: Date) => {
  const iso = date.toISOString();
  // iso example 2025-12-07T... -> keep YYMMDD for compactness
  return `${iso.slice(2, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}`;
};

const randomFromAlphabet = (length: number, alphabet = DEFAULT_ALPHABET) => {
  if (length <= 0) {
    throw new Error('randomLength must be greater than zero');
  }
  const buffer = randomBytes(length);
  return Array.from({ length })
    .map((_, index) => alphabet[buffer[index] % alphabet.length])
    .join('');
};

const checksumFor = (value: string, alphabet = DEFAULT_ALPHABET) => {
  const total = value.split('').reduce((acc, char, idx) => {
    const charValue = alphabet.indexOf(char) >= 0 ? alphabet.indexOf(char) : char.charCodeAt(0);
    return acc + charValue * (idx + 1);
  }, 0);

  const first = alphabet[total % alphabet.length];
  const second = alphabet[Math.floor(total / alphabet.length) % alphabet.length];
  return `${first}${second}`;
};

export const generateBookingReference = (
  options: BookingReferenceOptions = {}
): string => {
  const prefix = sanitizePrefix(options.prefix);
  const timestamp = options.timestamp ?? new Date();
  const randomLength = options.randomLength ?? 5;

  const datePart = formatDatePart(timestamp);
  const randomPart = randomFromAlphabet(randomLength);
  const payload = `${prefix}${datePart}${randomPart}`;
  const checksum = checksumFor(payload);

  return `${prefix}${datePart}-${randomPart}${checksum}`;
};
