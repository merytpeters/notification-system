import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

const { logEvents } = require('./logEvents');

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const errorName =
      exception instanceof Error ? exception.constructor.name : 'Error';

    // Log the error
    logEvents(`${errorName}: ${message}`, 'errLog.txt');

    // Send response
    response.status(status).json({
      status: false,
      data: null,
      message: message,
    });
  }
}