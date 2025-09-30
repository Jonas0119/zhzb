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

      // Create Express app directly (Express 4.x compatible)
      const server = express();

      // Body parsing middleware (Express 4.x style)
      server.use(express.json({ limit: '10mb' }));
      server.use(express.urlencoded({ extended: true, limit: '10mb' }));

      // CORS middleware (Express 4.x compatible)
      server.use((req: any, res: any, next: any) => {
        const origin = process.env.CORS_ORIGIN || 'https://zhzb.vercel.app';
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');

        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
        } else {
          next();
        }
      });

      // Create NestJS app with Express instance
      const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

      // Configure NestJS
      app.setGlobalPrefix('api');
      app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      }));
      app.useGlobalInterceptors(new LoggingInterceptor());

      await app.init();

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
