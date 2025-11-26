import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_REDIRECT_URL')!,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: any, user?: any) => void,
  ) {
    try {
      const email = profile.emails?.[0]?.value;
      const fullName =
        profile.displayName ||
        [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') ||
        'Google User';

      if (!email) {
        return done(new Error('Google profile has no email'));
      }

      let user = await this.usersService.findByEmail(email);

      if (!user) {
        user = await this.usersService.create({
          email,
          phone: '',
          fullName,
          password: 'google_oauth_no_password',
          role: 'passenger',
        } as any);
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
}
