/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { PrismaClientExceptionFilter } from './prisma-exception.filter';

// O Prisma é importado de '../../../generated/prisma/client'. Para evitar
// depender do tipo real, construímos o erro com um cast parcial. O filter só
// lê `code` e `meta`, então um objeto mínimo é suficiente.
type KnownRequestErrorLike = {
  code: string;
  meta?: Record<string, unknown>;
};

const makeException = (code: string, meta?: Record<string, unknown>) =>
  ({
    code,
    meta,
  }) as any;

const makeHost = (response: { status: jest.Mock; json: jest.Mock }) =>
  ({
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  }) as unknown as ArgumentsHost;

describe('PrismaClientExceptionFilter', () => {
  let filter: PrismaClientExceptionFilter;

  beforeEach(() => {
    filter = new PrismaClientExceptionFilter();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('P2002 (unique constraint)', () => {
    it('should respond 409 with a message naming the field from meta', () => {
      const status = jest.fn().mockReturnThis();
      const json = jest.fn();
      const response = { status, json };

      const exception: KnownRequestErrorLike = {
        code: 'P2002',
        meta: { fields: ['email'] },
      };

      filter.catch(
        makeException(exception.code, exception.meta),
        makeHost(response),
      );

      expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(json).toHaveBeenCalledWith({
        statusCode: HttpStatus.CONFLICT,
        message: 'The email field is already in use',
        error: 'Conflict',
      });
    });

    it('should fall back to the driver adapter error field', () => {
      const status = jest.fn().mockReturnThis();
      const json = jest.fn();
      const response = { status, json };

      const exception: KnownRequestErrorLike = {
        code: 'P2002',
        meta: {
          driverAdapterError: {
            cause: { constraint: { fields: ['nickname'] } },
          },
        },
      };

      filter.catch(
        makeException(exception.code, exception.meta),
        makeHost(response),
      );

      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'The nickname field is already in use',
        }),
      );
    });

    it('should use a generic message when no field can be extracted', () => {
      const status = jest.fn().mockReturnThis();
      const json = jest.fn();
      const response = { status, json };

      filter.catch(makeException('P2002', {}), makeHost(response));

      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Duplicate record' }),
      );
    });
  });

  describe('P2025 (record not found)', () => {
    it('should respond 404 with the not found message', () => {
      const status = jest.fn().mockReturnThis();
      const json = jest.fn();
      const response = { status, json };

      filter.catch(makeException('P2025'), makeHost(response));

      expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(json).toHaveBeenCalledWith({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Record not found',
        error: 'Not Found',
      });
    });
  });

  describe('P2003 (foreign key constraint)', () => {
    it('should respond 400 naming the index from meta', () => {
      const status = jest.fn().mockReturnThis();
      const json = jest.fn();
      const response = { status, json };

      const exception: KnownRequestErrorLike = {
        code: 'P2003',
        meta: { index: 'User_pkey' },
      };

      filter.catch(
        makeException(exception.code, exception.meta),
        makeHost(response),
      );

      expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Foreign key constraint failed on the field: User_pkey',
        error: 'Bad Request',
      });
    });

    it('should fall back to the driver adapter error index', () => {
      const status = jest.fn().mockReturnThis();
      const json = jest.fn();
      const response = { status, json };

      const exception: KnownRequestErrorLike = {
        code: 'P2003',
        meta: {
          driverAdapterError: {
            cause: { constraint: { index: 'Order_userId_fkey' } },
          },
        },
      };

      filter.catch(
        makeException(exception.code, exception.meta),
        makeHost(response),
      );

      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            'Foreign key constraint failed on the field: Order_userId_fkey',
        }),
      );
    });
  });

  describe('default (unhandled code)', () => {
    it('should delegate to super.catch (base filter)', () => {
      filter = new PrismaClientExceptionFilter({} as never);

      // Estado do response NÃO deve ser alterado para códigos não mapeados;
      // a responsabilidade vai para o BaseExceptionFilter (super.catch).
      const status = jest.fn().mockReturnThis();
      const json = jest.fn();
      const response = { status, json };
      const exception = makeException('P5000');
      const host = makeHost(response);

      // O super.catch tenta usar o applicationRef {} e vai falhar ao escrever
      // a resposta — o que prova que delegamos ao BaseExceptionFilter e NÃO
      // respondemos 4xx/409 por conta própria aqui.
      expect(() => filter.catch(exception, host)).toThrow();
      expect(json).not.toHaveBeenCalled();
    });
  });
});
