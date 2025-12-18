import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { BookingsService } from "./bookings.service";
import { BookingsController } from "./bookings.controller";
import { SeatLocksService } from "./seat-locks.service";
import { BookingReminderService } from "./booking-reminder.service";
import { BookingExpirationService } from "./booking-expiration.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [AuthModule, NotificationsModule],
  providers: [
    BookingsService,
    SeatLocksService,
    BookingReminderService,
    BookingExpirationService,
  ],
  controllers: [BookingsController],
  exports: [BookingsService, SeatLocksService],
})
export class BookingsModule {}
