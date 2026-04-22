import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthEntity } from './entities/auth.entity';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UserRole } from '../common/enums';
import { UserRepository } from '../user/user.repository';
import { UserEntity } from '../user/entities/user.entity';
import { TokenRepository } from './token.repository';

@Injectable()
export class AuthService {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly tokenRepository: TokenRepository,
    ) {}

    async signUpUser(signUpUserDto: { login: string; password: string }): Promise<AuthEntity> {
        const { login, password } = signUpUserDto;
        const userDto = { login, password };
        const createdUser = await this.userRepo.create(userDto);
        const userEntity = new UserEntity({
            id: createdUser.id,
            login: createdUser.login,
            role: createdUser.role,
        });
        
        return {
            id: userEntity.id,
            login: userEntity.login,
            role: userEntity.role,
        };
    }

    async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
        const user = await this.userRepo.findByLoginWithPassword(dto.login);
        if (!user) {
            throw new ForbiddenException('Authentication failed');
        }

        const passwordMatches = await bcrypt.compare(dto.password, user.password);
        if (!passwordMatches) {
            throw new ForbiddenException('Authentication failed');
        }

        return this.tokenRepository.generateTokenPair({
            userId: user.id,
            login: user.login,
            role: user.role as UserRole,
        });
    }

    async refresh(dto: RefreshDto): Promise<{ accessToken: string; refreshToken: string }> {
        if (!dto?.refreshToken) {
            throw new UnauthorizedException('refreshToken is required');
        }

        try {
            const payload = await this.tokenRepository.verifyRefreshToken(dto.refreshToken);

            return this.tokenRepository.generateTokenPair({
                userId: payload.userId,
                login: payload.login,
                role: payload.role,
            });
        } catch {
            throw new ForbiddenException('Invalid or expired refresh token');
        }
    }
}
