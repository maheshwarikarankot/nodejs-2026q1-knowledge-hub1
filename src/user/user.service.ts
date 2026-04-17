import { Injectable } from '@nestjs/common';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../common/enums';
import { UserRepository } from './user.repository';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    async findAll(): Promise<Array<Omit<UserEntity, 'password'>>> {
        return this.userRepository.findAll();
    }

    async findOne(id: string): Promise<Omit<UserEntity, 'password'>> {
        return this.userRepository.findOne(id);
    }

    async create(dto: CreateUserDto): Promise<Omit<UserEntity, 'password'>> {
        return this.userRepository.create(dto);
    }

    async findByLoginWithPassword(login: string): Promise<{ id: string; login: string; password: string; role: UserRole } | null> {
        return this.userRepository.findByLoginWithPassword(login);
    }

    async updatePassword(id: string, dto: UpdatePasswordDto): Promise<Omit<UserEntity, 'password'>> {
        return this.userRepository.updateUser(id, {
            oldPassword: dto.oldPassword,
            newPassword: dto.newPassword,
        });
    }

    async remove(id: string): Promise<void> {
        await this.userRepository.remove(id);
    }

    nullifyAuthor(userId: string): void {
        void userId;
    }

}