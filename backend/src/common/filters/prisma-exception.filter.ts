import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    switch (exception.code) {
      case 'P2002': // Unique constraint violation
        status = HttpStatus.CONFLICT;
        message = `Duplicate entry: ${(exception.meta?.target as string[])?.join(', ') || 'unique constraint violated'}`;
        break;
      case 'P2025': // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      case 'P2003': // Foreign key constraint
        status = HttpStatus.BAD_REQUEST;
        message = 'Related record not found';
        break;
      case 'P2014': // Required relation violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Required relation violation';
        break;
      default:
        console.error(`[Prisma Error ${exception.code}]`, exception.message);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error: exception.code,
    });
  }
}
