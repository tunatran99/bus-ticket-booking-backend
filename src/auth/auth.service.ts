import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, TokenPayload } from './interfaces/user.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if email already exists
    const existingEmail = await this.usersService.findByEmail(
      registerDto.email,
    );
    if (existingEmail) {
      throw new ConflictException({
        code: 'USER_002',
        message: 'Email already exists',
      });
    }

    // Check if phone already exists
    const normalizedPhone = registerDto.phone?.trim();
    if (normalizedPhone) {
      const existingPhone = await this.usersService.findByPhone(normalizedPhone);
      if (existingPhone) {
        throw new ConflictException({
          code: 'USER_003',
          message: 'Phone already exists',
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      success: true,
      data: userWithoutPassword,
      message: 'registration successful',
    };
  }

  async login(loginDto: LoginDto) {
    // Find user by email or phone
    const user = await this.usersService.findByIdentifier(loginDto.identifier);

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_001',
        message: 'Invalid credentials',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 'AUTH_001',
        message: 'Invalid credentials',
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      success: true,
      data: {
        ...tokens,
        user: userWithoutPassword,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedException({
          code: 'AUTH_002',
          message: 'Invalid refresh token',
        });
      }

      const accessToken = await this.generateAccessToken(user);

      return {
        success: true,
        data: {
          accessToken,
          expiresIn: parseInt(this.configService.get('JWT_EXPIRES_IN')),
        },
      };
    } catch (error) {
      throw new UnauthorizedException({
        code: 'AUTH_002',
        message: 'Token expired or invalid',
      });
    }
  }

  async logout() {
    // In a real application, you would invalidate the token here
    // For example, by adding it to a blacklist in Redis
    return {
      success: true,
      message: 'logged out successfully',
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_003',
        message: 'User not found',
      });
    }
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 'AUTH_004',
        message: 'Current password is incorrect',
      });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.userId, hashed);
    return {
      success: true,
      message: 'Password updated successfully',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_001',
        message: 'User not found',
      });
    }

    // In a real application, you would:
    // 1. Generate a reset token
    // 2. Store it in the database with an expiration time
    // 3. Send an email with the reset link

    return {
      success: true,
      message: 'Password reset email sent',
    };
  }

  async loginWithGoogle(user: User) {
    const tokens = await this.generateTokens(user);

    const { password, ...userWithoutPassword } = user as any;

    return {
      success: true,
      data: {
        ...tokens,
        user: userWithoutPassword,
      },
    };
  }

  async generateTokens(user: User) {
    const payload: TokenPayload = {
      userId: user.userId,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: parseInt(this.configService.get('JWT_EXPIRES_IN')),
    };
  }

  private async generateAccessToken(user: User) {
    const payload: TokenPayload = {
      userId: user.userId,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });
  }
}
