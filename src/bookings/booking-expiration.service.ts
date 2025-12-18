import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BookingsService } from "./bookings.service";

@Injectable()
export class BookingExpirationService {
  private readonly logger = new Logger(BookingExpirationService.name);

  constructor(private readonly bookingsService: BookingsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sweepExpiredBookings() {
    await this.bookingsService.runExpirationSweep();
    this.logger.debug("Booking expiration sweep executed");
  }
}
