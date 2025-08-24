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

// TTL index to auto-clean expired verifications
VerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
