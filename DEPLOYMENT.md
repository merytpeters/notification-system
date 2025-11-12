# Notification System Deployment Guide

This guide covers deploying the notification system using Docker and Railway.

## Prerequisites

- [Docker](https://www.docker.com/) installed on your machine
- [Railway CLI](https://docs.railway.app/deploy/cli) installed
- Railway account with billing enabled

## Quick Start

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Deploy All Services
```bash
# Deploy API Gateway
cd services/packages/api-gateway
railway deploy

# Deploy Email Service  
cd services/packages/email-service
railway deploy

# Deploy User Service
cd services/packages/user-service
railway deploy

# Deploy Template Service
cd template-service
railway deploy
```

## Service Configuration

### API Gateway (Port 3000)
- **Environment Variables**:
  - `NODE_ENV=production`
  - `PORT=3000`
  - `RABBITMQ_URI=amqp://rabbitmq:5672`
  - `REDIS_URL=redis://redis:6379`
  - `JWT_SECRET=your-jwt-secret-key`

### Email Service (Port 3002)
- **Environment Variables**:
  - `NODE_ENV=production`
  - `PORT=3002`
  - `RABBITMQ_URI=amqp://rabbitmq:5672`
  - `REDIS_URL=redis://redis:6379`
  - `SENDGRID_API_KEY=your-sendgrid-api-key`
  - `SENDER_EMAIL=noreply@yourdomain.com`

### User Service (Port 3001)
- **Environment Variables**:
  - `NODE_ENV=production`
  - `PORT=3001`
  - `DATABASE_URL=postgresql://postgres:password@user-db:5432/notification_system`
  - `JWT_SECRET=your-jwt-secret-key`

### Template Service (Port 8000)
- **Environment Variables**:
  - `NODE_ENV=production`
  - `PORT=8000`
  - `DATABASE_URL=postgresql://postgres:password@template-db:5432/template_service`
  - `REDIS_URL=redis://redis:6379`

## Local Development with Docker Compose

### Start All Services
```bash
docker-compose up -d
```

### Access Services
- **API Gateway**: http://localhost:3000
- **Email Service**: http://localhost:3002
- **User Service**: http://localhost:3001
- **Template Service**: http://localhost:8000
- **API Documentation**: http://localhost:3000/api/docs
- **RabbitMQ Management**: http://localhost:15672
- **Redis**: redis://localhost:6379

### Health Checks
- API Gateway: `curl http://localhost:3000/api/v1/health`
- Email Service: `curl http://localhost:3002/api/v1/health`
- User Service: `curl http://localhost:3001/health`
- Template Service: `curl http://localhost:8000/health`

## Railway Deployment

### Individual Service Deployment

Each service can be deployed independently:

#### API Gateway
```bash
cd services/packages/api-gateway
railway deploy
```

#### Email Service
```bash
cd services/packages/email-service
railway deploy
```

#### User Service
```bash
cd services/packages/user-service
railway deploy
```

#### Template Service
```bash
cd template-service
railway deploy
```

### Environment Variables in Railway

Set these in your Railway project settings:

#### For API Gateway
```
NODE_ENV=production
PORT=3000
RABBITMQ_URI=amqp://your-railway-rabbitmq-url.railway.app
REDIS_URL=redis://your-railway-redis-url.railway.app
JWT_SECRET=your-secure-jwt-secret
```

#### For Email Service
```
NODE_ENV=production
PORT=3002
RABBITMQ_URI=amqp://your-railway-rabbitmq-url.railway.app
REDIS_URL=redis://your-railway-redis-url.railway.app
SENDGRID_API_KEY=your-sendgrid-api-key
SENDER_EMAIL=noreply@yourdomain.com
```

#### For User Service
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:password@your-railway-db-url.railway.app:5432/notification_system
JWT_SECRET=your-secure-jwt-secret
```

#### For Template Service
```
NODE_ENV=production
PORT=8000
DATABASE_URL=postgresql://postgres:password@your-railway-db-url.railway.app:5432/template_service
REDIS_URL=redis://your-railway-redis-url.railway.app
```

## Railway Service URLs

After deployment, Railway will provide URLs like:
- `https://your-app-name.up.railway.app` (API Gateway)
- `https://your-email-service.up.railway.app` (Email Service)
- `https://your-user-service.up.railway.app` (User Service)
- `https://your-template-service.up.railway.app` (Template Service)

## Monitoring and Logs

### View Logs
```bash
railway logs
```

### View Service Status
```bash
railway status
```

### Open Service Dashboard
```bash
railway open
```

## Production Considerations

### Security
- Use Railway's built-in secrets management for sensitive data
- Enable Railway's automatic HTTPS certificates
- Configure proper CORS origins in production

### Scaling
- Railway automatically scales based on traffic
- Monitor resource usage in Railway dashboard
- Set appropriate restart policies in `railway.toml`

### Database Management
- Use Railway's managed PostgreSQL for production
- Configure connection pooling in your applications
- Set up database backups through Railway

### Performance
- Monitor response times through Railway metrics
- Use Railway's built-in CDN for static assets
- Configure appropriate resource limits

## Troubleshooting

### Common Issues

#### Service Won't Start
1. Check environment variables are set correctly
2. Verify database connections
3. Check Railway logs: `railway logs <service-name>`
4. Ensure health checks are passing

#### Connection Issues
1. Verify Railway service URLs are correct
2. Check network connectivity between services
3. Validate RabbitMQ and Redis configurations
4. Review Railway deployment logs

#### Build Failures
1. Check Dockerfile syntax
2. Verify all dependencies are in package.json
3. Run local build first: `docker build .`
4. Review build logs in Railway

## Advanced Configuration

### Custom Domains
```bash
# Add custom domain to your service
railway domain add your-service.yourdomain.com
```

### Environment-Specific Configs
```bash
# Set different configs for staging
railway variables set NODE_ENV=staging

# Production deployment
railway variables set NODE_ENV=production
```

### Multi-Service Deployment
For deploying all services together:
```bash
# Deploy with specific configuration
railway deploy --env production
```

## Support

- [Railway Documentation](https://docs.railway.app/)
- [Railway Community](https://discord.gg/railway)
- [GitHub Issues](https://github.com/railwayapp/issues)

## API Endpoints Summary

### API Gateway (Port 3000)
- `POST /api/v1/notifications/send` - Send push notifications
- `GET /api/v1/notifications/status?idempotency_key=xxx` - Get notification status
- `POST /api/v1/notifications/email` - Send email notifications
- `GET /api/v1/notifications/:id/status` - Get notification status by ID
- `POST /api/v1/auth/login` - User authentication
- `GET /api/v1/health` - Health check

### Email Service (Port 3002)
- `POST /api/v1/webhook/sendgrid` - SendGrid webhook handler
- `POST /api/v1/webhook/sendgrid/test` - SendGrid webhook test
- `POST /api/v1/webhook/send-email` - Test email sending
- `GET /api/v1/health` - Health check
- `GET /api/v1/health/ready` - Readiness check
- `GET /api/v1/health/live` - Liveness check
- `GET /api/v1/health/circuit-breaker` - Circuit breaker status
- API Documentation: `/api/docs`

### User Service (Port 3001)
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/users/create-account` - Create user account
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/:id` - Get user by ID
- `GET /api/v1/users/email/:email` - Get user by email
- `GET /api/v1/users/:id/preferences` - Get user preferences
- `PUT /api/v1/users/:id/preferences` - Update user preferences
- `GET /api/v1/health` - Health check

### Template Service (Port 8000)
- `GET /api/v1/templates` - List templates
- `POST /api/v1/templates` - Create template
- `GET /api/v1/templates/:id` - Get template by ID
- `PUT /api/v1/templates/:id` - Update template
- `DELETE /api/v1/templates/:id` - Delete template
- `GET /api/v1/health` - Health check

## Request-Server Command

For requesting deployment servers or additional resources:

```bash
# Request a new deployment server
/request-server api-gateway-high-memory

# Request database upgrade
/request-server postgres-upgrade

# Request additional Redis instance
/request-server redis-cache
```

This will create a ticket in the deployment system and notify you when resources are available.