import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleEnabledGuard } from './guards/google-enabled.guard';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_AT_SECRET') ?? 'dev_access_secret',
        signOptions: {
          expiresIn: config.get<string>('JWT_AT_EXPIRES_IN') ?? '15m',
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    GoogleEnabledGuard,
    {
      provide: 'GOOGLE_STRATEGY',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const id = config.get<string>('GOOGLE_CLIENT_ID');
        const secret = config.get<string>('GOOGLE_CLIENT_SECRET');
        if (id && secret) {
          // Instantiating the strategy registers it with Passport under the name 'google'
          return new GoogleStrategy(config);
        }
        return null as unknown as GoogleStrategy;
      },
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
