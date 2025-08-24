import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: Transporter | null = null;
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly config: ConfigService) {}

  private getFrom(): string {
    return this.config.get<string>('SMTP_FROM') || 'No-Reply <no-reply@example.com>';
  }

  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) return this.transporter;

    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    // Log presence (not values) to help diagnose .env issues
    this.logger.log(
      `SMTP config check -> host:${host ? 'set' : 'missing'} port:${port} user:${user ? 'set' : 'missing'} pass:${pass ? 'set' : 'missing'}`,
    );
    this.logger.log(
      `SMTP env check (process.env) -> host:${process.env.SMTP_HOST ? 'set' : 'missing'} user:${
        process.env.SMTP_USER ? 'set' : 'missing'
      } pass:${process.env.SMTP_PASS ? 'set' : 'missing'} cwd:${process.cwd()}`,
    );

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      try {
        await this.transporter.verify();
        this.logger.log('SMTP verify: success');
      } catch (err: any) {
        this.logger.error(`SMTP verify failed: ${err?.message || err}`);
      }
    } else {
      // Dev fallback: log emails to console using JSON transport
      this.logger.warn('SMTP not configured. Using JSON transport (emails will be logged, not sent).');
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
    }
    return this.transporter;
  }

  async sendVerificationCode(to: string, code: string) {
    const transporter = await this.getTransporter();
    const appName = this.config.get<string>('APP_NAME') || 'E-Commerce App';

    const subject = `${appName} - Your verification code`;
    const text = `Your verification code is: ${code}\n\nThis code expires in 5 minutes.`;
    const html = `<p>Your verification code is:</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p><p>This code expires in 5 minutes.</p>`;

    const info = await transporter.sendMail({
      from: this.getFrom(),
      to,
      subject,
      text,
      html,
    });

    // If using JSON transport, info.message will contain the JSON
    this.logger.log(`Sent verification email to ${to}: ${info.messageId || 'logged'}`);
    return info;
  }
}
