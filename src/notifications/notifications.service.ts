import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { promises as fs } from "fs";
import { dirname, join } from "path";
import * as nodemailer from "nodemailer";
import twilio, { Twilio } from "twilio";
import { BookingRecord } from "../bookings/interfaces/booking.interface";
import { NotificationPreferences } from "./interfaces/notification-preferences.interface";
import { buildBookingConfirmationHtml } from "./templates/booking-confirmation.template";

interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly prefsPath = join(
    process.cwd(),
    "storage",
    "notification-preferences.json",
  );
  private transporter: nodemailer.Transporter | null = null;
  private transporterInitialized = false;
  private twilioClient: Twilio | null = null;
  private preferences = new Map<string, NotificationPreferences>();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.ensurePrefStorage();
    await this.loadPreferences();
    this.initTwilio();
  }

  async getPreferences(userId: string | null | undefined) {
    if (!userId) {
      return this.defaultPreferences("guest");
    }
    return this.preferences.get(userId) ?? this.defaultPreferences(userId);
  }

  async updatePreferences(
    userId: string,
    updates: Partial<Omit<NotificationPreferences, "userId" | "updatedAt">> & {
      reminderHoursBefore?: number;
    },
  ) {
    const current = await this.getPreferences(userId);
    const merged: NotificationPreferences = {
      ...current,
      ...updates,
      userId,
      updatedAt: new Date().toISOString(),
    };
    this.preferences.set(userId, merged);
    await this.persistPreferences();
    return merged;
  }

  async sendBookingConfirmation(booking: BookingRecord) {
    const prefs = await this.getPreferences(booking.userId);
    const contactEmail = booking.contact.email?.trim();

    if (prefs.emailEnabled && contactEmail) {
      await this.sendEmail({
        to: contactEmail,
        subject: `Booking confirmed · ${booking.route}`,
        html: buildBookingConfirmationHtml(booking),
        text: this.buildPlainTextConfirmation(booking),
      });
    }

    if (prefs.smsEnabled && booking.contact.phone) {
      await this.sendSms(
        booking.contact.phone,
        `Your BusTicket booking ${booking.bookingReference} is confirmed. Departure ${booking.travelDate}.`,
      );
    }
  }

  async sendReminder(booking: BookingRecord) {
    const prefs = await this.getPreferences(booking.userId);
    if (prefs.emailEnabled && booking.contact.email) {
      await this.sendEmail({
        to: booking.contact.email,
        subject: `Reminder · ${booking.route}`,
        html: `
          <p>Hi ${booking.contact.email},</p>
          <p>This is a reminder for your trip <strong>${booking.route}</strong> departing <strong>${booking.travelDate}</strong>.</p>
          <p>Please arrive 30 minutes early with your ID.</p>
        `,
        text: `Reminder: ${booking.route} departs ${booking.travelDate}. Please arrive early with your ID.`,
      });
    }
    if (prefs.smsEnabled && booking.contact.phone) {
      await this.sendSms(
        booking.contact.phone,
        `Reminder: trip ${booking.route} departs ${booking.travelDate}. Please arrive 30 minutes early.`,
      );
    }
  }

  private async sendEmail(payload: SendEmailPayload) {
    const transporter = await this.getTransporter();
    if (!transporter) {
      this.logger.log(`Simulated email to ${payload.to}: ${payload.subject}`);
      return;
    }
    const fromAddress =
      this.configService.get<string>("NOTIFICATIONS_FROM") ??
      this.configService.get<string>("SMTP_FROM") ??
      "notifications@busticket.local";
    await transporter.sendMail({
      to: payload.to,
      from: fromAddress,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
  }

  private async sendSms(to: string, body: string) {
    if (!this.twilioClient) {
      this.logger.log(`Simulated SMS to ${to}: ${body}`);
      return;
    }
    const from = this.configService.get<string>("TWILIO_FROM");
    if (!from) {
      this.logger.warn("TWILIO_FROM missing. SMS skipped.");
      return;
    }
    await this.twilioClient.messages.create({ to, from, body });
  }

  private async getTransporter(): Promise<nodemailer.Transporter | null> {
    if (this.transporterInitialized) {
      return this.transporter;
    }
    const host =
      this.configService.get<string>("NOTIFICATIONS_SMTP_HOST") ??
      this.configService.get<string>("SMTP_HOST");
    const port =
      this.configService.get<string>("NOTIFICATIONS_SMTP_PORT") ??
      this.configService.get<string>("SMTP_PORT");
    const user =
      this.configService.get<string>("NOTIFICATIONS_SMTP_USER") ??
      this.configService.get<string>("SMTP_USER");
    const pass =
      this.configService.get<string>("NOTIFICATIONS_SMTP_PASS") ??
      this.configService.get<string>("SMTP_PASS");

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465,
        auth: { user, pass },
      });
    } else {
      this.logger.warn(
        "SMTP credentials missing for notifications. Falling back to console logs.",
      );
      this.transporter = null;
    }
    this.transporterInitialized = true;
    return this.transporter;
  }

  private buildPlainTextConfirmation(booking: BookingRecord) {
    return `Booking reference: ${booking.bookingReference}\nRoute: ${booking.route}\nDeparture: ${booking.travelDate}\nSeats: ${booking.passengers
      .map((pax) => pax.seatLabel)
      .join(", ")}`;
  }

  private initTwilio() {
    const sid = this.configService.get<string>("TWILIO_ACCOUNT_SID");
    const token = this.configService.get<string>("TWILIO_AUTH_TOKEN");
    if (sid && token) {
      this.twilioClient = twilio(sid, token);
      this.logger.log("Twilio SMS client initialized");
    } else {
      this.twilioClient = null;
    }
  }

  private defaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      emailEnabled: true,
      smsEnabled: false,
      reminderHoursBefore: 24,
      updatedAt: new Date().toISOString(),
    };
  }

  private async ensurePrefStorage() {
    await fs.mkdir(dirname(this.prefsPath), { recursive: true });
    try {
      await fs.access(this.prefsPath);
    } catch (error) {
      await fs.writeFile(this.prefsPath, JSON.stringify([]));
    }
  }

  private async loadPreferences() {
    try {
      const contents = await fs.readFile(this.prefsPath, "utf8");
      const raw: NotificationPreferences[] = contents
        ? JSON.parse(contents)
        : [];
      raw.forEach((pref) => this.preferences.set(pref.userId, pref));
    } catch (error) {
      this.logger.error(
        "Failed to load notification preferences",
        error as Error,
      );
      this.preferences.clear();
    }
  }

  private async persistPreferences() {
    await fs.writeFile(
      this.prefsPath,
      JSON.stringify(Array.from(this.preferences.values()), null, 2),
    );
  }
}
