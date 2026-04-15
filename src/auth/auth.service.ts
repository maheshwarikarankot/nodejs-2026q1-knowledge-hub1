import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { AuthEntity } from './entities/auth.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UserRole } from '../common/enums';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) {}

    private getAccessSecret(): string {
        return process.env.JWT_SECRET ?? process.env.JWT_SECRET_KEY ?? '';
    }

    private getRefreshSecret(): string {
        return process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET_REFRESH_KEY ?? '';
    }

    private getAccessTtl(): string {
        return process.env.JWT_ACCESS_TTL ?? process.env.TOKEN_EXPIRE_TIME ?? '15m';
    }

    private getRefreshTtl(): string {
        return process.env.JWT_REFRESH_TTL ?? process.env.TOKEN_REFRESH_EXPIRE_TIME ?? '7d';
    }

    private async issueTokenPair(payload: JwtPayload): Promise<{ accessToken: string; refreshToken: string }> {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.getAccessSecret(),
                expiresIn: this.getAccessTtl(),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.getRefreshSecret(),
                expiresIn: this.getRefreshTtl(),
            }),
        ]);

        return { accessToken, refreshToken };
    }

    async signUpUser(signUpUserDto: { login: string; password: string }): Promise<AuthEntity> {
        const { login, password } = signUpUserDto;
        return this.userService.create({ login, password });
    }

    async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
        const user = await this.userService.findByLoginWithPassword(dto.login);
        if (!user) {
            throw new ForbiddenException('Authentication failed');
        }

        const passwordMatches = await bcrypt.compare(dto.password, user.password);
        if (!passwordMatches) {
            throw new ForbiddenException('Authentication failed');
        }

        return this.issueTokenPair({
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
            const payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
                secret: this.getRefreshSecret(),
            });

            return this.issueTokenPair({
                userId: payload.userId,
                login: payload.login,
                role: payload.role,
            });
        } catch {
            throw new ForbiddenException('Invalid or expired refresh token');
        }
    }
}
