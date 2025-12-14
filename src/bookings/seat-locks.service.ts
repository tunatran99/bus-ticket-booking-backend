import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { promises as fs } from "fs";
import { dirname, join } from "path";
import { SeatAvailabilityQueryDto } from "./dto/seat-availability-query.dto";
import { BookingRecord } from "./interfaces/booking.interface";
import {
  SeatAvailabilitySnapshot,
  SeatLockRecord,
} from "./interfaces/seat-lock.interface";

interface LockSeatsPayload {
  route: string;
  travelDate: string;
  seatLabels: string[];
  bookingReference: string;
  expiresAt?: string | null;
  seatType?: string;
  company?: string;
  busPlate?: string;
}

@Injectable()
export class SeatLocksService implements OnModuleInit {
  private readonly logger = new Logger(SeatLocksService.name);
  private readonly storagePath = join(
    process.cwd(),
    "storage",
    "seat-locks.json",
  );
  private locks: SeatLockRecord[] = [];

  async onModuleInit() {
    await this.ensureStorage();
    await this.loadFromDisk();
    await this.purgeExpiredLocks();
  }

  async rebuildFromBookings(bookings: BookingRecord[]) {
    await this.ensureStorage();
    const rebuilt: SeatLockRecord[] = [];
    for (const booking of bookings) {
      if (!booking.passengers?.length) {
        continue;
      }
      if (booking.status === "cancelled" || booking.status === "expired") {
        continue;
      }
      const status = booking.status === "confirmed" ? "confirmed" : "locked";
      for (const passenger of booking.passengers) {
        if (!passenger.seatLabel) {
          continue;
        }
        rebuilt.push({
          seatLabel: passenger.seatLabel.toUpperCase(),
          route: booking.route,
          travelDate: booking.travelDate,
          seatType: booking.seatType,
          company: booking.company,
          busPlate: booking.busPlate,
          bookingReference: booking.bookingReference,
          status,
          lockedAt: booking.createdAt ?? new Date().toISOString(),
          expiresAt: status === "locked" ? (booking.expiresAt ?? null) : null,
        });
      }
    }
    this.locks = rebuilt;
    await this.persist();
    this.logger.log(`Seat locks rebuilt from ${bookings.length} bookings.`);
  }

  async lockSeats(payload: LockSeatsPayload) {
    await this.purgeExpiredLocks();
    const seatLabels = payload.seatLabels.map((label) =>
      label.trim().toUpperCase(),
    );
    this.ensureNoDuplicates(seatLabels);

    const conflicts = this.locks.filter((lock) => {
      return (
        this.matchesTrip(
          lock,
          payload.route,
          payload.travelDate,
          payload.busPlate,
          payload.seatType,
        ) && seatLabels.includes(lock.seatLabel)
      );
    });

    if (conflicts.length > 0) {
      const seats = conflicts.map((lock) => lock.seatLabel);
      throw new BadRequestException({
        code: "SEAT_LOCK_001",
        message: `Seats already reserved: ${seats.join(", ")}`,
      });
    }

    const lockedAt = new Date().toISOString();
    const records: SeatLockRecord[] = seatLabels.map((seatLabel) => ({
      seatLabel,
      route: payload.route,
      travelDate: payload.travelDate,
      seatType: payload.seatType,
      company: payload.company,
      busPlate: payload.busPlate,
      bookingReference: payload.bookingReference,
      status: "locked",
      lockedAt,
      expiresAt: payload.expiresAt ?? null,
    }));

    this.locks.push(...records);
    await this.persist();
    this.logger.log(
      `Locked ${records.length} seats for ${payload.route} on ${payload.travelDate} (${payload.bookingReference})`,
    );
  }

  async releaseSeats(bookingReference: string, includeConfirmed = false) {
    const before = this.locks.length;
    this.locks = this.locks.filter((lock) => {
      if (lock.bookingReference !== bookingReference) {
        return true;
      }
      if (lock.status === "confirmed" && !includeConfirmed) {
        return true;
      }
      return false;
    });
    if (this.locks.length !== before) {
      await this.persist();
      this.logger.log(`Released seats for booking ${bookingReference}`);
    }
  }

  async markSeatsConfirmed(bookingReference: string) {
    let mutated = false;
    for (const lock of this.locks) {
      if (
        lock.bookingReference === bookingReference &&
        lock.status !== "confirmed"
      ) {
        lock.status = "confirmed";
        lock.expiresAt = null;
        mutated = true;
      }
    }
    if (mutated) {
      await this.persist();
      this.logger.log(
        `Marked seats as confirmed for booking ${bookingReference}`,
      );
    }
  }

  async getAvailability(
    query: SeatAvailabilityQueryDto,
  ): Promise<SeatAvailabilitySnapshot> {
    await this.purgeExpiredLocks();
    const relevant = this.locks.filter((lock) =>
      this.matchesTrip(
        lock,
        query.route,
        query.travelDate,
        query.busPlate,
        query.seatType,
      ),
    );
    const reservedSeatIds = Array.from(
      new Set(relevant.map((lock) => lock.seatLabel)),
    );
    return {
      route: query.route,
      travelDate: query.travelDate,
      busPlate: query.busPlate,
      seatType: query.seatType,
      seats: relevant.map((lock) => ({
        seatLabel: lock.seatLabel,
        status: lock.status,
        bookingReference: lock.bookingReference,
        expiresAt: lock.expiresAt ?? null,
      })),
      reservedSeatIds,
    };
  }

  private ensureNoDuplicates(seatLabels: string[]) {
    const duplicates = seatLabels.filter(
      (seat, index) => seatLabels.indexOf(seat) !== index,
    );
    if (duplicates.length > 0) {
      throw new BadRequestException({
        code: "SEAT_LOCK_002",
        message: `Duplicate seats requested: ${[...new Set(duplicates)].join(", ")}`,
      });
    }
  }

  private matchesTrip(
    lock: SeatLockRecord,
    route: string,
    travelDate: string,
    busPlate?: string,
    seatType?: string,
  ) {
    if (lock.route !== route || lock.travelDate !== travelDate) {
      return false;
    }
    if (busPlate && lock.busPlate && lock.busPlate !== busPlate) {
      return false;
    }
    if (seatType && lock.seatType && lock.seatType !== seatType) {
      return false;
    }
    return true;
  }

  private async purgeExpiredLocks() {
    const now = Date.now();
    const before = this.locks.length;
    this.locks = this.locks.filter((lock) => {
      if (lock.status === "confirmed") {
        return true;
      }
      if (!lock.expiresAt) {
        return true;
      }
      return Date.parse(lock.expiresAt) > now;
    });
    if (this.locks.length !== before) {
      await this.persist();
      this.logger.log("Purged expired seat locks");
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
      this.locks = contents ? (JSON.parse(contents) as SeatLockRecord[]) : [];
    } catch (error) {
      this.logger.error("Failed to read seat lock storage", error as Error);
      this.locks = [];
    }
  }

  private async persist() {
    await fs.writeFile(this.storagePath, JSON.stringify(this.locks, null, 2));
  }
}
