import { LoginMethod } from '../../../generated/prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
  method: LoginMethod;
}