import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { Request } from 'express';
import { TokenPayload } from '../auth/interfaces/user.interface';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import { RolesGuard } from '../rbac/guards/roles.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Permissions('dashboard.view')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get personal dashboard metrics for the current user' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics returned' })
  async getMyDashboard(@Req() req: Request & { user: TokenPayload }) {
    const user = await this.usersService.findById(req.user.userId);

    // In a real app, these would come from bookings, payments, etc.
    const metrics = {
      totalTickets: 5,
      upcomingTrips: 2,
      completedTrips: 3,
      cancelledTrips: 0,
    };

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
        recentTrips: [
          {
            id: 'trip_1',
            from: 'Hà Nội',
            to: 'Hồ Chí Minh',
            date: '2025-11-25',
            time: '08:00',
            status: 'upcoming',
            seats: 2,
            price: 500000,
          },
          {
            id: 'trip_2',
            from: 'Đà Nẵng',
            to: 'Hội An',
            date: '2025-11-20',
            time: '14:30',
            status: 'completed',
            seats: 1,
            price: 150000,
          },
          {
            id: 'trip_3',
            from: 'Hồ Chí Minh',
            to: 'Vũng Tàu',
            date: '2025-11-15',
            time: '10:00',
            status: 'completed',
            seats: 3,
            price: 450000,
          },
        ],
      },
    };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get admin dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Admin dashboard metrics returned' })
  async getAdminDashboard(@Req() req: Request & { user: TokenPayload }) {
    const currentUser = await this.usersService.findById(req.user.userId);

    if (!currentUser || currentUser.role !== 'admin') {
      // We intentionally do not throw Forbidden here to keep logic simple;
      // real enforcement is already done in AuthController for admin-only
      // but for the dashboard we just return empty metrics for non-admins.
      return {
        success: true,
        data: {
          role: currentUser?.role ?? 'guest',
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
    const totalAdmins = users.filter((u) => u.role === 'admin').length;

    return {
      success: true,
      data: {
        role: currentUser.role,
        metrics: {
          totalUsers,
          totalAdmins,
        },
        recentUsers: users.slice(-5).map((u) => ({
          userId: u.userId,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
        })),
      },
    };
  }

  // RBAC-secured admin dashboard (demonstration using RolesGuard)
  @Get('admin-secure')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Secure admin dashboard metrics (RBAC enforced)' })
  @ApiResponse({ status: 200, description: 'Admin dashboard metrics returned' })
  async getAdminDashboardSecure(@Req() req: Request & { user: TokenPayload }) {
    const users = await this.usersService.findAll();
    const totalUsers = users.length;
    const totalAdmins = users.filter((u) => u.role === 'admin').length;
    return {
      success: true,
      data: {
        role: 'admin',
        metrics: { totalUsers, totalAdmins },
        recentUsers: users.slice(-5).map((u) => ({
          userId: u.userId,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
        })),
      },
    };
  }
}
