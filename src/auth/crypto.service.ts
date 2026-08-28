import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ErrorMessages } from '../common/messages/error.messages';

@Injectable()
export class CryptoService {
  private readonly SALT_ROUNDS: string;
  private readonly PEPPER_SECRET: string;

  constructor(private configService: ConfigService) {
    this.SALT_ROUNDS = this.configService.get<string>('SALT_ROUNDS')!;
    this.PEPPER_SECRET = this.configService.get<string>('PEPPER_SECRET')!;

    if (!this.PEPPER_SECRET || !this.SALT_ROUNDS) {
      throw new Error(ErrorMessages.env.invalid);
    }
  }

  async hashPassword(password: string): Promise<string> {
    const pepperedPassword = crypto
      .createHmac('sha256', this.PEPPER_SECRET)
      .update(password)
      .digest('hex');

    return bcrypt.hash(pepperedPassword, parseInt(this.SALT_ROUNDS));
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    const pepperedPassword = crypto
      .createHmac('sha256', this.PEPPER_SECRET)
      .update(password)
      .digest('hex');
    return bcrypt.compare(pepperedPassword, hash);
  }
}
