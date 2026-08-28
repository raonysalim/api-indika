/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * ResponseInterceptor - Global response wrapper for API endpoints
 *
 * Wraps all API responses with a consistent shape:
 * { success: true, statusCode, data, message?, meta? }
 *
 * Handles:
 * - Default messages per status code (200: "Success", 201: "Created successfully", etc.)
 * - Custom messages when data contains a 'message' property
 * - Paginated responses extraction (items/total/page/pageSize -> meta with pagination)
 * - 204 No Content handling
 * - Already-wrapped responses (from other interceptors)
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor() {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        // Don't wrap if already wrapped (e.g., from another interceptor)
        if (data && typeof data === 'object' && 'success' in data) {
          return data as ApiResponse<T>;
        }

        // Handle 204 No Content
        if (statusCode === 204) {
          return {
            success: true,
            statusCode,
            data: null as T,
          } as ApiResponse<T>;
        }

        // Detect paginated response
        const meta = this.extractMeta(data);
        const responseData = meta ? (data as { items?: unknown }).items : data;

        // Generate message: use custom message if provided, otherwise default
        const message = this.getDefaultMessage(statusCode, data);

        return {
          statusCode,
          data: responseData,
          message,
          meta,
        } as ApiResponse<T>;
      }),
    );
  }

  private extractMeta(data: unknown): Record<string, unknown> | undefined {
    if (
      data &&
      typeof data === 'object' &&
      'items' in data &&
      'total' in data &&
      'page' in data &&
      'pageSize' in data
    ) {
      const { total, page, pageSize, ...rest } = data as Record<
        string,
        unknown
      >;
      // Explicitly remove 'items' from rest to avoid including it in meta
      const filteredRest: Record<string, unknown> = {};
      for (const key of Object.keys(rest)) {
        if (key !== 'items') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          filteredRest[key] = (rest as any)[key];
        }
      }
      return {
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil((total as number) / (pageSize as number)),
        },
        ...filteredRest,
      };
    }
    return undefined;
  }

  private getDefaultMessage(statusCode: number, data?: unknown): string {
    // Check if data contains a custom message
    if (data && typeof data === 'object' && 'message' in data) {
      const msg = (data as Record<string, unknown>).message;
      if (typeof msg === 'string') {
        return msg;
      }
    }

    switch (statusCode) {
      case 200:
        return 'Success';
      case 201:
        return 'Created successfully';
      case 204:
        return 'No Content';
      default:
        return 'Operation completed successfully';
    }
  }
}
