import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// 1. Crie uma interface com as claims exatas do seu JWT
export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export const CurrentUser = createParamDecorator(
  // 2. Mude o tipo do 'data' para aceitar apenas as chaves válidas do JwtPayload
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    // 3. Aqui está o pulo do gato: passamos o tipo genérico para o getRequest
    // Isso diz ao TS: "O request tem uma propriedade 'user' do tipo JwtPayload"
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();

    // Agora o ESLint não reclama mais, pois 'user' é fortemente tipado!
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
