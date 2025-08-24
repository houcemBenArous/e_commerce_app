import { ConflictException, Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Verification, VerificationDocument } from './verification.schema';
import { MailerService } from '../../common/mailer/mailer.service';

function generateCode(): string {
  // 6-digit code, no leading zeros issue by padding
  const n = Math.floor(Math.random() * 1_000_000);
  return n.toString().padStart(6, '0');
}

@Injectable()
export class VerificationService implements OnModuleInit {
  private readonly codeTTLms = 5 * 60 * 1000; // 5 minutes
  private readonly maxAttempts = 5;
  private readonly resendCooldownMs = 30 * 1000; // 30 seconds

  constructor(
    @InjectModel(Verification.name) private readonly model: Model<VerificationDocument>,
    private readonly mailer: MailerService,
  ) {}

  async onModuleInit() {
    // Ensure the old TTL index on expiresAt is dropped, and the new createdAt TTL is applied.
    try {
      await this.model.collection.dropIndex('expiresAt_1');
    } catch (e) {
      // ignore if it doesn't exist
    }
    try {
      await this.model.syncIndexes();
    } catch (e) {
      // ignore index sync errors; not critical for functionality
    }
  }

  async create(email: string, type: 'local' | 'google', payload: Record<string, any>) {
    email = email.toLowerCase();
    const code = generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + this.codeTTLms);

    // Optional: remove previous pending verifications for this email/type to avoid confusion
    await this.model.deleteMany({ email, type }).exec();

    const doc = await this.model.create({ email, type, codeHash, expiresAt, attempts: 0, payload });
    // Send email OTP only for local (form) signup. Do NOT send for Google OAuth.
    if (type === 'local') {
      await this.mailer.sendVerificationCode(email, code);
    }
    return {
      verificationId: String(doc._id),
      email,
      expiresAt: doc.expiresAt.toISOString(),
      ttlSec: Math.floor(this.codeTTLms / 1000),
    };
  }

  async resend(verificationId: string) {
    const doc = await this.model.findById(verificationId).exec();
    if (!doc) throw new BadRequestException('Verification not found');
    // Only allow resending codes for local signup; skip for OAuth verifications
    if (doc.type !== 'local') {
      return { ok: true };
    }
    // Cooldown using updatedAt
    const updatedAt: any = (doc as any).updatedAt || doc['updatedAt'];
    if (updatedAt && Date.now() - new Date(updatedAt).getTime() < this.resendCooldownMs) {
      throw new ConflictException('Please wait before requesting a new code');
    }
    const code = generateCode();
    doc.codeHash = await bcrypt.hash(code, 10);
    doc.expiresAt = new Date(Date.now() + this.codeTTLms);
    doc.attempts = 0;
    await doc.save();
    await this.mailer.sendVerificationCode(doc.email, code);
    return {
      ok: true,
      expiresAt: doc.expiresAt.toISOString(),
      ttlSec: Math.floor(this.codeTTLms / 1000),
    };
  }

  async verifyAndConsume(verificationId: string, code: string) {
    const doc = await this.model.findById(verificationId).exec();
    if (!doc) throw new BadRequestException('Invalid verification');
    if (doc.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Verification expired');
    }
    if (doc.attempts >= this.maxAttempts) {
      throw new BadRequestException('Too many attempts');
    }

    const ok = await bcrypt.compare(code, doc.codeHash);
    if (!ok) {
      doc.attempts += 1;
      await doc.save();
      throw new BadRequestException('Invalid code');
    }

    const payload = doc.payload;
    const email = doc.email;
    const type = doc.type;
    await doc.deleteOne();
    return { email, type, payload } as { email: string; type: 'local' | 'google'; payload: Record<string, any> };
  }
}
