import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenRepository {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private getAccessSecret(): string {
    return process.env.JWT_SECRET ?? process.env.JWT_SECRET_KEY ?? '';
  }

  private getRefreshSecret(): string {
    return (
      process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET_REFRESH_KEY ?? ''
    );
  }

  private getAccessTtl(): string {
    return process.env.JWT_ACCESS_TTL ?? process.env.TOKEN_EXPIRE_TIME ?? '15m';
  }

  private getRefreshTtl(): string {
    return (
      process.env.JWT_REFRESH_TTL ??
      process.env.TOKEN_REFRESH_EXPIRE_TIME ??
      '7d'
    );
  }

  async generateTokenPair(
    payload: JwtPayload,
  ): Promise<{ accessToken: string; refreshToken: string }> {
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

    const refreshTtl = this.getRefreshTtl();
    const expiresAt = new Date();
    if (refreshTtl.includes('d')) {
      const days = parseInt(refreshTtl.replace('d', ''));
      expiresAt.setDate(expiresAt.getDate() + days);
    } else if (refreshTtl.includes('h')) {
      const hours = parseInt(refreshTtl.replace('h', ''));
      expiresAt.setHours(expiresAt.getHours() + hours);
    } else if (refreshTtl.includes('m')) {
      const minutes = parseInt(refreshTtl.replace('m', ''));
      expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
    }

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: payload.userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  verifyAccessToken(accessToken: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(accessToken, {
      secret: this.getAccessSecret(),
    });
  }

  async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (
      !tokenRecord ||
      tokenRecord.isRevoked ||
      tokenRecord.expiresAt < new Date()
    ) {
      throw new Error('Invalid or expired refresh token');
    }

    return this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
      secret: this.getRefreshSecret(),
    });
  }

  async invalidateRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
  }

  async invalidateAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }
}