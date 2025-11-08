# Notification System

A microservices-based notification system built with TypeScript and Node.js.

## Architecture

This system consists of the following services:

- **API Gateway**: Routes requests to appropriate services
- **User Service**: Manages user data and preferences
- **Email Service**: Handles email notifications
- **Push Notification Service**: Manages push notifications
- **Template Service**: Manages notification templates

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

### Development

To start the development environment:

```bash
npm run dev
```

This will start all services using Docker Compose in development mode.

### Production

To start the production environment:

```bash
npm run prod
```

## Services

### API Gateway

- Port: 3000
- Routes requests to appropriate microservices

### User Service

- Port: 3001
- Manages user profiles and notification preferences

### Email Service

- Port: 3002
- Handles email delivery and templates

### Push Notification Service

- Port: 3003
- Manages push notifications to mobile/web clients

### Template Service

- Port: 3004
- Manages notification templates and content

## Testing

Run all tests:

```bash
npm test
```

Run tests for a specific service:

```bash
npm run test:services
npm run test:shared
```

## Linting

Run linting for all services:

```bash
npm run lint
```

## Documentation

- [Architecture Documentation](docs/architecture.md)
- [API Documentation](docs/api-documentation.md)
- [Setup Guide](docs/setup-guide.md)
- [Deployment Guide](docs/deployment.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

ISC