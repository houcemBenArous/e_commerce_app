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
import { VerifyConfirmDto } from './dto/verify-confirm.dto';
import { VerifyRequestDto } from './dto/verify-request.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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

  // New: initiate signup with email verification
  @Public()
  @Post('signup/initiate')
  async initiateSignup(@Body() dto: SignupDto) {
    return this.auth.initiateSignup(dto);
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

  // New: confirm verification code -> create account and issue tokens
  @Public()
  @Post('verify/confirm')
  async verifyConfirm(@Body() dto: VerifyConfirmDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.confirmVerification(dto.verificationId, dto.code);
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

  // New: resend verification code
  @Public()
  @Post('verify/request')
  async verifyRequest(@Body() dto: VerifyRequestDto) {
    return this.auth.resendVerification(dto.verificationId);
  }

  @Get('me')
  async me(@GetCurrentUser() user: any) {
    return user;
  }

  // Password reset by link
  @Public()
  @HttpCode(200)
  @Post('password/forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('password/reset')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
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
    const result = await this.auth.beginGoogleAuthOrIssueTokens(email, name || 'User');
    const secure = process.env.NODE_ENV === 'production';
    res.cookie('rt', result.tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const dest = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000') + '/oauth/callback';
    return res.redirect(dest);
  }
}
