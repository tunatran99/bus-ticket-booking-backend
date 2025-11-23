import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'SYS_001';
    let details = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errorCode = (exceptionResponse as any).code || this.getErrorCode(status);
        details = (exceptionResponse as any).details || {};
      } else {
        message = exceptionResponse as string;
        errorCode = this.getErrorCode(status);
      }
    }

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message: Array.isArray(message) ? message.join(', ') : message,
        details,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return 'AUTH_001';
      case HttpStatus.FORBIDDEN:
        return 'AUTH_003';
      case HttpStatus.NOT_FOUND:
        return 'USER_001';
      case HttpStatus.CONFLICT:
        return 'USER_002';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VAL_001';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SYS_002';
      default:
        return 'SYS_001';
    }
  }
}
