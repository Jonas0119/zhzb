import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// Serverless handler for Vercel - Express 4.x compatible
let cachedServer: any;

export default async function handler(req: any, res: any) {
  try {
    console.log('Request received:', req.method, req.url);

    // Check required environment variables
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      res.status(500).json({ error: 'Database configuration error' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      res.status(500).json({ error: 'JWT configuration error' });
      return;
    }

    if (!cachedServer) {
      console.log('Initializing Express server for Vercel...');

      // Create NestJS app with default Express instance
      const app = await NestFactory.create(AppModule);

      // Configure NestJS
      app.setGlobalPrefix('api');
      app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      }));
      app.useGlobalInterceptors(new LoggingInterceptor());

      // Enable CORS for production
      app.enableCors({
        origin: process.env.CORS_ORIGIN || 'https://zhzb.vercel.app',
        credentials: true,
      });

      await app.init();

      // Get the underlying Express instance
      const server = app.getHttpAdapter().getInstance();

      cachedServer = server;
      console.log('Express server initialized successfully for Vercel');
    }

    // Handle request with Express server
    cachedServer(req, res);
  } catch (error) {
    console.error('Vercel handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Local development bootstrap
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }));
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Enable CORS for development
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}

// Run locally if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  bootstrap();
}
