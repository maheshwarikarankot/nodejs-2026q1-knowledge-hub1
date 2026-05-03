import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { LoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const logger = new LoggerService();

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // ── Global Validation Pipe ──
  // Validates all request bodies using DTO class-validator decorators
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties
      forbidNonWhitelisted: false,
      transform: true, // auto-transform types
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Knowledge Hub API')
    .setDescription('REST API for the Knowledge Hub platform')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  const PORT = process.env.PORT ?? 4000;

  // Set up graceful shutdown handlers
  setupProcessErrorHandlers(app, logger);

  await app.listen(PORT);
  logger.log(`Application is running on: http://localhost:${PORT}`);
}

function setupProcessErrorHandlers(app: any, logger: LoggerService) {
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error: Error) => {
    logger.error(`Uncaught Exception: ${error.message}`, error.stack, {
      type: 'uncaughtException',
      name: error.name,
    });

    await gracefulShutdown(app, logger, 'uncaughtException', error);
  });

  // Handle unhandled promise rejections
  process.on(
    'unhandledRejection',
    async (reason: any, promise: Promise<any>) => {
      logger.error(
        `Unhandled Rejection at Promise: ${promise}`,
        reason?.stack,
        {
          type: 'unhandledRejection',
          reason: reason?.toString(),
        },
      );

      await gracefulShutdown(app, logger, 'unhandledRejection', reason);
    },
  );

  // Handle graceful shutdown signals
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, starting graceful shutdown');
    await gracefulShutdown(app, logger, 'SIGTERM');
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received, starting graceful shutdown');
    await gracefulShutdown(app, logger, 'SIGINT');
  });
}

async function gracefulShutdown(
  app: any,
  logger: LoggerService,
  signal: string,
  error?: any,
) {
  logger.log(`Starting graceful shutdown due to: ${signal}`);

  try {
    // Close the HTTP server
    if (app && typeof app.close === 'function') {
      logger.log('Closing HTTP server...');
      await app.close();
      logger.log('HTTP server closed successfully');
    }

    // Close database connections
    logger.log('Closing database connections...');
    try {
      const prismaService = app.get('PrismaService', { strict: false });
      if (prismaService && typeof prismaService.$disconnect === 'function') {
        await prismaService.$disconnect();
        logger.log('Database connections closed');
      } else {
        logger.log('Database connections closed automatically');
      }
    } catch (dbError) {
      logger.error(
        'Error closing database connections:',
        dbError?.toString() || 'Unknown error',
      );
      logger.log('Database connections closed');
    }

    logger.log('Graceful shutdown completed successfully');

    // Exit with appropriate code
    process.exit(error ? 1 : 0);
  } catch (shutdownError) {
    logger.error(
      `Error during graceful shutdown: ${shutdownError}`,
      (shutdownError as Error)?.stack,
    );
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  const logger = new LoggerService();
  logger.error(`Error starting application: ${error.message}`, error.stack);
  process.exit(1);
});
