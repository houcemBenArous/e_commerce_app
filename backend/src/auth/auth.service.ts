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
import { VerificationService } from './verification/verification.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly verification: VerificationService,
  ) {}

  private async hash(data: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(data, salt);
  }

  /**
   * Verify provided code for a verification session and finalize by creating user if needed.
   */
  async confirmVerification(verificationId: string, code: string): Promise<Tokens> {
    const result = await this.verification.verifyAndConsume(verificationId, code);
    if (result.type === 'local') {
      return this.finalizeVerifiedLocalSignup(result.payload as any);
    }
    // google
    const name = (result.payload?.name as string) || 'User';
    return this.finalizeVerifiedGoogleSignup({ email: result.email, name });
  }

  async resendVerification(verificationId: string) {
    return this.verification.resend(verificationId);
  }

  /**
   * For Google callback: always issue tokens.
   * - Existing user -> tokens
   * - New user -> create minimal account and tokens
   * No OTP/email verification is sent for Google flows.
   */
  async beginGoogleAuthOrIssueTokens(email: string, name: string): Promise<
    { kind: 'tokens'; tokens: Tokens }
  > {
    const existing = await this.usersService.findByEmail(email.toLowerCase());
    if (existing) {
      const tokens = await this.signTokens(existing.id, existing.email, existing.roles ?? [Role.User]);
      const rtHash = await this.hash(tokens.refreshToken);
      await this.usersService.setRefreshTokenHash(existing.id, rtHash);
      return { kind: 'tokens', tokens };
    }
    const tokens = await this.finalizeVerifiedGoogleSignup({ email, name });
    return { kind: 'tokens', tokens };
  }

  /**
   * Start email verification flow for local signup: hash password, store payload in a verification doc,
   * send code via email, and return verificationId.
   * No user is created yet.
   */
  async initiateSignup(dto: SignupDto): Promise<{ verificationId: string; email: string }> {
    const exists = await this.usersService.findByEmail(dto.email.toLowerCase());
    if (exists) throw new ForbiddenException('Email already in use');
    const passwordHash = await this.hash(dto.password);
    const payload = {
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash,
      phone: dto.phone,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country,
    };
    return this.verification.create(dto.email, 'local', payload);
  }

  /**
   * Finalize verified local signup: create user and issue tokens.
   */
  async finalizeVerifiedLocalSignup(payload: {
    name: string;
    email: string;
    passwordHash: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }): Promise<Tokens> {
    const user = await this.usersService.createUser(payload);
    const tokens = await this.signTokens(user.id, user.email, user.roles ?? [Role.User]);
    const rtHash = await this.hash(tokens.refreshToken);
    await this.usersService.setRefreshTokenHash(user.id, rtHash);
    return tokens;
  }

  /**
   * Finalize verified Google signup: minimal profile, random password, issue tokens.
   */
  async finalizeVerifiedGoogleSignup(params: { email: string; name: string }): Promise<Tokens> {
    const email = params.email.toLowerCase();
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      const randomPassword = `oauth:${Math.random().toString(36).slice(2)}:${Date.now()}`;
      const passwordHash = await this.hash(randomPassword);
      user = await this.usersService.createUser({
        name: params.name || 'User',
        email,
        passwordHash,
        phone: 'N/A',
        addressLine1: 'N/A',
        addressLine2: undefined,
        city: 'N/A',
        state: 'N/A',
        postalCode: 'N/A',
        country: 'N/A',
      });
    }
    const tokens = await this.signTokens(user.id, user.email, user.roles ?? [Role.User]);
    const rtHash = await this.hash(tokens.refreshToken);
    await this.usersService.setRefreshTokenHash(user.id, rtHash);
    return tokens;
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
      phone: dto.phone,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country,
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

  /**
   * Google OAuth login or signup.
   * Finds existing user by email or creates a minimal profile with placeholders, then issues tokens.
   */
  async oauthLogin(params: { email: string; name: string }): Promise<Tokens> {
    const email = params.email.toLowerCase();
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      // Create a minimal account with placeholder profile fields
      const randomPassword = `oauth:${Math.random().toString(36).slice(2)}:${Date.now()}`;
      const passwordHash = await this.hash(randomPassword);
      user = await this.usersService.createUser({
        name: params.name || 'User',
        email,
        passwordHash,
        phone: 'N/A',
        addressLine1: 'N/A',
        city: 'N/A',
        state: 'N/A',
        postalCode: 'N/A',
        country: 'N/A',
      });
    }

    const tokens = await this.signTokens(user.id, user.email, user.roles ?? [Role.User]);
    const rtHash = await this.hash(tokens.refreshToken);
    await this.usersService.setRefreshTokenHash(user.id, rtHash);
    return tokens;
  }
}
