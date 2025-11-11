# Setup Guide

This guide will help you set up the complete notification system development environment.

## Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher) - for Template Service
- **Docker** and **Docker Compose**
- **PostgreSQL** (v14 or higher)
- **Redis** (v6 or higher)
- **RabbitMQ** (v3.9 or higher)
- **Git**

### Development Tools
- **npm** or **yarn** (v8 or higher)
- **VS Code** or preferred IDE
- **Postman** or similar API testing tool

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd notification-system
```

### 2. Install Dependencies

#### Install Node.js Dependencies
```bash
# Install all service dependencies
npm run install:all

# Or install individually
cd services/packages/api-gateway && npm install
cd ../user-service && npm install
cd ../../template-service && pip install -r requirements.txt
```

#### Install Shared Dependencies
```bash
cd shared
npm install
```

### 3. Environment Configuration

#### API Gateway Environment
Create `services/packages/api-gateway/.env`:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/notification_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ Configuration
RABBITMQ_URL=amqp://username:password@localhost:5672
RABBITMQ_QUEUES_EMAIL=email_notifications
RABBITMQ_QUEUES_PUSH=push_notifications
RABBITMQ_QUEUES_STATUS=notification_status

# External Services
SENDGRID_API_KEY=your-sendgrid-api-key
FCM_SERVER_KEY=your-fcm-server-key

# User Service Configuration
SERVICES_USER=http://localhost:3001
```

#### User Service Environment
Create `services/packages/user-service/.env`:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/notification_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### Template Service Environment
Create `template-service/.env`:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/notification_db

# Server Configuration
HOST=0.0.0.0
PORT=3004
```

## Database Setup

### 1. PostgreSQL Setup

#### Using Docker (Recommended)
```bash
docker run --name postgres-notification \
  -e POSTGRES_DB=notification_db \
  -e POSTGRES_USER=username \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:14
```

#### Manual Installation
```bash
# Create database
createdb notification_db

# Create user (optional)
createuser username
psql -c "ALTER USER username PASSWORD 'password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE notification_db TO username;"
```

### 2. Redis Setup

#### Using Docker (Recommended)
```bash
docker run --name redis-notification \
  -p 6379:6379 \
  -d redis:6-alpine
```

#### Manual Installation
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start Redis
redis-server
```

### 3. RabbitMQ Setup

#### Using Docker (Recommended)
```bash
docker run --name rabbitmq-notification \
  -e RABBITMQ_DEFAULT_USER=username \
  -e RABBITMQ_DEFAULT_PASS=password \
  -p 5672:5672 \
  -p 15672:15672 \
  -d rabbitmq:3.9-management
```

#### Manual Installation
```bash
# Ubuntu/Debian
sudo apt-get install rabbitmq-server

# macOS
brew install rabbitmq

# Start RabbitMQ
rabbitmq-server

# Enable Management Plugin
rabbitmq-plugins enable rabbitmq_management
```

## Database Migrations

### User Service Database Setup
```bash
cd services/packages/user-service

# Generate Prisma Client
npx prisma generate

# Run Database Migrations
npx prisma migrate dev

# Seed Database (optional)
npx prisma db seed
```

### Template Service Database Setup
```bash
cd template-service

# Create tables using SQLModel
python -c "from app.db import engine; from sqlmodel import SQLModel; from app.models import *; SQLModel.metadata.create_all(engine)"
```

## Development Setup

### 1. Using Docker Compose (Recommended)

Create `docker-compose.dev.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: notification_db
      POSTGRES_USER: username
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  rabbitmq:
    image: rabbitmq:3.9-management
    environment:
      RABBITMQ_DEFAULT_USER: username
      RABBITMQ_DEFAULT_PASS: password
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

Start Infrastructure:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Start Development Services

#### Option 1: Using NPM Scripts
```bash
# Start all services
npm run dev

# Start specific services
npm run dev:api-gateway
npm run dev:user-service
npm run dev:template-service
```

#### Option 2: Manual Start
```bash
# Terminal 1 - API Gateway
cd services/packages/api-gateway
npm run start:dev

# Terminal 2 - User Service
cd services/packages/user-service
npm run start:dev

# Terminal 3 - Template Service
cd template-service
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 3004
```

## External Service Configuration

### SendGrid Setup
1. Create SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Generate API Key
3. Add API key to environment variables:
   ```env
   SENDGRID_API_KEY=SG.your-api-key-here
   ```

### Firebase Cloud Messaging Setup
1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Cloud Messaging
3. Generate Server Key
4. Add server key to environment variables:
   ```env
   FCM_SERVER_KEY=your-fcm-server-key-here
   ```

## Testing Setup

### 1. Run Tests
```bash
# Run all tests
npm test

# Run specific service tests
npm run test:api-gateway
npm run test:user-service
npm run test:template-service

# Run with coverage
npm run test:coverage
```

### 2. API Testing

#### Health Checks
```bash
# API Gateway Health
curl http://localhost:3000/gateway-health

# User Service Health
curl http://localhost:3001/health

# Template Service Health
curl http://localhost:3004/health
```

#### Authentication Test
```bash
# Register User
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'

# Login User
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Notification Test
```bash
# Send Email Notification
curl -X POST http://localhost:3000/notifications/email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "recipient@example.com",
    "subject": "Test Notification",
    "body": "This is a test email notification"
  }'
```

## Development Tools

### 1. API Documentation
- **API Gateway**: http://localhost:3000/docs
- **User Service**: http://localhost:3001/docs
- **Template Service**: http://localhost:3004/docs

### 2. Database Management
- **RabbitMQ Management**: http://localhost:15672 (username/password)
- **PostgreSQL**: Use your preferred DB client (pgAdmin, DBeaver, etc.)
- **Redis**: Use Redis CLI or GUI tools

### 3. Monitoring
```bash
# Check RabbitMQ Queues
curl -u username:password http://localhost:15672/api/queues

# Check Redis Keys
redis-cli KEYS "*"

# Check PostgreSQL Connections
psql -h localhost -U username -d notification_db -c "SELECT * FROM pg_stat_activity;"
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts
```bash
# Check what's using ports
lsof -i :3000
lsof -i :5432
lsof -i :6379
lsof -i :5672

# Kill processes if needed
kill -9 <PID>
```

#### 2. Database Connection Issues
```bash
# Test PostgreSQL connection
psql -h localhost -U username -d notification_db

# Check if PostgreSQL is running
docker ps | grep postgres
```

#### 3. Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping

# Check if Redis is running
docker ps | grep redis
```

#### 4. RabbitMQ Connection Issues
```bash
# Test RabbitMQ connection
curl -u username:password http://localhost:15672/api/overview

# Check RabbitMQ logs
docker logs rabbitmq-notification
```

#### 5. JWT Token Issues
- Ensure JWT_SECRET is the same across all services
- Check token expiration in JWT_EXPIRES_IN
- Verify token format in Authorization header

### Log Locations
```bash
# API Gateway Logs
cd services/packages/api-gateway && npm run start:dev

# User Service Logs
cd services/packages/user-service && npm run start:dev

# Template Service Logs
cd template-service && python -m uvicorn app.main:app --reload

# Docker Logs
docker logs postgres-notification
docker logs redis-notification
docker logs rabbitmq-notification
```

## Production Deployment

### Environment Variables
For production, ensure you update:
- JWT_SECRET with a strong, random key
- Database credentials with secure passwords
- API keys for external services
- HTTPS URLs for external services
- Proper CORS origins

### Security Considerations
- Use HTTPS in production
- Enable rate limiting
- Implement proper logging
- Use environment-specific configurations
- Regularly update dependencies

### Performance Optimization
- Enable Redis persistence
- Configure RabbitMQ clustering
- Use PostgreSQL connection pooling
- Implement caching strategies
- Monitor resource usage

## Next Steps

After completing setup:

1. **Verify Services**: Check all health endpoints
2. **Run Tests**: Ensure all tests pass
3. **Explore APIs**: Use Swagger documentation
4. **Test Notifications**: Send test notifications
5. **Monitor Queues**: Check RabbitMQ management interface
6. **Review Logs**: Ensure proper logging

For more detailed information, refer to:
- [Architecture Documentation](./architecture.md)
- [API Documentation](./api-documentation.md)
- [Deployment Guide](./deployment.md)