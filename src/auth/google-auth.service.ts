import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleUser {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class GoogleAuthService {
  private readonly client: OAuth2Client;
  private readonly clientId: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('GOOGLE_CLIENT_ID')!;
    const secret = this.configService.get<string>('GOOGLE_CLIENT_SECRET')!;
    this.client = new OAuth2Client(this.clientId, secret, '');
  }

  async verifyIdToken(idToken: string): Promise<GoogleUser> {
    // Fluxo correto: o frontend (via Google Identity Services) envia um
    // id_token (JWT). A chave é VALIDAR esse token, não trocar authorization code.
    const ticket = await this.client.verifyIdToken({
      idToken: idToken,
      audience: this.clientId,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      throw new Error('Missing claims');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      firstName: payload.given_name || payload.email.split('@')[0] || 'User',
      lastName: payload.family_name || '',
    };
  }
}
