import { generateBookingReference } from './booking-reference.util';

describe('generateBookingReference', () => {
  it('creates a default formatted reference', () => {
    const fixedDate = new Date('2025-12-07T00:00:00.000Z');
    const reference = generateBookingReference({ timestamp: fixedDate });
    expect(reference).toMatch(/^BT251207-[A-Z0-9]{7}$/);
  });

  it('uses custom prefix and length', () => {
    const reference = generateBookingReference({ prefix: 'vip', randomLength: 8 });
    expect(reference.startsWith('VIP')).toBe(true);
    expect(reference).toMatch(/^VIP\d{6}-[A-Z0-9]{10}$/);
  });

  it('creates highly unique references', () => {
    const runs = 200;
    const values = new Set<string>();
    for (let i = 0; i < runs; i += 1) {
      values.add(generateBookingReference());
    }
    expect(values.size).toBe(runs);
  });
});
