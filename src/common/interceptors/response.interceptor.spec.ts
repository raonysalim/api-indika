/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { ResponseInterceptor, ApiResponse } from './response.interceptor';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>;

  const makeContext = (statusCode: number): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getResponse: () => ({ statusCode }),
      }),
    }) as unknown as ExecutionContext;

  const makeHandler = (data: unknown): CallHandler<unknown> =>
    ({ handle: () => of(data) }) as unknown as CallHandler<unknown>;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap a plain payload with success, statusCode and default message', async () => {
    const result = (await lastValueFrom(
      interceptor.intercept(
        makeContext(200),
        makeHandler({ id: 1, name: 'Ana' }),
      ),
    )) as ApiResponse<unknown>;

    expect(result.statusCode).toBe(200);
    expect(result.message).toBe('Success');
    expect(result.data).toEqual({ id: 1, name: 'Ana' });
  });

  it('should use "Created successfully" for 201', async () => {
    const result = (await lastValueFrom(
      interceptor.intercept(makeContext(201), makeHandler({ id: 1 })),
    )) as ApiResponse<unknown>;

    expect(result.statusCode).toBe(201);
    expect(result.message).toBe('Created successfully');
  });

  it('should use the default message for any other status code', async () => {
    const result = (await lastValueFrom(
      interceptor.intercept(makeContext(202), makeHandler({ id: 1 })),
    )) as ApiResponse<unknown>;

    expect(result.message).toBe('Operation completed successfully');
  });

  it('should return the payload unchanged when it is already wrapped', async () => {
    const alreadyWrapped: ApiResponse<unknown> = {
      success: true,
      statusCode: 200,
      data: { foo: 'bar' },
    };

    const result = await lastValueFrom(
      interceptor.intercept(makeContext(200), makeHandler(alreadyWrapped)),
    );

    expect(result).toBe(alreadyWrapped);
  });

  it('should set data to null for 204 No Content', async () => {
    const result = (await lastValueFrom(
      interceptor.intercept(makeContext(204), makeHandler(undefined)),
    )) as ApiResponse<unknown>;

    expect(result.statusCode).toBe(204);
    expect(result.data).toBeNull();
  });

  it('should extract pagination meta when the payload is a paginated response', async () => {
    const payload = {
      items: [1, 2],
      total: 10,
      page: 1,
      pageSize: 4,
      extra: 'kept-in-meta',
    };

    const result = (await lastValueFrom(
      interceptor.intercept(makeContext(200), makeHandler(payload)),
    )) as ApiResponse<unknown>;

    expect(result.data).toEqual([1, 2]);
    expect(result.meta).toEqual({
      pagination: { total: 10, page: 1, pageSize: 4, totalPages: 3 },
      extra: 'kept-in-meta',
    });
  });

  it('should not extract meta when the payload is not paginated', async () => {
    const result = (await lastValueFrom(
      interceptor.intercept(
        makeContext(200),
        makeHandler({ items: [1], total: 1 }),
      ),
    )) as ApiResponse<unknown>;

    expect(result.data).toEqual({ items: [1], total: 1 });
    expect(result.meta).toBeUndefined();
  });
});
