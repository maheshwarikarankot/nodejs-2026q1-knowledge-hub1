const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    const row = await p.user.findFirst({ where: { login: 'x' } });
    console.log('row', row);
  } catch (e) {
    console.log('name', e.name);
    console.log('code', e.code);
    console.log('message', e.message);
    console.log('meta', e.meta);
  } finally {
    await p.$disconnect();
  }
})();
