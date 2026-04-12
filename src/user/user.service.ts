import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { Role as PrismaRole } from '@prisma/client';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

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
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return this.sanitize(user);
    }

    async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
        const user = await this.prisma.user.create({
            data: {
                login: dto.login,
                password: dto.password,
                role: this.toPrismaRole(dto.role ?? UserRole.VIEWER),
            },
        });

        return this.sanitize(user);
    }

    async updatePassword(id: string, dto: UpdatePasswordDto): Promise<Omit<User, 'password'>> {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        if(user.password !== dto.oldPassword){
            throw new ForbiddenException(`Old password does not match`);
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: {
                password: dto.newPassword,
            },
        });

        return this.sanitize(updatedUser);
    }

    async remove(id: string): Promise<void> {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
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
