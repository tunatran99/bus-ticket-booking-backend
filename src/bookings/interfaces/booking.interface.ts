export type BookingStatus = "pending" | "confirmed" | "cancelled" | "expired";

export interface BookingPassenger {
  name: string;
  idNumber: string;
  phone: string;
  email?: string;
  seatLabel: string;
}

export interface BookingContact {
  phone: string;
  email?: string;
}

export interface BookingRecord {
  bookingReference: string;
  userId: string | null;
  route: string;
  travelDate: string;
  arrival?: string;
  seatType?: string;
  seatCount: number;
  pricePerTicket: number;
  total: number;
  currency: string;
  terminal?: string;
  company?: string;
  busPlate?: string;
  contact: BookingContact;
  passengers: BookingPassenger[];
  status: BookingStatus;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
