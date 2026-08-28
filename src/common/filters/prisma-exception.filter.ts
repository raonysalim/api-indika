import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import { Response } from 'express';
import { Prisma } from '../../../generated/prisma/client';

interface PrismaErrorMeta {
  fields?: string[];
  index?: string;
  modelName?: string;
  driverAdapterError?: {
    cause?: {
      constraint?: {
        fields?: string[];
        index?: string;
      };
    };
  };
}

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        const meta = exception.meta as PrismaErrorMeta | undefined;
        const field =
          meta?.fields?.[0] ?? this.extractFieldFromDriverError(exception);

        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: field
            ? `The ${field} field is already in use`
            : 'Duplicate record',
          error: 'Conflict',
        });
        break;
      }

      case 'P2025': {
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'Not Found',
        });
        break;
      }

      case 'P2003': {
        const meta = exception.meta as PrismaErrorMeta | undefined;
        const field =
          meta?.index ?? this.extractIndexFromDriverError(exception);

        response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Foreign key constraint failed on the field: ${field}`,
          error: 'Bad Request',
        });
        break;
      }

      default:
        super.catch(exception, host);
        break;
    }
  }

  private extractFieldFromDriverError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string | undefined {
    const meta = exception.meta as PrismaErrorMeta | undefined;
    const driverError = meta?.driverAdapterError;
    const cause = driverError?.cause;
    const constraint = cause?.constraint;
    return constraint?.fields?.[0];
  }

  private extractIndexFromDriverError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string | undefined {
    const meta = exception.meta as PrismaErrorMeta | undefined;
    const driverError = meta?.driverAdapterError;
    const cause = driverError?.cause;
    const constraint = cause?.constraint;
    return constraint?.index;
  }

  /**
   * Extrai o nome do modelo (tabela) envolvido no erro.
   */
  private extractModelName(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string | undefined {
    const meta = exception.meta as PrismaErrorMeta | undefined;
    return meta?.modelName;
  }
}
