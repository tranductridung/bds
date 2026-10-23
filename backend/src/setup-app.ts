import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { AuditInterceptor } from './log/audit-log/interceptors/audit-log.interceptor';
import { AllExceptionsFilter } from './common/filters/app-exception.filter';
import { RequestContextInterceptor } from './common/interceptors/request-context.interceptor';

export function setupApp(app: NestExpressApplication) {
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.set('trust proxy', true);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(
    app.get(AuditInterceptor),
    new RequestContextInterceptor(),
  );
  app.useGlobalFilters(app.get(AllExceptionsFilter));

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

  const hops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
  if (!Number.isInteger(hops) || hops < 0) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
  }
  if (hops > 0) {
    app.set('trust proxy', hops);
  }
}
