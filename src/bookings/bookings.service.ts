import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { dirname, join } from "path";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingDto } from "./dto/update-booking.dto";
import {
  BookingPaymentStatus,
  BookingRecord,
} from "./interfaces/booking.interface";
import { SeatLocksService } from "./seat-locks.service";
import { NotificationsService } from "../notifications/notifications.service";

interface BookingLookupContact {
  phone?: string;
  email?: string;
}

@Injectable()
export class BookingsService implements OnModuleInit {
  private readonly logger = new Logger(BookingsService.name);
  private readonly storagePath = join(
    process.cwd(),
    "storage",
    "bookings.json",
  );
  private bookings: BookingRecord[] = [];
  private readonly expiryMs: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly seatLocksService: SeatLocksService,
    private readonly notificationsService: NotificationsService,
  ) {
    const minutes =
      Number(this.configService.get("BOOKING_EXPIRY_MINUTES")) || 30;
    this.expiryMs = minutes * 60 * 1000;
  }

  async onModuleInit() {
    await this.ensureStorage();
    await this.loadFromDisk();
    await this.expireStaleBookings();
    await this.seatLocksService.rebuildFromBookings(this.bookings);
  }

  async create(
    userId: string | null,
    dto: CreateBookingDto,
  ): Promise<BookingRecord> {
    await this.expireStaleBookings();
    if (!dto.passengers?.length) {
      throw new BadRequestException({
        code: "BOOKING_004",
        message: "At least one passenger is required",
      });
    }
    if (dto.passengers.length !== dto.seatCount) {
      throw new BadRequestException({
        code: "BOOKING_005",
        message: "Passenger count must match seat count",
      });
    }
    const bookingReference = this.generateReference(dto.travelDate);
    const now = new Date();
    const total = dto.pricePerTicket * dto.seatCount;
    const expiresAt = new Date(now.getTime() + this.expiryMs).toISOString();

    await this.seatLocksService.lockSeats({
      route: dto.route,
      travelDate: dto.travelDate,
      seatType: dto.seatType,
      company: dto.company,
      busPlate: dto.busPlate,
      seatLabels: dto.passengers.map((pax) => pax.seatLabel),
      bookingReference,
      expiresAt,
    });

    const booking: BookingRecord = {
      bookingReference,
      userId,
      route: dto.route,
      travelDate: dto.travelDate,
      arrival: dto.arrival,
      seatType: dto.seatType,
      seatCount: dto.seatCount,
      pricePerTicket: dto.pricePerTicket,
      total,
      currency: "VND",
      terminal: dto.terminal,
      company: dto.company,
      busPlate: dto.busPlate,
      contact: dto.contact,
      passengers: dto.passengers,
      status: "pending",
      paymentStatus: "unpaid",
      paymentProvider: undefined,
      paymentIntentId: undefined,
      paidAt: null,
      paymentMetadata: null,
      expiresAt,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.bookings.push(booking);
    await this.persist();
    this.logger.log(`Booking created: ${bookingReference}`);
    return booking;
  }

  async confirm(reference: string): Promise<BookingRecord> {
    await this.expireStaleBookings();
    const booking = this.getBooking(reference);
    if (booking.status === "cancelled" || booking.status === "expired") {
      throw new BadRequestException({
        code: "BOOKING_003",
        message: "Booking can no longer be confirmed",
      });
    }
    booking.status = "confirmed";
    booking.expiresAt = null;
    booking.updatedAt = new Date().toISOString();
    await this.persist();
    await this.seatLocksService.markSeatsConfirmed(reference);
    this.logger.log(`Booking confirmed: ${reference}`);
    try {
      await this.notificationsService.sendBookingConfirmation(booking);
    } catch (error) {
      this.logger.error(
        `Failed to dispatch confirmation notifications for ${reference}`,
        error as Error,
      );
    }
    return booking;
  }

  async listForUser(userId: string): Promise<BookingRecord[]> {
    await this.expireStaleBookings();
    return this.bookings.filter((booking) => booking.userId === userId);
  }

  async findByReference(reference: string): Promise<BookingRecord | undefined> {
    await this.expireStaleBookings();
    return this.bookings.find(
      (booking) => booking.bookingReference === reference,
    );
  }

  async cancel(reference: string): Promise<BookingRecord> {
    await this.expireStaleBookings();
    const booking = this.getBooking(reference);
    booking.status = "cancelled";
    if (booking.paymentStatus === "processing") {
      booking.paymentStatus = "failed";
    }
    booking.expiresAt = null;
    booking.updatedAt = new Date().toISOString();
    await this.persist();
    await this.seatLocksService.releaseSeats(reference, true);
    this.logger.log(`Booking cancelled: ${reference}`);
    return booking;
  }

  async lookupForGuest(
    reference: string,
    contact: BookingLookupContact,
  ): Promise<BookingRecord> {
    const booking = await this.findByReference(reference);
    if (!booking) {
      throw new NotFoundException({
        code: "BOOKING_001",
        message: "Booking not found",
      });
    }
    this.assertContactMatches(booking, contact);
    return booking;
  }

  async confirmForGuest(
    reference: string,
    contact: BookingLookupContact,
  ): Promise<BookingRecord> {
    await this.lookupForGuest(reference, contact);
    return this.confirm(reference);
  }

  async updateBooking(
    reference: string,
    dto: UpdateBookingDto,
  ): Promise<BookingRecord> {
    await this.expireStaleBookings();
    const booking = this.getBooking(reference);
    if (booking.status === "cancelled" || booking.status === "expired") {
      throw new BadRequestException({
        code: "BOOKING_003",
        message: "Booking can no longer be modified",
      });
    }
    if (!dto.contact && !dto.passengers) {
      throw new BadRequestException({
        code: "BOOKING_008",
        message: "No changes supplied",
      });
    }

    if (dto.contact) {
      booking.contact = {
        ...booking.contact,
        ...dto.contact,
      };
    }

    if (dto.passengers) {
      const newSeatLabels = dto.passengers.map((pax) =>
        pax.seatLabel.trim().toUpperCase(),
      );
      const currentSeats = booking.passengers.map((pax) =>
        pax.seatLabel.trim().toUpperCase(),
      );
      const currentSeatSet = new Set(currentSeats);
      const newSeatSet = new Set(newSeatLabels);
      const seatsChanged =
        newSeatLabels.length !== currentSeats.length ||
        newSeatLabels.some((label) => !currentSeatSet.has(label)) ||
        currentSeats.some((label) => !newSeatSet.has(label));

      if (seatsChanged) {
        await this.seatLocksService.releaseSeats(reference, true);
        try {
          await this.seatLocksService.lockSeats({
            route: booking.route,
            travelDate: booking.travelDate,
            seatType: booking.seatType,
            company: booking.company,
            busPlate: booking.busPlate,
            seatLabels: newSeatLabels,
            bookingReference: reference,
            expiresAt: booking.expiresAt ?? null,
          });
          if (booking.status === "confirmed") {
            await this.seatLocksService.markSeatsConfirmed(reference);
          }
        } catch (error) {
          await this.seatLocksService.lockSeats({
            route: booking.route,
            travelDate: booking.travelDate,
            seatType: booking.seatType,
            company: booking.company,
            busPlate: booking.busPlate,
            seatLabels: currentSeats,
            bookingReference: reference,
            expiresAt: booking.expiresAt ?? null,
          });
          if (booking.status === "confirmed") {
            await this.seatLocksService.markSeatsConfirmed(reference);
          }
          throw error;
        }
      }

      booking.passengers = dto.passengers;
      booking.seatCount = dto.passengers.length;
      booking.total = booking.pricePerTicket * booking.seatCount;
    }

    booking.updatedAt = new Date().toISOString();
    await this.persist();
    return booking;
  }

  private getBooking(reference: string): BookingRecord {
    const booking = this.bookings.find((b) => b.bookingReference === reference);
    if (!booking) {
      throw new NotFoundException({
        code: "BOOKING_001",
        message: "Booking not found",
      });
    }
    return booking;
  }

  private async expireStaleBookings() {
    const now = Date.now();
    let mutated = false;
    for (const booking of this.bookings) {
      if (
        booking.status === "pending" &&
        booking.expiresAt &&
        !Number.isNaN(Date.parse(booking.expiresAt)) &&
        Date.parse(booking.expiresAt) <= now
      ) {
        booking.status = "expired";
        if (booking.paymentStatus !== "paid") {
          booking.paymentStatus = "failed";
        }
        booking.updatedAt = new Date().toISOString();
        await this.seatLocksService.releaseSeats(booking.bookingReference);
        mutated = true;
      }
    }
    if (mutated) {
      await this.persist();
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
      this.bookings = contents
        ? (JSON.parse(contents) as BookingRecord[]).map((booking) =>
            this.normalizeBooking(booking),
          )
        : [];
    } catch (error) {
      this.logger.error("Failed to read bookings storage", error as Error);
      this.bookings = [];
    }
  }

  private async persist() {
    await fs.writeFile(
      this.storagePath,
      JSON.stringify(this.bookings, null, 2),
    );
  }

  private generateReference(travelDate?: string): string {
    const travel = travelDate ? new Date(travelDate) : new Date();
    const isValidDate = !Number.isNaN(travel.getTime());
    const date = isValidDate ? travel : new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = `${date.getMonth() + 1}`.padStart(2, "0");
    const dd = `${date.getDate()}`.padStart(2, "0");
    const dateSegment = `${yy}${mm}${dd}`;
    const randomSegment = randomUUID()
      .replace(/-/g, "")
      .slice(0, 4)
      .toUpperCase();
    return `BT-${dateSegment}-${randomSegment}`;
  }

  private assertContactMatches(
    booking: BookingRecord,
    contact: BookingLookupContact,
  ) {
    if (!contact || (!contact.phone && !contact.email)) {
      throw new BadRequestException({
        code: "BOOKING_006",
        message: "Contact phone or email is required",
      });
    }
    if (!this.contactMatches(booking, contact)) {
      throw new ForbiddenException({
        code: "BOOKING_007",
        message: "Provided contact does not match booking records",
      });
    }
  }

  private contactMatches(
    booking: BookingRecord,
    contact: BookingLookupContact,
  ): boolean {
    const bookingPhone = this.normalizePhone(booking.contact?.phone);
    const candidatePhone = this.normalizePhone(contact.phone);
    const phoneMatches = Boolean(
      bookingPhone && candidatePhone && bookingPhone === candidatePhone,
    );

    const bookingEmail = booking.contact?.email?.trim().toLowerCase();
    const candidateEmail = contact.email?.trim().toLowerCase();
    const emailMatches = Boolean(
      bookingEmail && candidateEmail && bookingEmail === candidateEmail,
    );

    return phoneMatches || emailMatches;
  }

  private normalizePhone(value?: string): string | null {
    if (!value) {
      return null;
    }
    const digits = value.replace(/\D/g, "");
    return digits.length > 0 ? digits : null;
  }

  async getAllBookings(): Promise<BookingRecord[]> {
    await this.expireStaleBookings();
    return [...this.bookings];
  }

  async runExpirationSweep() {
    await this.expireStaleBookings();
  }

  async markPaymentProcessing(
    reference: string,
    paymentIntentId: string,
    provider: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.expireStaleBookings();
    const booking = this.getBooking(reference);
    booking.paymentStatus = "processing";
    booking.paymentProvider = provider;
    booking.paymentIntentId = paymentIntentId;
    booking.paymentMetadata = metadata ?? booking.paymentMetadata ?? null;
    booking.updatedAt = new Date().toISOString();
    await this.persist();
    this.logger.log(
      `Booking ${reference} marked as processing for payment ${paymentIntentId}`,
    );
  }

  async handlePaymentSuccess(
    reference: string,
    paymentIntentId: string,
    provider: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.expireStaleBookings();
    const booking = this.getBooking(reference);
    booking.paymentStatus = "paid";
    booking.paymentProvider = provider;
    booking.paymentIntentId = paymentIntentId;
    booking.paymentMetadata = metadata ?? booking.paymentMetadata ?? null;
    booking.paidAt = new Date().toISOString();
    booking.updatedAt = new Date().toISOString();
    this.logger.log(
      `Booking ${reference} marked as paid via ${provider} (${paymentIntentId})`,
    );
    if (booking.status !== "confirmed") {
      await this.confirm(reference);
      return;
    }
    await this.persist();
  }

  async handlePaymentFailure(
    reference: string,
    paymentIntentId: string,
    provider?: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.expireStaleBookings();
    const booking = this.getBooking(reference);
    booking.paymentStatus = "failed";
    booking.paymentProvider = provider ?? booking.paymentProvider;
    booking.paymentIntentId = paymentIntentId;
    booking.paymentMetadata = metadata ?? booking.paymentMetadata ?? null;
    booking.updatedAt = new Date().toISOString();
    await this.persist();
    this.logger.warn(
      `Booking ${reference} payment ${paymentIntentId} marked as failed`,
    );
  }

  private normalizeBooking(candidate: BookingRecord): BookingRecord {
    const paymentStatus = this.ensurePaymentStatus(candidate.paymentStatus);
    return {
      ...candidate,
      paymentStatus,
      paymentProvider: candidate.paymentProvider,
      paymentIntentId: candidate.paymentIntentId,
      paidAt: candidate.paidAt ?? null,
      paymentMetadata:
        typeof candidate.paymentMetadata === "object"
          ? candidate.paymentMetadata
          : null,
    };
  }

  private ensurePaymentStatus(
    status?: BookingPaymentStatus,
  ): BookingPaymentStatus {
    if (!status) {
      return "unpaid";
    }
    return status;
  }
}
