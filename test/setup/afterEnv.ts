import prisma from '../lib/prisma';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

let app: INestApplication;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = moduleRef.createNestApplication();
  // Mirror the global pipe configured in src/main.ts so DTO validation
  // runs in tests too.
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
  }));
  await app.init();
  // Bind to an ephemeral port (0 = OS picks one). This avoids EADDRINUSE
  // conflicts with a running dev server AND prevents supertest's lazy
  // auto-bind from racing when tests fire parallel requests via Promise.all
  // (which was causing ECONNRESET).
  await app.listen(0);
  (global as any).__APP__ = app;
  (global as any).__SERVER__ = app.getHttpServer();
});

afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});
