import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export const SEED_ADMIN_LOGIN = 'TEST_SEED_ADMIN';
export const SEED_ADMIN_PASSWORD = 'TestSeedAdmin123!';

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const isConnectionRefused = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = (error as { code?: string }).code;
  if (code === 'ECONNREFUSED' || code === 'P1001') {
    return true;
  }

  const message = String((error as { message?: string }).message ?? '');
  return (
    message.includes('ECONNREFUSED') ||
    message.includes("Can't reach database server")
  );
};

const waitForDatabase = async (prisma: PrismaClient): Promise<void> => {
  const retries = 15;
  const delayMs = 700;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (error) {
      if (!isConnectionRefused(error) || attempt === retries) {
        const base =
          'Jest globalSetup could not connect to Postgres for admin seeding.';
        const details = String(
          (error as { code?: string; message?: string }).code ?? 'UNKNOWN',
        );
        throw new Error(
          `${base} Last error code: ${details}. ` +
            'Make sure Podman is running and the DB container is up (e.g. `podman machine start` and `podman-compose up -d db`).',
        );
      }

      await sleep(delayMs);
    }
  }
};

export default async function globalSetup(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set for Jest globalSetup.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  const hashedPassword = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);

  try {
    await waitForDatabase(prisma);

    const existing = await prisma.user.findFirst({
      where: { login: SEED_ADMIN_LOGIN },
      select: { id: true },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'ADMIN', password: hashedPassword },
      });
      return;
    }

    await prisma.user.create({
      data: {
        login: SEED_ADMIN_LOGIN,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
