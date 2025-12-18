import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, randomUUID } from "crypto";
import { promises as fs } from "fs";
import { dirname, join } from "path";
import { URLSearchParams } from "url";
import { BookingsService } from "../bookings/bookings.service";
import {
  PaymentRecord,
  PaymentStatus,
} from "./interfaces/payment-record.interface";
import { PayOsWebhookDto } from "./dto/payos-webhook.dto";

interface CreateSessionParams {
  bookingReference: string;
  successUrl: string;
  cancelUrl?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly storagePath = join(
    process.cwd(),
    "storage",
    "payments.json",
  );
  private readonly sessionTtlMs: number;
  private payments: PaymentRecord[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly bookingsService: BookingsService,
  ) {
    const minutes =
      Number(this.configService.get("PAYMENT_SESSION_MINUTES")) || 15;
    this.sessionTtlMs = minutes * 60 * 1000;
  }

  async onModuleInit() {
    await this.ensureStorage();
    await this.loadFromDisk();
  }

  async createPayOsSession(params: CreateSessionParams) {
    const booking = await this.bookingsService.findByReference(
      params.bookingReference,
    );
    if (!booking) {
      throw new NotFoundException({
        code: "PAYMENT_001",
        message: "Booking not found",
      });
    }
    if (booking.status === "cancelled" || booking.status === "expired") {
      throw new BadRequestException({
        code: "PAYMENT_002",
        message: "Cannot create payment session for inactive booking",
      });
    }
    if (booking.paymentStatus === "paid") {
      throw new BadRequestException({
        code: "PAYMENT_003",
        message: "Booking is already paid",
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.sessionTtlMs).toISOString();
    const paymentId = this.generatePaymentId();
    const signaturePayload = {
      paymentId,
      bookingReference: booking.bookingReference,
      amount: booking.total,
      currency: booking.currency,
      expiresAt,
    };
    const signature =
      this.computeSignature(signaturePayload, true) ??
      randomUUID().replace(/-/g, "");
    const checkoutUrl = this.buildCheckoutUrl({
      paymentId,
      signature,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
    });

    const record: PaymentRecord = {
      paymentId,
      bookingReference: booking.bookingReference,
      amount: booking.total,
      currency: booking.currency,
      provider: "payos",
      status: "processing",
      checkoutUrl,
      returnUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      expiresAt,
      metadata: params.metadata ?? null,
      signature,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.payments.push(record);
    await this.persist();

    await this.bookingsService.markPaymentProcessing(
      booking.bookingReference,
      paymentId,
      "payos",
      signaturePayload,
    );

    this.logger.log(
      `Created PayOS session ${paymentId} for booking ${booking.bookingReference}`,
    );

    return this.toSessionResponse(record);
  }

  async handlePayOsWebhook(webhook: PayOsWebhookDto) {
    const isValid = this.verifySignature(webhook.signature, webhook.data);
    if (!isValid) {
      throw new ForbiddenException({
        code: "PAYMENT_004",
        message: "Invalid PayOS signature",
      });
    }
    const paymentId = this.extractPaymentId(webhook.data);
    const record = await this.getPaymentRecord(paymentId);
    const status = this.mapGatewayStatus(
      (webhook.data?.status as string) ?? (webhook.data?.state as string),
    );

    await this.updatePaymentStatus(record, status, webhook.data);

    if (status === "succeeded") {
      await this.bookingsService.handlePaymentSuccess(
        record.bookingReference,
        record.paymentId,
        record.provider,
        webhook.data,
      );
    } else if (status === "failed" || status === "cancelled") {
      await this.bookingsService.handlePaymentFailure(
        record.bookingReference,
        record.paymentId,
        record.provider,
        webhook.data,
      );
    }

    return {
      success: true,
    };
  }

  async getPaymentSummary(paymentId: string) {
    const record = await this.getPaymentRecord(paymentId);
    return this.toSessionResponse(record);
  }

  private generatePaymentId() {
    return `pay_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }

  private buildCheckoutUrl(params: {
    paymentId: string;
    signature: string;
    successUrl: string;
    cancelUrl?: string;
  }) {
    const base =
      this.configService.get<string>("PAYOS_CHECKOUT_BASE_URL") ??
      "https://payos.vn/checkout";
    const search = new URLSearchParams({
      paymentId: params.paymentId,
      signature: params.signature,
      returnUrl: params.successUrl,
    });
    if (params.cancelUrl) {
      search.append("cancelUrl", params.cancelUrl);
    }
    return `${base}?${search.toString()}`;
  }

  private computeSignature(
    payload: Record<string, unknown>,
    allowFallback = false,
  ): string | null {
    const checksumKey = this.configService.get<string>("PAYOS_CHECKSUM_KEY");
    if (!checksumKey) {
      return allowFallback ? randomUUID().replace(/-/g, "") : null;
    }
    const serialized = JSON.stringify(payload);
    return createHmac("sha256", checksumKey).update(serialized).digest("hex");
  }

  private verifySignature(signature: string, payload: Record<string, unknown>) {
    const expected = this.computeSignature(payload);
    if (!expected) {
      return true;
    }
    return signature === expected;
  }

  private async getPaymentRecord(paymentId: string): Promise<PaymentRecord> {
    const record = this.payments.find(
      (payment) => payment.paymentId === paymentId,
    );
    if (!record) {
      throw new NotFoundException({
        code: "PAYMENT_005",
        message: "Payment record not found",
      });
    }
    return record;
  }

  private async updatePaymentStatus(
    record: PaymentRecord,
    nextStatus: PaymentStatus,
    payload?: Record<string, unknown>,
  ) {
    record.status = nextStatus;
    record.lastWebhookPayload = payload ?? record.lastWebhookPayload ?? null;
    record.updatedAt = new Date().toISOString();
    await this.persist();
    this.logger.log(`Payment ${record.paymentId} updated to ${nextStatus}`);
  }

  private extractPaymentId(payload: Record<string, unknown>): string {
    const candidate =
      (payload.paymentId as string) ||
      (payload.paymentLinkId as string) ||
      (payload.payment_code as string) ||
      (payload["paymentCode"] as string);
    if (!candidate) {
      throw new BadRequestException({
        code: "PAYMENT_006",
        message: "Missing payment identifier in webhook",
      });
    }
    return candidate;
  }

  private mapGatewayStatus(status?: string): PaymentStatus {
    switch ((status ?? "").toLowerCase()) {
      case "paid":
      case "succeeded":
      case "completed":
        return "succeeded";
      case "cancelled":
      case "canceled":
        return "cancelled";
      case "failed":
      case "error":
        return "failed";
      case "processing":
      case "pending":
      default:
        return "processing";
    }
  }

  private async ensureStorage() {
    await fs.mkdir(dirname(this.storagePath), { recursive: true });
    try {
      await fs.access(this.storagePath);
    } catch (error) {
      await fs.writeFile(this.storagePath, JSON.stringify([]));
    }
  }

  private async loadFromDisk() {
    try {
      const contents = await fs.readFile(this.storagePath, "utf8");
      this.payments = contents ? (JSON.parse(contents) as PaymentRecord[]) : [];
    } catch (error) {
      this.logger.error("Failed to read payment storage", error as Error);
      this.payments = [];
    }
  }

  private async persist() {
    await fs.writeFile(
      this.storagePath,
      JSON.stringify(this.payments, null, 2),
    );
  }

  private toSessionResponse(record: PaymentRecord) {
    return {
      paymentId: record.paymentId,
      bookingReference: record.bookingReference,
      status: record.status,
      amount: record.amount,
      currency: record.currency,
      checkoutUrl: record.checkoutUrl,
      expiresAt: record.expiresAt,
    };
  }
}
