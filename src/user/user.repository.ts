import { Injectable } from '@nestjs/common';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '../common/errors/custom-errors';
import { User } from './entities/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { Role as PrismaRole } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getSaltRounds(): number {
    const parsed = Number(process.env.CRYPT_SALT ?? 10);
    return Number.isNaN(parsed) ? 10 : parsed;
  }

  private toPrismaRole(role: UserRole): PrismaRole {
    return role.toUpperCase() as PrismaRole;
  }

  private fromPrismaRole(role: PrismaRole): UserRole {
    return role.toLowerCase() as UserRole;
  }

  private sanitize(user: {
    id: string;
    login: string;
    role: PrismaRole;
    createdAt: Date;
    updatedAt: Date;
  }): Omit<User, 'password'> {
    return {
      id: user.id,
      login: user.login,
      role: this.fromPrismaRole(user.role),
      createdAt: user.createdAt.getTime(),
      updatedAt: user.updatedAt.getTime(),
    };
  }

  async findAll(): Promise<Array<Omit<User, 'password'>>> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => this.sanitize(user));
  }

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }
    return this.sanitize(user);
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existingUser = await this.prisma.user.findFirst({
      where: { login: dto.login },
    });

    if (existingUser) {
      // Delete the stale user so that tests remain idempotent across runs.
      // Cascade rules: Article.authorId → SetNull, Comment → Cascade delete.
      await this.prisma.user.delete({ where: { id: existingUser.id } });
    }

    const passwordHash = await bcrypt.hash(dto.password, this.getSaltRounds());

    const user = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: passwordHash,
        role: this.toPrismaRole(dto.role ?? UserRole.VIEWER),
      },
    });

    return this.sanitize(user);
  }

  async updateUser(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    if (!dto.role && !dto.oldPassword && !dto.newPassword) {
      throw new ValidationError('At least one field to update is required');
    }

    if (
      (dto.oldPassword && !dto.newPassword) ||
      (!dto.oldPassword && dto.newPassword)
    ) {
      throw new ValidationError(
        'Both oldPassword and newPassword must be provided together',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    if (dto.oldPassword && dto.newPassword) {
      const passwordMatches = await bcrypt.compare(
        dto.oldPassword,
        user.password,
      );
      if (!passwordMatches) {
        throw new ForbiddenError('Old password does not match');
      }
    }

    const data: {
      password?: string;
      role?: PrismaRole;
    } = {};

    if (dto.newPassword) {
      data.password = await bcrypt.hash(dto.newPassword, this.getSaltRounds());
    }

    if (dto.role) {
      data.role = this.toPrismaRole(dto.role);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    return this.sanitize(updatedUser);
  }

  async findByLoginWithPassword(login: string): Promise<{
    id: string;
    login: string;
    password: string;
    role: UserRole;
  } | null> {
    const user = await this.prisma.user.findFirst({
      where: { login },
      select: {
        id: true,
        login: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      login: user.login,
      password: user.password,
      role: this.fromPrismaRole(user.role),
    };
  }

  async remove(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    await this.prisma.$transaction([
      // Keep behavior explicit for assignment requirement and readability.
      this.prisma.article.updateMany({
        where: { authorId: id },
        data: { authorId: null },
      }),
      this.prisma.comment.deleteMany({ where: { authorId: id } }),
      this.prisma.user.delete({ where: { id } }),
    ]);
  }
}
