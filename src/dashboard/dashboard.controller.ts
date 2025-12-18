import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UsersService } from "../users/users.service";
import { Request } from "express";
import { TokenPayload } from "../auth/interfaces/user.interface";
import { Permissions } from "../rbac/decorators/permissions.decorator";
import { PermissionsGuard } from "../rbac/guards/permissions.guard";
import { Roles } from "../rbac/decorators/roles.decorator";
import { RolesGuard } from "../rbac/guards/roles.guard";
import { BookingsService } from "../bookings/bookings.service";
import { BookingRecord } from "../bookings/interfaces/booking.interface";

@ApiTags("Dashboard")
@Controller("dashboard")
export class DashboardController {
  constructor(
    private readonly usersService: UsersService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Get("me")
  @Permissions("dashboard.view")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get personal dashboard metrics for the current user",
  })
  @ApiResponse({ status: 200, description: "Dashboard metrics returned" })
  async getMyDashboard(@Req() req: Request & { user: TokenPayload }) {
    const user = await this.usersService.findById(req.user.userId);
    const bookings = user
      ? await this.bookingsService.listForUser(user.userId)
      : [];
    const metrics = this.buildUserMetrics(bookings);
    const recentTrips = this.buildRecentTrips(bookings);

    return {
      success: true,
      data: {
        user: user && {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
        metrics,
        recentTrips,
      },
    };
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get admin dashboard metrics" })
  @ApiResponse({ status: 200, description: "Admin dashboard metrics returned" })
  async getAdminDashboard(@Req() req: Request & { user: TokenPayload }) {
    const currentUser = await this.usersService.findById(req.user.userId);

    if (!currentUser || currentUser.role !== "admin") {
      // We intentionally do not throw Forbidden here to keep logic simple;
      // real enforcement is already done in AuthController for admin-only
      // but for the dashboard we just return empty metrics for non-admins.
      return {
        success: true,
        data: {
          role: currentUser?.role ?? "guest",
          metrics: {
            totalUsers: 0,
            totalAdmins: 0,
          },
          recentUsers: [],
        },
      };
    }

    const users = await this.usersService.findAll();
    const totalUsers = users.length;
    const totalAdmins = users.filter((u) => u.role === "admin").length;
    const bookings = await this.bookingsService.getAllBookings();
    const analytics = this.buildAdminAnalytics(bookings);

    return {
      success: true,
      data: {
        role: currentUser.role,
        metrics: {
          totalUsers,
          totalAdmins,
          totalRevenue: analytics.revenue.total,
          pendingRevenue: analytics.revenue.pending,
          conversionRate: analytics.conversionRate,
        },
        recentUsers: users.slice(-5).map((u) => ({
          userId: u.userId,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
        })),
        analytics,
      },
    };
  }

  // RBAC-secured admin dashboard (demonstration using RolesGuard)
  @Get("admin-secure")
  @Roles("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Secure admin dashboard metrics (RBAC enforced)" })
  @ApiResponse({ status: 200, description: "Admin dashboard metrics returned" })
  async getAdminDashboardSecure(@Req() req: Request & { user: TokenPayload }) {
    const users = await this.usersService.findAll();
    const totalUsers = users.length;
    const totalAdmins = users.filter((u) => u.role === "admin").length;
    const bookings = await this.bookingsService.getAllBookings();
    const analytics = this.buildAdminAnalytics(bookings);
    return {
      success: true,
      data: {
        role: "admin",
        metrics: {
          totalUsers,
          totalAdmins,
          totalRevenue: analytics.revenue.total,
          pendingRevenue: analytics.revenue.pending,
          conversionRate: analytics.conversionRate,
        },
        recentUsers: users.slice(-5).map((u) => ({
          userId: u.userId,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
        })),
        analytics,
      },
    };
  }

  private buildUserMetrics(bookings: BookingRecord[]) {
    const now = Date.now();
    const totalTickets = bookings.reduce(
      (sum, booking) => sum + booking.seatCount,
      0,
    );
    const upcomingTrips = bookings.filter((booking) => {
      if (booking.status !== "confirmed") return false;
      const travel = Date.parse(booking.travelDate);
      return !Number.isNaN(travel) && travel >= now;
    }).length;
    const completedTrips = bookings.filter((booking) => {
      if (booking.status !== "confirmed") return false;
      const travel = Date.parse(booking.travelDate);
      return !Number.isNaN(travel) && travel < now;
    }).length;
    const cancelledTrips = bookings.filter((booking) =>
      ["cancelled", "expired"].includes(booking.status),
    ).length;
    return { totalTickets, upcomingTrips, completedTrips, cancelledTrips };
  }

  private buildRecentTrips(bookings: BookingRecord[]) {
    return bookings
      .slice()
      .sort((a, b) => Date.parse(b.travelDate) - Date.parse(a.travelDate))
      .slice(0, 5)
      .map((booking) => {
        const parts = this.splitRoute(booking.route);
        const travelTs = Date.parse(booking.travelDate);
        return {
          id: booking.bookingReference,
          from: parts.origin,
          to: parts.destination,
          date: booking.travelDate,
          time: Number.isNaN(travelTs)
            ? "--"
            : new Date(travelTs).toLocaleTimeString(),
          status: booking.status,
          seats: booking.seatCount,
          price: booking.total,
        };
      });
  }

  private buildAdminAnalytics(bookings: BookingRecord[]) {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const confirmed = bookings.filter(
      (booking) => booking.status === "confirmed",
    );
    const totalRevenue = confirmed.reduce(
      (sum, booking) => sum + booking.total,
      0,
    );
    const pendingRevenue = bookings
      .filter((booking) => booking.status === "pending")
      .reduce((sum, booking) => sum + booking.total, 0);
    const last30Revenue = confirmed
      .filter((booking) => {
        const travel = Date.parse(booking.travelDate);
        return !Number.isNaN(travel) && travel >= thirtyDaysAgo;
      })
      .reduce((sum, booking) => sum + booking.total, 0);
    const conversionRate = bookings.length
      ? Number((confirmed.length / bookings.length).toFixed(2))
      : 0;

    const routeLeaderboard = this.groupByRoute(confirmed).slice(0, 5);
    const dailyTrend = this.buildRevenueTrend(confirmed, 7);
    const recentBookings = bookings
      .slice()
      .sort(
        (a, b) =>
          Date.parse(b.updatedAt ?? b.createdAt) -
          Date.parse(a.updatedAt ?? a.createdAt),
      )
      .slice(0, 5)
      .map((booking) => ({
        bookingReference: booking.bookingReference,
        route: booking.route,
        status: booking.status,
        total: booking.total,
        updatedAt: booking.updatedAt,
      }));
    const statusBreakdown = [
      "pending",
      "confirmed",
      "cancelled",
      "expired",
    ].map((status) => ({
      status,
      count: bookings.filter((booking) => booking.status === status).length,
    }));

    return {
      revenue: {
        total: totalRevenue,
        pending: pendingRevenue,
        last30Days: last30Revenue,
      },
      conversionRate,
      dailyTrend,
      routeLeaderboard,
      recentBookings,
      statusBreakdown,
    };
  }

  private groupByRoute(bookings: BookingRecord[]) {
    const map = new Map<
      string,
      { route: string; seats: number; revenue: number }
    >();
    bookings.forEach((booking) => {
      const existing = map.get(booking.route) ?? {
        route: booking.route,
        seats: 0,
        revenue: 0,
      };
      existing.seats += booking.seatCount;
      existing.revenue += booking.total;
      map.set(booking.route, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }

  private buildRevenueTrend(bookings: BookingRecord[], days: number) {
    const buckets = new Map<string, { revenue: number; tickets: number }>();
    bookings.forEach((booking) => {
      const travel = Date.parse(booking.travelDate);
      if (Number.isNaN(travel)) return;
      const key = new Date(booking.travelDate).toISOString().slice(0, 10);
      const bucket = buckets.get(key) ?? { revenue: 0, tickets: 0 };
      bucket.revenue += booking.total;
      bucket.tickets += booking.seatCount;
      buckets.set(key, bucket);
    });
    return Array.from(buckets.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-days)
      .map(([date, value]) => ({ date, ...value }));
  }

  private splitRoute(label?: string) {
    if (!label) {
      return { origin: "Origin", destination: "Destination" };
    }
    const delimiters = ["→", "->", " - ", " — ", " to "];
    for (const delimiter of delimiters) {
      if (label.includes(delimiter)) {
        const [origin, destination] = label
          .split(delimiter)
          .map((part) => part.trim());
        if (origin && destination) {
          return { origin, destination };
        }
      }
    }
    return { origin: label, destination: "Destination" };
  }
}
