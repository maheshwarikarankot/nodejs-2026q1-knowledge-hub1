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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );
  await app.init();
  await app.listen(process.env.PORT || 4000);
});

afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});
