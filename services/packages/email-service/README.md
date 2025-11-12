# Email Service

A robust email service built with NestJS that handles email notifications through SendGrid with circuit breaker pattern, retry logic, and delivery confirmations.

## Features

- **SendGrid Integration**: Uses SendGrid API for reliable email delivery
- **Circuit Breaker Pattern**: Prevents system failure when SendGrid is unavailable
- **Retry System**: Implements exponential backoff for failed messages
- **Dead Letter Queue**: Moves permanently failed messages to DLQ
- **Idempotency**: Prevents duplicate email processing
- **Health Checks**: Provides health monitoring endpoints
- **Delivery Confirmations**: Handles SendGrid webhook events
- **Template Service Integration**: Fetches email templates from template service
- **RabbitMQ Integration**: Consumes messages from notification queue

## Architecture

### Message Flow

1. API Gateway publishes email notification to RabbitMQ exchange
2. Email Service consumes message from `email.queue`
3. Service fetches template from Template Service
4. Renders template with variables
5. Sends email via SendGrid
6. Handles delivery confirmations via webhook
7. Updates status in RabbitMQ

### Queue Configuration

- **Exchange**: `notifications.direct` (direct exchange)
- **Email Queue**: `email.queue`
- **Failed Queue**: `failed.queue` (dead letter queue)
- **Status Queue**: `status.queue`

## Environment Variables

```bash
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDER_EMAIL=noreply@yourdomain.com

# RabbitMQ Configuration
RABBITMQ_URL=amqp://user:password@localhost:5672

# Template Service Configuration
TEMPLATE_SERVICE_URL=http://template-service:3003

# Service Configuration
PORT=3000
```

## API Endpoints

### Health Checks

- `GET /api/v1/health` - Overall service health
- `GET /api/v1/health/ready` - Readiness probe (Kubernetes)
- `GET /api/v1/health/live` - Liveness probe (Kubernetes)
- `GET /api/v1/health/circuit-breaker` - Circuit breaker state

### Webhooks

- `POST /api/v1/webhook/sendgrid` - SendGrid delivery confirmations
- `POST /api/v1/webhook/sendgrid/test` - SendGrid webhook validation

## Message Format

### Input Message (from API Gateway)

```json
{
  "notification_id": "uuid",
  "type": "email",
  "data": {
    "to": "recipient@example.com",
    "templateId": "welcome-email",
    "variables": {
      "name": "John Doe",
      "link": "https://example.com/verify"
    },
    "request_id": "uuid",
    "user_id": "uuid",
    "priority": 1,
    "metadata": {
      "source": "api-gateway"
    }
  },
  "user_id": "uuid",
  "timestamp": "2025-11-12T10:00:00Z",
  "retry_count": 0
}
```

### Status Update (to RabbitMQ)

```json
{
  "notification_id": "uuid",
  "status": "delivered|pending|failed|bounced",
  "timestamp": "2025-11-12T10:00:00Z",
  "error": "Error message (if failed)",
  "provider_response": {
    "event": "delivered",
    "sg_message_id": "sendgrid-id"
  }
}
```

## Circuit Breaker

The email service implements a circuit breaker pattern to handle SendGrid outages:

- **CLOSED**: Normal operation, all requests pass through
- **OPEN**: Circuit is open, requests fail immediately
- **HALF_OPEN**: Testing if service has recovered

Configuration:
- Max failures: 5
- Timeout: 60 seconds
- Success threshold in HALF_OPEN: 3

## Retry Logic

Failed messages are retried with exponential backoff:
- Base delay: 2 seconds
- Max delay: 30 seconds
- Max retries: 4
- Jitter: Random delay to prevent thundering herd

## Idempotency

The service prevents duplicate processing using:
- Unique `request_id` in messages
- In-memory cache of processed requests
- 24-hour TTL for cache entries

## Monitoring

### Health Check Response

```json
{
  "status": "healthy|unhealthy",
  "timestamp": "2025-11-12T10:00:00Z",
  "service": "email-service",
  "version": "1.0.0",
  "checks": {
    "sendgrid": {
      "status": "healthy|unhealthy",
      "message": "SendGrid API key configured"
    },
    "rabbitmq": {
      "status": "healthy|unhealthy",
      "message": "Connected to RabbitMQ"
    },
    "circuitBreaker": {
      "status": "healthy|unhealthy",
      "state": "CLOSED|OPEN|HALF_OPEN",
      "failureCount": 0
    }
  }
}
```

## Development

### Installation

```bash
npm install
```

### Running

```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

### Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Docker

Build Docker image:

```bash
docker build -t email-service .
```

Run with Docker:

```bash
docker run -p 3000:3000 \
  -e SENDGRID_API_KEY=your_key \
  -e RABBITMQ_URL=amqp://localhost:5672 \
  email-service
```

## Production Considerations

1. **Security**: Use environment variables for all secrets
2. **Monitoring**: Set up proper logging and monitoring
3. **Scaling**: Consider multiple instances for high throughput
4. **Rate Limiting**: Implement rate limiting for SendGrid API
5. **Template Caching**: Consider Redis for template caching in production
6. **Webhook Security**: Validate SendGrid webhook signatures
7. **Resource Limits**: Configure appropriate memory/CPU limits

## Troubleshooting

### Common Issues

1. **SendGrid API Key Error**: Verify SENDGRID_API_KEY is set correctly
2. **RabbitMQ Connection**: Check RABBITMQ_URL and network connectivity
3. **Template Service**: Ensure TEMPLATE_SERVICE_URL is accessible
4. **Circuit Breaker Open**: Check SendGrid service status
5. **High Memory Usage**: Monitor template cache size

### Logs

The service provides detailed logging at different levels:
- `ERROR`: Critical failures
- `WARN`: Retry attempts and circuit breaker changes
- `LOG`: Normal operations and status updates
- `DEBUG`: Detailed execution flow

## License

This project is licensed under the MIT License.
