import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VerificationDocument = HydratedDocument<Verification>;

@Schema({ timestamps: true })
export class Verification {
  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: true })
  codeHash: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ required: true, enum: ['local', 'google'] })
  type: 'local' | 'google';

  @Prop({ type: Object })
  payload: Record<string, any>;
}

export const VerificationSchema = SchemaFactory.createForClass(Verification);

// TTL index to auto-clean stale verifications. We retain docs after `expiresAt`
// so users can still request a new code after expiry (resend regenerates code
// and pushes `expiresAt`). Clean up after 24 hours from creation.
VerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });
