import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { Public } from '../common/decorators/public.decorator';
import { GetCurrentUser, GetCurrentUserId } from '../common/decorators/get-current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

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
}
