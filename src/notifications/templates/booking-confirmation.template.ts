import { BookingRecord } from "../../bookings/interfaces/booking.interface";

const formatDate = (value?: string) => {
  if (!value) return "TBA";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(dt);
};

export const buildBookingConfirmationHtml = (booking: BookingRecord) => {
  const currency = booking.currency ?? "VND";
  let totalFormatted: string;
  try {
    totalFormatted = booking.total.toLocaleString("vi-VN", {
      style: "currency",
      currency,
    });
  } catch (error) {
    totalFormatted = `${booking.total} ${currency}`;
  }
  const passengers = booking.passengers
    .map(
      (passenger, index) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">
            ${index + 1}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">
            ${passenger.name}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">
            ${passenger.seatLabel}
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; background:#f8fafc; padding:32px;">
      <table style="max-width:640px; margin:0 auto; background:white; border-radius:20px; box-shadow:0 20px 45px rgba(15,23,42,0.08); overflow:hidden;">
        <tr>
          <td style="padding:32px 32px 16px; text-align:center; background:linear-gradient(135deg,#2563eb,#06b6d4); color:white;">
            <h1 style="margin:0; font-size:28px; letter-spacing:0.08em;">BUSTICKET.VN</h1>
            <p style="margin:8px 0 0; font-size:16px;">Your booking is confirmed</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px; color:#0f172a;">
            <p style="font-size:12px; letter-spacing:0.3em; text-transform:uppercase; color:#94a3b8; margin:0 0 12px;">Booking reference</p>
            <p style="font-size:24px; font-weight:600; margin:0 0 16px;">${booking.bookingReference}</p>

            <div style="border:1px solid #e2e8f0; border-radius:16px; padding:20px; margin-bottom:24px;">
              <h2 style="margin:0 0 8px; font-size:18px;">${booking.route}</h2>
              <p style="margin:0; color:#475569;">Departure ${formatDate(booking.travelDate)}</p>
              ${booking.arrival ? `<p style="margin:4px 0 0; color:#475569;">Arrival ${formatDate(booking.arrival)}</p>` : ""}
            </div>

            <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:8px 12px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.2em; color:#94a3b8;">#</th>
                  <th style="padding:8px 12px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.2em; color:#94a3b8;">Passenger</th>
                  <th style="padding:8px 12px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.2em; color:#94a3b8;">Seat</th>
                </tr>
              </thead>
              <tbody>
                ${passengers}
              </tbody>
            </table>

            <div style="display:flex; gap:16px; flex-wrap:wrap; margin-bottom:24px;">
              <div style="flex:1 1 240px; border:1px dashed #cbd5f5; border-radius:16px; padding:16px;">
                <p style="margin:0; font-size:12px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.2em;">Seat type</p>
                <p style="margin:4px 0 0; font-weight:600;">${booking.seatType ?? "Standard"}</p>
              </div>
              <div style="flex:1 1 240px; border:1px dashed #cbd5f5; border-radius:16px; padding:16px;">
                <p style="margin:0; font-size:12px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.2em;">Total paid</p>
                <p style="margin:4px 0 0; font-weight:600;">${totalFormatted}</p>
              </div>
            </div>

            <p style="margin:0 0 4px; font-size:13px; color:#475569;">Need help? Our hotline is available 24/7: <strong>1900 868 686</strong></p>
            <p style="margin:0; font-size:12px; color:#94a3b8;">Please arrive 30 minutes early with your ID.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 32px; text-align:center; color:#94a3b8; font-size:12px;">
            &copy; ${new Date().getFullYear()} BusTicket. All rights reserved.
          </td>
        </tr>
      </table>
    </div>
  `;
};
