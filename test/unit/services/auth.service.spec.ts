import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { AuthService } from '../../../src/auth/auth.service';
import { AuthRepository } from '../../../src/auth/auth.repository';
import { UserRole } from '../../../src/common/enums';

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const authRepositoryMock = {
    createUser: vi.fn(),
    findByLogin: vi.fn(),
  };

  const jwtServiceMock = {
    signAsync: vi.fn(),
    verifyAsync: vi.fn(),
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
          provide: AuthRepository,
          useValue: authRepositoryMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('signUpUser delegates to repository', async () => {
    const dto = { login: 'peter', password: 'Pass123!' };
    const created = { id: 'u1', login: dto.login, role: UserRole.VIEWER };

    authRepositoryMock.createUser.mockResolvedValueOnce(created);

    const result = await service.signUpUser(dto);

    expect(result).toEqual(created);
    expect(authRepositoryMock.createUser).toHaveBeenCalledWith(dto);
  });

  it('login throws ForbiddenException when user does not exist', async () => {
    authRepositoryMock.findByLogin.mockResolvedValueOnce(null);

    await expect(service.login({ login: 'egfry', password: 'pwd' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('login throws ForbiddenException when password is invalid', async () => {
    authRepositoryMock.findByLogin.mockResolvedValueOnce({
      id: 'u1',
      login: 'john',
      password: 'secret123',
      role: UserRole.ADMIN,
    });

    vi.mocked(compare).mockResolvedValueOnce(false as never);

    await expect(service.login({ login: 'john', password: 'wrong' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('login returns access and refresh tokens for valid credentials', async () => {
    authRepositoryMock.findByLogin.mockResolvedValueOnce({
      id: 'u1',
      login: 'john',
      password: 'secret123',
      role: UserRole.EDITOR,
    });

    vi.mocked(compare).mockResolvedValueOnce(true as never);
    jwtServiceMock.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.login({ login: 'john', password: 'correct' });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
      1,
      { userId: 'u1', login: 'john', role: UserRole.EDITOR },
      { secret: 'access-secret', expiresIn: '15m' },
    );
    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
      2,
      { userId: 'u1', login: 'john', role: UserRole.EDITOR },
      { secret: 'refresh-secret', expiresIn: '7d' },
    );
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

    authRepositoryMock.findByLogin.mockResolvedValueOnce({
      id: 'u-alt',
      login: 'john-alt',
      password: 'stored-hash',
      role: UserRole.ADMIN,
    });

    vi.mocked(compare).mockResolvedValueOnce(true as never);
    jwtServiceMock.signAsync
      .mockResolvedValueOnce('alt-access-token')
      .mockResolvedValueOnce('alt-refresh-token');

    const result = await service.login({ login: 'john-alt', password: 'correct' });

    expect(result).toEqual({
      accessToken: 'alt-access-token',
      refreshToken: 'alt-refresh-token',
    });
    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
      1,
      { userId: 'u-alt', login: 'john-alt', role: UserRole.ADMIN },
      { secret: 'alt-access-secret', expiresIn: '30m' },
    );
    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
      2,
      { userId: 'u-alt', login: 'john-alt', role: UserRole.ADMIN },
      { secret: 'alt-refresh-secret', expiresIn: '10d' },
    );
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

    authRepositoryMock.findByLogin.mockResolvedValueOnce({
      id: 'u-default',
      login: 'john-default',
      password: 'stored-hash',
      role: UserRole.VIEWER,
    });

    vi.mocked(compare).mockResolvedValueOnce(true as never);
    jwtServiceMock.signAsync
      .mockResolvedValueOnce('default-access')
      .mockResolvedValueOnce('default-refresh');

    await service.login({ login: 'john-default', password: 'correct' });

    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
      1,
      { userId: 'u-default', login: 'john-default', role: UserRole.VIEWER },
      { secret: '', expiresIn: '15m' },
    );
    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
      2,
      { userId: 'u-default', login: 'john-default', role: UserRole.VIEWER },
      { secret: '', expiresIn: '7d' },
    );
  });

  it('refresh throws UnauthorizedException when refreshToken is missing', async () => {
    await expect(service.refresh({})).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refresh throws ForbiddenException for invalid/expired token', async () => {
    jwtServiceMock.verifyAsync.mockRejectedValueOnce(new Error('expired'));

    await expect(service.refresh({ refreshToken: 'bad-token' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('refresh verifies token and rotates token pair', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValueOnce({
      userId: 'u1',
      login: 'john',
      role: UserRole.ADMIN,
    });

    jwtServiceMock.signAsync
      .mockResolvedValueOnce('new-access')
      .mockResolvedValueOnce('new-refresh');

    const result = await service.refresh({ refreshToken: 'valid-refresh' });

    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('valid-refresh', {
      secret: 'refresh-secret',
    });
    expect(result).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
  });
});
