import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokenPayload } from './interfaces/user.interface';
import { Request } from 'express';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from '../rbac/decorators/roles.decorator';
import { RolesGuard } from '../rbac/guards/roles.guard';

@ApiTags('Authentication')
// @Controller('auth')
@Controller('user')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Email or phone already exists',
  })
  @ApiResponse({
    status: 422,
    description: 'Validation error',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and receive JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Invalidate current session' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logout() {
    return this.authService.logout();
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@Req() req: Request & { user: TokenPayload }) {
    const payload = req.user;
    const user = await this.usersService.findById(payload.userId);
    if (!user) {
      return {
        success: false,
        data: null,
        message: 'User not found',
      };
    }
    const { password, ...userWithoutPassword } = user as any;
    return {
      success: true,
      data: userWithoutPassword,
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid current password' })
  async changePassword(
    @Req() req: Request & { user: TokenPayload },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Get('all')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({ status: 200, description: 'List of users returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listAll(@Req() req: Request & { user: TokenPayload }) {
    const users = await this.usersService.findAll();
    const sanitized = users.map(({ password, ...u }) => u);
    return {
      success: true,
      data: sanitized,
    };
  }
}
