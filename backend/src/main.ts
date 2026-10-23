import 'dotenv/config';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // app.use(cookieParser());
  // app.set('trust proxy', true);
  // app.setGlobalPrefix('api/v1');
  // app.useGlobalInterceptors(app.get(AuditInterceptor));
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     transform: true,
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //   }),
  // );

  // const exceptionFilter = app.get(AllExceptionsFilter);
  // app.useGlobalFilters(exceptionFilter);

  // app.enableCors({
  //   origin: [
  //     process.env.FRONTEND_URL || 'http://localhost:5173',
  //     process.env.BACKEND_URL || 'http://localhost:3000',
  //     /https:\/\/.*\.vercel\.app$/,
  //   ],
  //   credentials: true,
  //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  //   allowedHeaders: ['Content-Type', 'Authorization'],
  // });
  setupApp(app);
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
