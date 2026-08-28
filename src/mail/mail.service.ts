import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
    this.fromEmail =
      this.configService.get<string>('MAIL_FROM_EMAIL') || 'noreply@indika.com';
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });
      if (result.error) {
        console.error('Failed to send email:', result.error);
        throw new InternalServerErrorException('Failure sending email');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new InternalServerErrorException('Failure sending email');
    }
  }

  async sendVerificationEmail(
    to: string,
    verificationCode: string,
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verificação de E-mail</h2>
        <p>Seu código de verificação é: <strong>${verificationCode}</strong></p>
        <p>Este código expira em 10 minutos.</p>
        <p>Se você não solicitou este código, por favor ignore este e-mail.</p>
      </div>
    `;
    await this.sendEmail(to, 'Código de Verificação - Indika', html);
  }

  async sendPasswordResetEmail(
    to: string,
    verificationCode: string,
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Redefinição de Senha</h2>
        <p>Seu código de redefinição de senha é: <strong>${verificationCode}</strong></p>
        <p>Este código expira em 10 minutos.</p>
        <p>Se você não solicitou a redefinição de senha, por favor ignore este e-mail.</p>
      </div>
    `;
    await this.sendEmail(to, 'Redefinição de Senha - Indika', html);
  }
}
