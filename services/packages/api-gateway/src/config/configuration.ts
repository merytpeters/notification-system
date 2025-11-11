export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  
  redis: {
    url: process.env.REDIS_URL,
  },
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    queues: {
      email: process.env.RABBITMQ_EMAIL_QUEUE || 'email_notifications',
      push: process.env.RABBITMQ_PUSH_QUEUE || 'push_notifications',
      status: process.env.RABBITMQ_STATUS_QUEUE || 'notification_status',
    },
  },
  
  services: {
    user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    notification: process.env.PUSH_NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
    email: process.env.EMAIL_SERVICE_URL || 'http://localhost:3002',
    template: process.env.TEMPLATE_SERVICE_URL || 'http://localhost:3004',
  },
  
  api: {
    prefix: process.env.API_GATEWAY_PATH || '/api/v1',
  },
  
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  
  logLevel: process.env.LOG_LEVEL || 'debug',
});