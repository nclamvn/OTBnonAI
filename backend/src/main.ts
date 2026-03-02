import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  // Support large payloads (planning/allocation data)
  const expressApp = app.getHttpAdapter().getInstance();
  const bodyParser = require('body-parser');
  expressApp.use(bodyParser.json({ limit: '10mb' }));
  expressApp.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // Security
  app.use(helmet());

  // CORS - allow localhost + production origins
  const allowedOrigins = [
    'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3006',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
  ];
  const isDev = process.env.NODE_ENV !== 'production';
  app.enableCors({
    origin: (origin, callback) => {
      // Only allow null-origin in development (curl/Postman for testing)
      if (!origin) return callback(null, isDev);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global exception filter for Prisma errors
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('DAFC OTB Planning API')
    .setDescription('Open-To-Buy Planning Management System for Luxury Fashion')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & Authorization')
    .addTag('master-data', 'Brands, Stores, Collections, Categories, SKU Catalog')
    .addTag('budgets', 'Budget Management')
    .addTag('planning', 'OTB Planning & Versions')
    .addTag('proposals', 'SKU Proposals')
    .addTag('approvals', 'Approval Workflow')
    .addTag('AI', 'AI-powered recommendations and analytics')
    .addTag('tickets', 'Ticket approval workflow')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`
  ┌──────────────────────────────────────────┐
  │   DAFC OTB Backend API                   │
  │   Running on: http://localhost:${port}       │
  │   Swagger:    http://localhost:${port}/api/docs │
  └──────────────────────────────────────────┘
  `);
}

bootstrap();
