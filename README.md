# Notification System

A scalable microservices-based notification system built with TypeScript, Node.js, and Python, implementing JWT authentication, message queuing, and real-time notification delivery.

## 🏗️ Architecture Overview

This system consists of the following microservices:

- **API Gateway** (Port 3000) - Central entry point with JWT authentication and request routing
- **User Service** (Port 3001) - User management with PostgreSQL + Prisma ORM
- **Email Service** (Port 3002) - Email delivery with SendGrid integration
- **Push Notification Service** (Port 3003) - Push notifications with Firebase FCM
- **Template Service** (Port 3004) - Template management with Python FastAPI

### Key Features
- ✅ JWT-based authentication with global guard strategy
- ✅ Message queuing with RabbitMQ
- ✅ Caching and session management with Redis
- ✅ Type-safe database operations with Prisma ORM
- ✅ Comprehensive API documentation with Swagger
- ✅ Docker containerization for all services
- ✅ Real-time notification status tracking
- ✅ Bulk notification support
- ✅ User preference management

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.9 or higher)
- Docker and Docker Compose
- PostgreSQL (v14 or higher)
- Redis (v6 or higher)
- RabbitMQ (v3.9 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd notification-system
   ```

2. **Install dependencies**
   ```bash
   # Install all Node.js service dependencies
   npm run install:all
   
   # Install Python dependencies for template service
   cd template-service && pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment templates
   cp services/packages/api-gateway/.env.example services/packages/api-gateway/.env
   cp services/packages/user-service/.env.example services/packages/user-service/.env
   cp template-service/.env.example template-service/.env
   
   # Update with your actual configuration
   ```

4. **Start infrastructure services**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose -f docker-compose.dev.yml up -d
   ```

5. **Run database migrations**
   ```bash
   cd services/packages/user-service
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Start development servers**
   ```bash
   # Start all services
   npm run dev
   
   # Or start individually
   npm run dev:api-gateway
   npm run dev:user-service
   npm run dev:template-service
   ```

## 📚 Documentation

- **[Architecture Documentation](docs/architecture.md)** - Detailed system architecture and design
- **[Setup Guide](docs/setup-guide.md)** - Complete setup and configuration instructions
- **[API Documentation](docs/api-documentation.md)** - REST API endpoints and examples
- **[Deployment Guide](docs/deployment.md)** - Production deployment instructions
- **[Service Folder Structure](docs/service_folder_structure.md)** - Project structure overview

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start all services in development mode
npm run dev:api-gateway   # Start API Gateway only
npm run dev:user-service    # Start User Service only
npm run dev:template-service # Start Template Service only

# Testing
npm test                 # Run all tests
npm run test:api-gateway  # Run API Gateway tests
npm run test:user-service   # Run User Service tests
npm run test:coverage     # Run tests with coverage

# Code Quality
npm run lint             # Run linting for all services
npm run lint:fix         # Auto-fix linting issues
npm run format            # Format code with Prettier

# Database
npm run db:migrate       # Run database migrations
npm run db:generate      # Generate Prisma client
npm run db:seed          # Seed database with sample data
```

### Service Endpoints

#### API Gateway (http://localhost:3000)
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `GET /gateway-health` - Health check
- `POST /notifications/email` - Send email notification
- `POST /notifications/push` - Send push notification
- `POST /notifications/email/bulk` - Send bulk emails
- `POST /notifications/push/bulk` - Send bulk push notifications
- `GET /notifications/:id/status` - Get notification status
- `POST /notifications/status` - Update notification status (workers)

#### User Service (http://localhost:3001)
- `POST /auth/validate` - Credential validation
- `GET /users/:id` - Get user by ID
- `GET /users/email/:email` - Get user by email
- `GET /users/:id/preferences` - Get user preferences
- `POST /users/create-account` - Create new user

#### Template Service (http://localhost:3004)
- `GET /health` - Health check
- `GET /templates` - List all templates
- `POST /templates` - Create new template
- `GET /templates/:id` - Get template by ID
- `PUT /templates/:id` - Update template
- `DELETE /templates/:id` - Delete template

### API Documentation
Interactive API documentation is available:
- **API Gateway**: http://localhost:3000/docs
- **User Service**: http://localhost:3001/docs
- **Template Service**: http://localhost:3004/docs

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific service tests
npm run test:api-gateway
npm run test:user-service
npm run test:template-service

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Coverage
- Unit tests for all services
- Integration tests for API endpoints
- Authentication and authorization tests
- Database operation tests
- Message queue tests

## 🔧 Configuration

### Environment Variables

#### API Gateway
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
DATABASE_URL=postgresql://user:pass@localhost:5432/notification_db
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URL=amqp://user:pass@localhost:5672
SERVICES_USER=http://localhost:3001
SENDGRID_API_KEY=your-sendgrid-key
FCM_SERVER_KEY=your-fcm-key
```

#### User Service
```env
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/notification_db
JWT_SECRET=your-super-secret-jwt-key
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Template Service
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/notification_db
HOST=0.0.0.0
PORT=3004
```

## 🐳 Docker Support

### Development Environment
```bash
# Start all infrastructure services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production Environment
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📊 Monitoring & Observability

### Health Checks
- **API Gateway**: `GET /gateway-health`
- **User Service**: `GET /health`
- **Template Service**: `GET /health`

### Management Interfaces
- **RabbitMQ**: http://localhost:15672 (management UI)
- **Redis**: `redis-cli` or GUI tools
- **PostgreSQL**: Use your preferred DB client

### Logging
All services use structured logging with JSON format:
```bash
# View logs for all services
npm run logs

# View specific service logs
npm run logs:api-gateway
npm run logs:user-service
npm run logs:template-service
```

## 🔒 Security

### Authentication
- JWT-based authentication with Bearer tokens
- Global authentication guard with selective public access
- Secure password hashing with bcrypt
- Token expiration and refresh support

### Authorization
- Role-based access control
- User preference validation
- Rate limiting support
- CORS configuration

### Security Best Practices
- Environment variable configuration
- Input validation and sanitization
- SQL injection prevention with Prisma ORM
- HTTPS enforcement in production

##  Deployment

### Production Deployment
```bash
# Build for production
npm run build

# Deploy to production
npm run deploy:prod

# Deploy to staging
npm run deploy:staging
```

### Platform Support
- **Leapcell** - Primary deployment platform
- **Docker** - Container orchestration
- **Kubernetes** - Advanced orchestration (optional)

## 📈 Performance

### Optimization Features
- Redis caching for user data and notifications
- Database connection pooling
- Message queue batching
- Horizontal scaling support
- CDN integration for static assets

### Monitoring Metrics
- API response times
- Database query performance
- Queue processing rates
- Cache hit ratios
- Error rates and types

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests**
   ```bash
   npm run test:coverage
   ```
5. **Ensure code quality**
   ```bash
   npm run lint
   npm run format
   ```
6. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
7. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

### Code Style
- Use TypeScript for all Node.js services
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add comprehensive tests
- Update documentation




### Getting Help
- Check the [Setup Guide](docs/setup-guide.md) for installation issues
- Review the [Architecture Documentation](docs/architecture.md) for system understanding
- Search existing [Issues](../../issues) for common problems
- Create a new issue for bugs or feature requests

### Common Issues
- **Port conflicts**: Check if ports 3000-3004 are available
- **Database connection**: Verify PostgreSQL is running and accessible
- **Redis connection**: Ensure Redis service is started
- **RabbitMQ connection**: Check RabbitMQ service status
- **JWT errors**: Verify JWT_SECRET is consistent across services

## 🔮 Roadmap

### Upcoming Features
- [ ] WebSocket support for real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-tenant support
- [ ] A/B testing for notifications
- [ ] Internationalization support
- [ ] Status Worker Service implementation
- [ ] Advanced retry mechanisms
- [ ] Notification scheduling
