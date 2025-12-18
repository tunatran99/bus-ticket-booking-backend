import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BookingsService } from "./bookings.service";
import { NotificationsService } from "../notifications/notifications.service";

const HOUR_IN_MS = 60 * 60 * 1000;

@Injectable()
export class BookingReminderService {
  private readonly logger = new Logger(BookingReminderService.name);
  private readonly dispatchedRefs = new Map<string, number>();

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleReminders() {
    const bookings = await this.bookingsService.getAllBookings();
    const now = Date.now();
    for (const booking of bookings) {
      if (booking.status !== "confirmed") {
        continue;
      }
      const travelTime = Date.parse(booking.travelDate);
      if (Number.isNaN(travelTime) || travelTime < now) {
        continue;
      }
      const prefs = await this.notificationsService.getPreferences(
        booking.userId,
      );
      const reminderWindowMs = prefs.reminderHoursBefore * HOUR_IN_MS;
      if (travelTime - now > reminderWindowMs) {
        continue;
      }
      const lastDispatched = this.dispatchedRefs.get(booking.bookingReference);
      if (lastDispatched && now - lastDispatched < reminderWindowMs / 2) {
        continue;
      }
      try {
        await this.notificationsService.sendReminder(booking);
        this.dispatchedRefs.set(booking.bookingReference, now);
        this.logger.log(
          `Reminder sent for ${booking.bookingReference} (${booking.route})`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send reminder for ${booking.bookingReference}`,
          error as Error,
        );
      }
    }
    this.cleanupCache(now);
  }

  private cleanupCache(now: number) {
    for (const [reference, timestamp] of this.dispatchedRefs.entries()) {
      if (now - timestamp > 48 * HOUR_IN_MS) {
        this.dispatchedRefs.delete(reference);
      }
    }
  }
}
