import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Tokens } from './types/tokens.type';
import { JwtPayload } from './types/jwt-payload.type';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private async hash(data: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(data, salt);
  }

  private async verify(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }

  private async signTokens(userId: string, email: string, roles: Role[]): Promise<Tokens> {
    const payload: JwtPayload = { sub: userId, email, roles };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_AT_SECRET') ?? 'dev_access_secret',
        expiresIn: this.config.get<string>('JWT_AT_EXPIRES_IN') ?? '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_RT_SECRET') ?? 'dev_refresh_secret',
        expiresIn: this.config.get<string>('JWT_RT_EXPIRES_IN') ?? '7d',
      }),
    ]);
    return { accessToken, refreshToken };
  }

  async signup(dto: SignupDto): Promise<Tokens> {
    const passwordHash = await this.hash(dto.password);
    const user = await this.usersService.createUser({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });
    const tokens = await this.signTokens(user.id, user.email, user.roles ?? [Role.User]);
    const rtHash = await this.hash(tokens.refreshToken);
    await this.usersService.setRefreshTokenHash(user.id, rtHash);
    return tokens;
  }

  async signin(dto: SigninDto): Promise<Tokens> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await this.verify(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.signTokens(user.id, user.email, user.roles ?? [Role.User]);
    const rtHash = await this.hash(tokens.refreshToken);
    await this.usersService.setRefreshTokenHash(user.id, rtHash);
    return tokens;
  }

  async logout(userId: string) {
    await this.usersService.setRefreshTokenHash(userId, null);
    return { success: true };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshTokenHash) throw new ForbiddenException('Access denied');

    const rtMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!rtMatches) throw new ForbiddenException('Access denied');

    const tokens = await this.signTokens(user.id, user.email, user.roles ?? [Role.User]);
    const rtHash = await this.hash(tokens.refreshToken);
    await this.usersService.setRefreshTokenHash(user.id, rtHash);
    return tokens;
  }
}
