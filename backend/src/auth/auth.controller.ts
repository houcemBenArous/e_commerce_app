import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { Public } from '../common/decorators/public.decorator';
import { GetCurrentUser, GetCurrentUserId } from '../common/decorators/get-current-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('signin')
  async signin(@Body() dto: SigninDto) {
    return this.auth.signin(dto);
  }

  @HttpCode(200)
  @Post('logout')
  async logout(@GetCurrentUserId() userId: string) {
    return this.auth.logout(userId);
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(200)
  @Post('refresh')
  async refresh(@GetCurrentUserId() userId: string, @GetCurrentUser('refreshToken') rt: string) {
    return this.auth.refreshTokens(userId, rt);
  }

  @Get('me')
  async me(@GetCurrentUser() user: any) {
    return user;
  }
}
