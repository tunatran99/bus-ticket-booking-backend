import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { User } from './interfaces/user.interface';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class GoogleAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Redirects to Google OAuth consent screen
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ) {
    const result = await this.authService.loginWithGoogle(req.user);

    const frontendOrigin =
      this.configService.get<string>('CORS_ORIGIN') || 'http://localhost:5173';

    const query = new URLSearchParams({
      accessToken: result.data.accessToken ?? '',
      refreshToken: result.data.refreshToken ?? '',
    });

    return res.redirect(`${frontendOrigin}/oauth/google/callback?${query.toString()}`);
  }
}
