import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, ArticleStatus } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log('Starting database seed...');

  const saltRounds = parseInt(process.env.CRYPT_SALT ?? '10', 10);

  // Clear existing data
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create users with hashed passwords
  const admin = await prisma.user.create({
    data: {
      login: 'admin',
      password: await bcrypt.hash('admin123', saltRounds),
      role: Role.ADMIN,
    },
  });

  const editor = await prisma.user.create({
    data: {
      login: 'editor',
      password: await bcrypt.hash('editor123', saltRounds),
      role: Role.EDITOR,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      login: 'viewer',
      password: await bcrypt.hash('viewer123', saltRounds),
      role: Role.VIEWER,
    },
  });

  // Create categories
  const tech = await prisma.category.create({
    data: {
      name: 'Technology',
      description: 'Tech articles',
    },
  });

  const business = await prisma.category.create({
    data: {
      name: 'Business',
      description: 'Business articles',
    },
  });

  const lifestyle = await prisma.category.create({
    data: {
      name: 'Lifestyle',
      description: 'Lifestyle articles',
    },
  });

  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'JavaScript' } }),
    prisma.tag.create({ data: { name: 'TypeScript' } }),
    prisma.tag.create({ data: { name: 'Database' } }),
    prisma.tag.create({ data: { name: 'Docker' } }),
    prisma.tag.create({ data: { name: 'NestJS' } }),
  ]);

  // Create articles
  const articles = [
    {
      title: 'Getting Started with Docker',
      content: 'Docker is a containerization platform...',
      status: ArticleStatus.PUBLISHED,
      authorId: editor.id,
      categoryId: tech.id,
      tags: ['Docker', 'JavaScript'],
    },
    {
      title: 'TypeScript Best Practices',
      content: 'TypeScript is a powerful language...',
      status: ArticleStatus.PUBLISHED,
      authorId: editor.id,
      categoryId: tech.id,
      tags: ['TypeScript'],
    },
    {
      title: 'Database Design Patterns',
      content: 'Good database design is crucial...',
      status: ArticleStatus.PUBLISHED,
      authorId: admin.id,
      categoryId: tech.id,
      tags: ['Database'],
    },
    {
      title: 'NestJS Scalability',
      content: 'NestJS is a framework...',
      status: ArticleStatus.DRAFT,
      authorId: editor.id,
      categoryId: tech.id,
      tags: ['NestJS'],
    },
    {
      title: 'Tech Leadership',
      content: 'Managing technical teams...',
      status: ArticleStatus.ARCHIVED,
      authorId: admin.id,
      categoryId: business.id,
      tags: ['JavaScript'],
    },
  ];

  const createdArticleIds: string[] = [];

  for (const articleData of articles) {
    const { tags: tagNames, ...rest } = articleData;
    const createdArticle = await prisma.article.create({
      data: {
        ...rest,
        tags: {
          connect: tagNames.map((name) => ({ name })),
        },
      },
    });
    createdArticleIds.push(createdArticle.id);
  }

  // Create comments
  await prisma.comment.create({
    data: {
      content: 'Great article!',
      articleId: createdArticleIds[0],
      authorId: viewer.id,
    },
  });

  console.log('Database seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
