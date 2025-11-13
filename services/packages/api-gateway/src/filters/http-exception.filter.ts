import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';

        if (exception instanceof HttpException) {
            const exceptionStatus = exception.getStatus();
            status = typeof exceptionStatus === 'number' && exceptionStatus >= 100 && exceptionStatus <= 599
                ? exceptionStatus
                : HttpStatus.INTERNAL_SERVER_ERROR;
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const responseObj = exceptionResponse as any;
                message = responseObj.message || responseObj.error || message;

                // Handle validation errors
                if (responseObj.message && Array.isArray(responseObj.message)) {
                    message = responseObj.message.join(', ');
                }
            }
        } else if (exception instanceof Error) {
            // Handle JSON parsing errors
            if (exception.message.includes('Unexpected token') || exception.message.includes('JSON')) {
                status = HttpStatus.BAD_REQUEST;
                message = 'Invalid JSON format in request body';
            } else {
                message = exception.message;
            }

            this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
        }

        // Final validation of status code
        if (typeof status !== 'number' || status < 100 || status > 599) {
            this.logger.warn(`Invalid status code detected: ${status}, defaulting to 500`);
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: message,
        };

        this.logger.error(
            `${request.method} ${request.url} - ${status} - ${message}`,
        );

        response.status(status).json(errorResponse);
    }
}