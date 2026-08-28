/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import 'reflect-metadata';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';

describe('CurrentUser', () => {
  class TestController {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handle(@CurrentUser() user: unknown) {}
  }

  // Acessa o metadata registrado pelo createParamDecorator quando aplicamos
  // @CurrentUser() sobre o parâmetro 0 de TestController#handle.
  const routeArgs =
    Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handle') || {};
  const entry = Object.values(routeArgs)[0] as {
    factory: (data: string | undefined, ctx: unknown) => unknown;
  };
  const factory = entry.factory;

  it('should be defined', () => {
    expect(CurrentUser).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof CurrentUser).toBe('function');
  });

  it('should register a metadata entry with a factory', () => {
    expect(entry).toBeDefined();
    expect(typeof entry.factory).toBe('function');
  });

  const makeContext = (user?: unknown) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  describe('factory', () => {
    it('should return the full user when no data key is requested', () => {
      const user = { sub: 'u1', email: 'a@b.com', iat: 1, exp: 2 };
      expect(factory(undefined, makeContext(user))).toEqual(user);
    });

    it('should return a single field when a key is requested', () => {
      const user = { sub: 'u1', email: 'a@b.com', iat: 1, exp: 2 };
      expect(factory('email', makeContext(user))).toBe('a@b.com');
      expect(factory('sub', makeContext(user))).toBe('u1');
    });

    it('should return undefined when there is no user on the request', () => {
      expect(factory(undefined, makeContext())).toBeUndefined();
    });

    it('should return undefined for a requested field that is missing', () => {
      const user = { sub: 'u1', email: 'a@b.com', iat: 1, exp: 2 };
      // 'exp' existe; 'nonexistent' não existe -> undefined
      expect(factory('iat', makeContext(user))).toBe(1);
      expect(factory('email' as keyof UserClaims, makeContext(user))).toBe(
        'a@b.com',
      );
    });
  });
});

// Helper type para satisfazer o "data" do decorator (chaves do JwtPayload).
type UserClaims = { sub: string; email: string; iat: number; exp: number };
