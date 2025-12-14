export type SeatLockStatus = "locked" | "confirmed";

export interface SeatLockRecord {
  seatLabel: string;
  route: string;
  travelDate: string;
  seatType?: string;
  company?: string;
  busPlate?: string;
  bookingReference: string;
  status: SeatLockStatus;
  lockedAt: string;
  expiresAt?: string | null;
}

export interface SeatAvailabilitySnapshot {
  route: string;
  travelDate: string;
  busPlate?: string;
  seatType?: string;
  seats: Array<{
    seatLabel: string;
    status: SeatLockStatus;
    bookingReference: string;
    expiresAt?: string | null;
  }>;
  reservedSeatIds: string[];
}
