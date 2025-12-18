export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface PaymentRecord {
  paymentId: string;
  bookingReference: string;
  amount: number;
  currency: string;
  provider: "payos";
  status: PaymentStatus;
  checkoutUrl: string;
  returnUrl: string;
  cancelUrl?: string;
  signature?: string;
  expiresAt?: string | null;
  metadata?: Record<string, unknown> | null;
  lastWebhookPayload?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
