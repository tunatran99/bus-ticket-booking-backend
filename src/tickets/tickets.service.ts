import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { SendTicketDto } from "./dto/send-ticket.dto";

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);
  private transporter: nodemailer.Transporter | null = null;
  private transporterInitialized = false;

  constructor(private readonly configService: ConfigService) {}

  private async getTransporter(): Promise<nodemailer.Transporter | null> {
    if (this.transporterInitialized) {
      return this.transporter;
    }

    const host = this.configService.get<string>("SMTP_HOST");
    const port = this.configService.get<string>("SMTP_PORT");
    const user = this.configService.get<string>("SMTP_USER");
    const pass = this.configService.get<string>("SMTP_PASS");

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465,
        auth: {
          user,
          pass,
        },
      });
    } else {
      this.logger.warn(
        "SMTP credentials are missing. Ticket emails will be logged instead of sent.",
      );
      this.transporter = null;
    }

    this.transporterInitialized = true;
    return this.transporter;
  }

  async sendTicketEmail(dto: SendTicketDto) {
    const transporter = await this.getTransporter();
    const subject = `${dto.ticket.route.origin} → ${dto.ticket.route.destination} | E-ticket ${dto.ticket.bookingReference}`;
    const html = this.buildHtmlBody(dto);
    const fromAddress =
      this.configService.get<string>("SMTP_FROM") ?? "tickets@busticket.local";

    if (!transporter) {
      this.logger.log(`Simulated ticket email to ${dto.recipient}: ${subject}`);
      return {
        success: true,
        simulated: true,
      };
    }

    await transporter.sendMail({
      to: dto.recipient,
      from: fromAddress,
      subject,
      html,
      text: this.buildTextBody(dto),
    });

    return {
      success: true,
    };
  }

  private buildHtmlBody(dto: SendTicketDto) {
    const { ticket } = dto;
    const format = (value: string) =>
      new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));

    return `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; color: #0f172a;">
        <h2>Electronic Ticket</h2>
        <p>Booking reference: <strong>${ticket.bookingReference}</strong></p>
        <p>Issued by: <strong>${ticket.issuedBy}</strong></p>
        <hr />
        <h3>Passenger</h3>
        <p>${ticket.passenger.name}${ticket.passenger.id ? ` (${ticket.passenger.id})` : ""}</p>
        <h3>Route</h3>
        <p>${ticket.route.origin} → ${ticket.route.destination}</p>
        <h3>Schedule</h3>
        <p>Departure: ${format(ticket.departure.time)} ${
          ticket.departure.terminal ? `from ${ticket.departure.terminal}` : ""
        }</p>
        <p>Arrival: ${format(ticket.arrival.time)} ${
          ticket.arrival.terminal ? `at ${ticket.arrival.terminal}` : ""
        }</p>
        <h3>Seat</h3>
        <p>${ticket.seat.label} ${ticket.seat.type ? `(${ticket.seat.type})` : ""}</p>
        <p>Coach: ${ticket.seat.coach ?? "N/A"}</p>
        <hr />
        <p>
          Need help? Contact ${ticket.supportContact ?? "our hotline"}.
        </p>
      </div>
    `;
  }

  private buildTextBody(dto: SendTicketDto) {
    const { ticket } = dto;
    const format = (value: string) => new Date(value).toLocaleString();

    return `Booking reference: ${ticket.bookingReference}
Passenger: ${ticket.passenger.name}
Route: ${ticket.route.origin} → ${ticket.route.destination}
Departure: ${format(ticket.departure.time)}
Arrival: ${format(ticket.arrival.time)}
Seat: ${ticket.seat.label} ${ticket.seat.type ? `(${ticket.seat.type})` : ""}
Bus: ${ticket.bus.name}${ticket.bus.plate ? ` - ${ticket.bus.plate}` : ""}
Support: ${ticket.supportContact ?? "Contact our hotline"}
`;
  }
}
