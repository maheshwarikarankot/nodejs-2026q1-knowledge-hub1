import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../../src/user/user.service';
import { UserRepository } from '../../../src/user/user.repository';
import { UserRole } from '../../../src/common/enums';

describe('UserService', () => {
  let service: UserService;

  const userRepositoryMock = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    findByLoginWithPassword: vi.fn(),
    updateUser: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: userRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('findAll delegates to repository', async () => {
    const users = [
      { id: 'u1', login: 'john', role: UserRole.VIEWER, createdAt: 1, updatedAt: 2 },
    ];
    userRepositoryMock.findAll.mockResolvedValueOnce(users);

    const result = await service.findAll();

    expect(result).toEqual(users);
    expect(userRepositoryMock.findAll).toHaveBeenCalledTimes(1);
  });

  it('findOne delegates to repository', async () => {
    const user = { id: 'u1', login: 'john', role: UserRole.EDITOR, createdAt: 1, updatedAt: 2 };
    userRepositoryMock.findOne.mockResolvedValueOnce(user);

    const result = await service.findOne('u1');

    expect(result).toEqual(user);
    expect(userRepositoryMock.findOne).toHaveBeenCalledWith('u1');
  });

  it('create delegates to repository', async () => {
    const dto = { login: 'peter', password: 'Secret123', role: UserRole.ADMIN };
    const created = { id: 'u2', login: dto.login, role: dto.role, createdAt: 3, updatedAt: 3 };
    userRepositoryMock.create.mockResolvedValueOnce(created);

    const result = await service.create(dto);

    expect(result).toEqual(created);
    expect(userRepositoryMock.create).toHaveBeenCalledWith(dto);
  });

  it('findByLoginWithPassword delegates to repository', async () => {
    const found = {
      id: 'u1',
      login: 'john',
      password: 'hash',
      role: UserRole.VIEWER,
    };
    userRepositoryMock.findByLoginWithPassword.mockResolvedValueOnce(found);

    const result = await service.findByLoginWithPassword('john');

    expect(result).toEqual(found);
    expect(userRepositoryMock.findByLoginWithPassword).toHaveBeenCalledWith('john');
  });

  it('updatePassword maps dto fields and delegates to repository', async () => {
    const dto = { oldPassword: 'oldPass', newPassword: 'newPass' };
    const updated = { id: 'u1', login: 'john', role: UserRole.VIEWER, createdAt: 1, updatedAt: 4 };
    userRepositoryMock.updateUser.mockResolvedValueOnce(updated);

    const result = await service.updatePassword('u1', dto);

    expect(result).toEqual(updated);
    expect(userRepositoryMock.updateUser).toHaveBeenCalledWith('u1', {
      oldPassword: dto.oldPassword,
      newPassword: dto.newPassword,
    });
  });

  it('remove delegates to repository', async () => {
    userRepositoryMock.remove.mockResolvedValueOnce(undefined);

    await service.remove('u1');

    expect(userRepositoryMock.remove).toHaveBeenCalledWith('u1');
  });

  it('remove propagates repository not found errors', async () => {
    const notFoundError = new Error('User with id missing not found');
    userRepositoryMock.remove.mockRejectedValueOnce(notFoundError);

    await expect(service.remove('missing')).rejects.toThrow('User with id missing not found');
  });

  it('nullifyAuthor is a no-op and does not touch repository', () => {
    service.nullifyAuthor('u1');

    expect(userRepositoryMock.remove).not.toHaveBeenCalled();
    expect(userRepositoryMock.updateUser).not.toHaveBeenCalled();
  });
});
