import { Injectable } from '@nestjs/common';
import { Role as PrismaRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/enums';
import { AuthEntity } from './entities/auth.entity';

@Injectable()
export class AuthRepository {
    constructor(private readonly prisma: PrismaService) {}

    private getSaltRounds(): number {
        const parsed = Number(process.env.CRYPT_SALT ?? 10);
        return Number.isNaN(parsed) ? 10 : parsed;
    }

    private fromPrismaRole(role: PrismaRole): UserRole {
        return role.toLowerCase() as UserRole;
    }

    async createUser(dto: { login: string; password: string }): Promise<AuthEntity> {
        const existing = await this.prisma.user.findFirst({
            where: { login: dto.login },
        });

        if (existing) {
            await this.prisma.user.delete({ where: { id: existing.id } });
        }

        const passwordHash = await bcrypt.hash(dto.password, this.getSaltRounds());

        const user = await this.prisma.user.create({
            data: {
                login: dto.login,
                password: passwordHash,
                role: PrismaRole.VIEWER,
            },
        });

        return {
            id: user.id,
            login: user.login,
            role: this.fromPrismaRole(user.role),
        };
    }

    async findByLogin(
        login: string,
    ): Promise<{ id: string; login: string; password: string; role: UserRole } | null> {
        const user = await this.prisma.user.findFirst({
            where: { login },
            select: { id: true, login: true, password: true, role: true },
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
}
