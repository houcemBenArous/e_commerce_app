import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { Public } from '../common/decorators/public.decorator';
import { GetCurrentUser, GetCurrentUserId } from '../common/decorators/get-current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { GoogleEnabledGuard } from './guards/google-enabled.guard';
import type { Response } from 'express';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('signup')
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.signup(dto);
    const secure = process.env.NODE_ENV === 'production';
    res.cookie('rt', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @HttpCode(200)
  @Post('signin')
  async signin(@Body() dto: SigninDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.signin(dto);
    const secure = process.env.NODE_ENV === 'production';
    res.cookie('rt', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: tokens.accessToken };
  }

  @HttpCode(200)
  @Post('logout')
  async logout(@GetCurrentUserId() userId: string, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.logout(userId);
    res.clearCookie('rt', { path: '/api/auth' });
    return result;
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') rt: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.auth.refreshTokens(userId, rt);
    const secure = process.env.NODE_ENV === 'production';
    res.cookie('rt', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: tokens.accessToken };
  }

  @Get('me')
  async me(@GetCurrentUser() user: any) {
    return user;
  }

  // Google OAuth
  @Public()
  @Get('google')
  @UseGuards(GoogleEnabledGuard, AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
    return;
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleEnabledGuard, AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    // passport-google-oauth20 puts validated data on req.user
    const gUser = (req as Request & { user?: any }).user as { email?: string; name?: string } | undefined;
    const email = gUser?.email;
    const name = gUser?.name;
    if (!email) {
      return res.redirect((process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000') + '/login?error=google_no_email');
    }
    const tokens = await this.auth.oauthLogin({ email, name: name || 'User' });
    const secure = process.env.NODE_ENV === 'production';
    res.cookie('rt', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Redirect to frontend OAuth callback; frontend will call /auth/refresh to obtain access token
    const dest = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000') + '/oauth/callback';
    return res.redirect(dest);
  }
}
