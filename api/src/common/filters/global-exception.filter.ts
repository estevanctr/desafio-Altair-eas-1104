import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';

type ErrorBody = {
  error: {
    timestamp: string;
    code: number;
    message: unknown;
  };
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const { status, message } = this.resolve(exception);

    if (status >= 500) {
      this.logger.error(
        `Unhandled exception: ${this.stringify(message)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorBody = {
      error: { timestamp: new Date().toISOString(), code: status, message },
    };
    res.status(status).json(body);
  }

  private resolve(exception: unknown): { status: number; message: unknown } {
    if (exception instanceof ZodError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: exception.flatten().fieldErrors,
      };
    }
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message =
        typeof response === 'string' ? response : ((response as { message?: unknown }).message ?? response);
      return { status: exception.getStatus(), message };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }

  private stringify(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
}
