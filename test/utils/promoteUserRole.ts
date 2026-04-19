import prisma from '../lib/prisma';

type Role = 'viewer' | 'editor' | 'admin';

const toPrismaRole = (role: Role): 'VIEWER' | 'EDITOR' | 'ADMIN' => {
  if (role === 'admin') return 'ADMIN';
  if (role === 'editor') return 'EDITOR';
  return 'VIEWER';
};

const promoteUserRole = async (userId: string, role: Role): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { role: toPrismaRole(role) },
  });
};

export default promoteUserRole;
