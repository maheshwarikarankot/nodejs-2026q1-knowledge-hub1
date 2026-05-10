import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { TokenRepository } from '../../../src/auth/token.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { UserRole } from '../../../src/common/enums';

describe('TokenRepository', () => {
  let repository: TokenRepository;

  const jwtServiceMock = {
    signAsync: vi.fn(),
    verifyAsync: vi.fn(),
  };

  // Minimal Prisma mock — TokenRepository persists refresh tokens to DB,
  // but these unit tests only exercise sign/verify paths, so an empty
  // refreshToken delegate is enough to satisfy DI.
  const prismaServiceMock = {
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  };

  const payload = {
    userId: 'u1',
    login: 'john',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    process.env.JWT_SECRET = 'access-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';
    process.env.JWT_ACCESS_TTL = '15m';
    process.env.JWT_REFRESH_TTL = '7d';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenRepository,
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    repository = module.get<TokenRepository>(TokenRepository);
  });

  it('generates access and refresh tokens with primary env vars', async () => {
    jwtServiceMock.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await repository.generateTokenPair(payload);

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(1, payload, {
      secret: 'access-secret',
      expiresIn: '15m',
    });
    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(2, payload, {
      secret: 'refresh-secret',
      expiresIn: '7d',
    });
  });

  it('uses fallback env vars when primary token config is absent', async () => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_ACCESS_TTL;
    delete process.env.JWT_REFRESH_TTL;
    process.env.JWT_SECRET_KEY = 'alt-access-secret';
    process.env.JWT_SECRET_REFRESH_KEY = 'alt-refresh-secret';
    process.env.TOKEN_EXPIRE_TIME = '30m';
    process.env.TOKEN_REFRESH_EXPIRE_TIME = '10d';

    jwtServiceMock.signAsync
      .mockResolvedValueOnce('alt-access')
      .mockResolvedValueOnce('alt-refresh');

    await repository.generateTokenPair(payload);

    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(1, payload, {
      secret: 'alt-access-secret',
      expiresIn: '30m',
    });
    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(2, payload, {
      secret: 'alt-refresh-secret',
      expiresIn: '10d',
    });
  });

  it('verifies access token with access secret', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValueOnce(payload);

    const result = await repository.verifyAccessToken('access-token');

    expect(result).toEqual(payload);
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('access-token', {
      secret: 'access-secret',
    });
  });

  it('verifies refresh token with refresh secret', async () => {
    // verifyRefreshToken first looks up the token row in Prisma to check
    // for revocation/expiry, then verifies the JWT signature.
    prismaServiceMock.refreshToken.findUnique.mockResolvedValueOnce({
      id: 'rt1',
      token: 'refresh-token',
      userId: 'u1',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60_000), // 1 minute in the future
      createdAt: new Date(),
    });
    jwtServiceMock.verifyAsync.mockResolvedValueOnce(payload);

    const result = await repository.verifyRefreshToken('refresh-token');

    expect(result).toEqual(payload);
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('refresh-token', {
      secret: 'refresh-secret',
    });
  });
});
