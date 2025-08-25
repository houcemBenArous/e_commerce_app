import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PasswordReset, PasswordResetDocument } from './password-reset.schema';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { MailerService } from '../../common/mailer/mailer.service';

@Injectable()
export class PasswordResetService implements OnModuleInit {
  private ttlMs: number; // ms
  private resendCooldownMs: number; // ms

  constructor(
    @InjectModel(PasswordReset.name) private readonly model: Model<PasswordResetDocument>,
    private readonly config: ConfigService,
    private readonly mailer: MailerService,
  ) {
    const ttlSec = Number(this.config.get('PASSWORD_RESET_TTL_SECONDS'));
    const cooldownSec = Number(this.config.get('PASSWORD_RESET_RESEND_COOLDOWN_SECONDS'));
    this.ttlMs = (Number.isFinite(ttlSec) && ttlSec! > 0 ? ttlSec! : 900) * 1000; // default 15m
    this.resendCooldownMs = (Number.isFinite(cooldownSec) && cooldownSec! > 0 ? cooldownSec! : 60) * 1000; // default 60s
  }

  async onModuleInit() {
    // Ensure TTL index on createdAt matches env cleanup
    const cleanupHours = Number(this.config.get('PASSWORD_RESET_CLEANUP_TTL_HOURS'));
    const expireAfterSeconds = Math.max(1, Math.floor(((Number.isFinite(cleanupHours) && cleanupHours! > 0 ? cleanupHours! : 48) * 3600)));
    try {
      await this.model.collection.dropIndex('createdAt_1');
    } catch (e) {
      // ignore
    }
    try {
      await this.model.collection.createIndex({ createdAt: 1 }, { name: 'createdAt_1', expireAfterSeconds });
    } catch (e) {
      // ignore if cannot create
    }
  }

  private buildResetLink(id: string, token: string) {
    const origin = this.config.get<string>('FRONTEND_ORIGIN') ?? 'http://localhost:3000';
    const url = new URL(origin);
    // Assume frontend page /reset exists
    url.pathname = '/reset';
    url.searchParams.set('resetId', id);
    url.searchParams.set('token', token);
    return url.toString();
  }

  async request(emailRaw: string) {
    const email = emailRaw.toLowerCase();

    // Optional cooldown: find most recent reset for this email
    const recent = await this.model.findOne({ email }).sort({ updatedAt: -1 }).exec();
    const recentUpdatedAt: any = recent ? ((recent as any).updatedAt || (recent as any)['updatedAt']) : null;
    if (recent && recentUpdatedAt && Date.now() - new Date(recentUpdatedAt).getTime() < this.resendCooldownMs) {
      // Avoid user enumeration and spamming: silently succeed without sending another email
      return { ok: true };
    }

    // Generate token + store hash
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + this.ttlMs);

    // Clean old ones for this email
    await this.model.deleteMany({ email }).exec();
    const doc = await this.model.create({ email, tokenHash, expiresAt, used: false });

    const link = this.buildResetLink(String(doc._id), token);
    await this.mailer.sendPasswordResetLink(email, link);

    // Return generic response to avoid user enumeration
    return { ok: true };
  }

  async verifyAndConsume(resetId: string, token: string) {
    const doc = await this.model.findById(resetId).exec();
    if (!doc) throw new BadRequestException('Invalid or expired reset link');
    if (doc.used) throw new BadRequestException('Reset link already used');
    if (doc.expiresAt.getTime() < Date.now()) throw new BadRequestException('Reset link expired');

    const ok = await bcrypt.compare(token, doc.tokenHash);
    if (!ok) throw new BadRequestException('Invalid or expired reset link');

    // Mark used
    doc.used = true;
    await doc.save();
    return { email: doc.email };
  }
}
