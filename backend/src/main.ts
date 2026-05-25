import 'dotenv/config';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './log/system-log/filters/app-exception.filter';
import { AuditInterceptor } from './log/audit-log/interceptors/audit-log.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());
  app.set('trust proxy', true);
  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(app.get(AuditInterceptor));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const exceptionFilter = app.get(AllExceptionsFilter);
  app.useGlobalFilters(exceptionFilter);

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      process.env.BACKEND_URL || 'http://localhost:3000',
      /https:\/\/.*\.vercel\.app$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ─── Swagger Configuration ───────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('🏠 FirstHome API')
    .setDescription(
      `
FirstHome is a real estate management API for property listings, leads, notifications, reminders, and user authorization.

This documentation covers:
- Authentication with JWT and refresh tokens
- Role-based access control and permissions
- Property management, image uploads, and feature assignments
- Lead capture, updates, and assignment workflows
- Notifications and reminder delivery
- User, and audit logging operations

Use the "Authorize" button to enter a bearer token and test protected endpoints.
    `,
    )
    .setVersion('1.0')
    .setContact(
      'Tran Duc Tri Dung',
      'https://github.com/tranductridung/firsthome',
      'tranductridung0103@gmail.com',
    )

    // ─── Servers ───────────────────────────────────────────────────────
    .addServer('http://localhost:3000', 'Local Development')

    // ─── Security Schemes ──────────────────────────────────────────────
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token. Get token at POST /authentication/login',
        in: 'header',
      },
      'access-token',
    )
    // ─── Tags ──────────────────────────────────────────────
    .addTag('Authentication', '🔐 Authentication and session')
    .addTag('Authorization', 'Roles and permissions management')
    .addTag('Features', 'Manage feature catalog')
    .addTag('Properties', '🏡 List, search and filter real estate')
    .addTag('Property Images', 'Upload and manage property images')
    .addTag('Property Agents', 'Assign agents to properties')
    .addTag('Property Features', 'Assign features to properties')
    .addTag('Ratings', 'Property ratings and reviews')
    .addTag('Leads', 'Lead capture and management')
    .addTag('Notifications', 'Push, email and in-app alerts')
    .addTag('Reminders', 'Reminder scheduling and delivery')
    .addTag('Users', '👤 Manage user profiles and permissions')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'FirstHome API Docs',
    swaggerOptions: {
      persistAuthorization: true, // Keep token when reload
      displayRequestDuration: true, // Display response time
      filter: true, // Open searching API
      docExpansion: 'none', // Collapse all as default
    },
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
