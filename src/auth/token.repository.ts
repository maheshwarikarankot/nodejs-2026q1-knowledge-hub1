import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class TokenRepository {
    constructor(private readonly jwtService: JwtService) {}

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

    async generateTokenPair(payload: JwtPayload): Promise<{ accessToken: string; refreshToken: string }> {
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

    verifyAccessToken(accessToken: string): Promise<JwtPayload> {
        return this.jwtService.verifyAsync<JwtPayload>(accessToken, {
            secret: this.getAccessSecret(),
        });
    }

    verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
        return this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
            secret: this.getRefreshSecret(),
        });
    }
}