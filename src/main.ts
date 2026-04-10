import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ── Global Validation Pipe ──
  // Validates all request bodies using DTO class-validator decorators
  app.useGlobalPipes(new ValidationPipe({
    whitelist            : true,  // strip unknown properties
    forbidNonWhitelisted : false,
    transform            : true,  // auto-transform types
  }));
  
  const config = new DocumentBuilder()
    .setTitle('Knowledge Hub API')
    .setDescription('REST API for the Knowledge Hub platform')
    .setVersion('1.0')
    .build();
 
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  const PORT = process.env.PORT ?? 4000;
  await app.listen(PORT);
  console.log(`Application is running on: http://localhost:${PORT}`);
}
bootstrap();
