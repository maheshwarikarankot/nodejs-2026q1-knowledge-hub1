import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { AuthService } from '../../auth/auth.service';
import { UserRole } from '../../common/enums';
import { UserRepository } from '../../user/user.repository';
import { TokenRepository } from '../../auth/token.repository';

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const userRepositoryMock = {
    create: vi.fn(),
    findByLoginWithPassword: vi.fn(),
  };

  const tokenRepositoryMock = {
    generateTokenPair: vi.fn(),
    verifyRefreshToken: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    process.env.JWT_SECRET = 'access-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';
    process.env.JWT_ACCESS_TTL = '15m';
    process.env.JWT_REFRESH_TTL = '7d';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: userRepositoryMock,
        },
        {
          provide: TokenRepository,
          useValue: tokenRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('signUpUser delegates to repository', async () => {
    const dto = { login: 'peter', password: 'Pass123!' };
    const created = { id: 'u1', login: dto.login, role: UserRole.VIEWER };

    userRepositoryMock.create.mockResolvedValueOnce(created);

    const result = await service.signUpUser(dto);

    expect(result).toEqual(created);
    expect(userRepositoryMock.create).toHaveBeenCalledWith(dto);
  });

  it('login throws ForbiddenException when user does not exist', async () => {
    userRepositoryMock.findByLoginWithPassword.mockResolvedValueOnce(null);

    await expect(
      service.login({ login: 'egfry', password: 'pwd' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('login throws ForbiddenException when password is invalid', async () => {
    userRepositoryMock.findByLoginWithPassword.mockResolvedValueOnce({
      id: 'u1',
      login: 'john',
      password: 'secret123',
      role: UserRole.ADMIN,
    });

    vi.mocked(compare).mockResolvedValueOnce(false as never);

    await expect(
      service.login({ login: 'john', password: 'wrong' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('login returns access and refresh tokens for valid credentials', async () => {
    userRepositoryMock.findByLoginWithPassword.mockResolvedValueOnce({
      id: 'u1',
      login: 'john',
      password: 'secret123',
      role: UserRole.EDITOR,
    });

    vi.mocked(compare).mockResolvedValueOnce(true as never);
    tokenRepositoryMock.generateTokenPair.mockResolvedValueOnce({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const result = await service.login({ login: 'john', password: 'correct' });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(tokenRepositoryMock.generateTokenPair).toHaveBeenCalledWith({
      userId: 'u1',
      login: 'john',
      role: UserRole.EDITOR,
    });
  });

  it('login uses alternate env keys when primary JWT env vars are absent', async () => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_ACCESS_TTL;
    delete process.env.JWT_REFRESH_TTL;
    process.env.JWT_SECRET_KEY = 'alt-access-secret';
    process.env.JWT_SECRET_REFRESH_KEY = 'alt-refresh-secret';
    process.env.TOKEN_EXPIRE_TIME = '30m';
    process.env.TOKEN_REFRESH_EXPIRE_TIME = '10d';

    userRepositoryMock.findByLoginWithPassword.mockResolvedValueOnce({
      id: 'u-alt',
      login: 'john-alt',
      password: 'stored-hash',
      role: UserRole.ADMIN,
    });

    vi.mocked(compare).mockResolvedValueOnce(true as never);
    tokenRepositoryMock.generateTokenPair.mockResolvedValueOnce({
      accessToken: 'alt-access-token',
      refreshToken: 'alt-refresh-token',
    });

    const result = await service.login({
      login: 'john-alt',
      password: 'correct',
    });

    expect(result).toEqual({
      accessToken: 'alt-access-token',
      refreshToken: 'alt-refresh-token',
    });
    expect(tokenRepositoryMock.generateTokenPair).toHaveBeenCalledWith({
      userId: 'u-alt',
      login: 'john-alt',
      role: UserRole.ADMIN,
    });
  });

  it('login falls back to hardcoded defaults when all JWT env vars are missing', async () => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_SECRET_KEY;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_SECRET_REFRESH_KEY;
    delete process.env.JWT_ACCESS_TTL;
    delete process.env.TOKEN_EXPIRE_TIME;
    delete process.env.JWT_REFRESH_TTL;
    delete process.env.TOKEN_REFRESH_EXPIRE_TIME;

    userRepositoryMock.findByLoginWithPassword.mockResolvedValueOnce({
      id: 'u-default',
      login: 'john-default',
      password: 'stored-hash',
      role: UserRole.VIEWER,
    });

    vi.mocked(compare).mockResolvedValueOnce(true as never);
    tokenRepositoryMock.generateTokenPair.mockResolvedValueOnce({
      accessToken: 'default-access',
      refreshToken: 'default-refresh',
    });

    await service.login({ login: 'john-default', password: 'correct' });

    expect(tokenRepositoryMock.generateTokenPair).toHaveBeenCalledWith({
      userId: 'u-default',
      login: 'john-default',
      role: UserRole.VIEWER,
    });
  });

  it('refresh throws UnauthorizedException when refreshToken is missing', async () => {
    await expect(service.refresh({})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refresh throws ForbiddenException for invalid/expired token', async () => {
    tokenRepositoryMock.verifyRefreshToken.mockRejectedValueOnce(
      new Error('expired'),
    );

    await expect(
      service.refresh({ refreshToken: 'bad-token' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refresh verifies token and rotates token pair', async () => {
    tokenRepositoryMock.verifyRefreshToken.mockResolvedValueOnce({
      userId: 'u1',
      login: 'john',
      role: UserRole.ADMIN,
    });

    tokenRepositoryMock.generateTokenPair.mockResolvedValueOnce({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });

    const result = await service.refresh({ refreshToken: 'valid-refresh' });

    expect(tokenRepositoryMock.verifyRefreshToken).toHaveBeenCalledWith(
      'valid-refresh',
    );
    expect(result).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
  });
});
