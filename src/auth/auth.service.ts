import { Injectable } from '@nestjs/common';
import { ForbiddenError, UnauthorizedError } from '../common/errors/custom-errors';
import { AuthEntity } from './entities/auth.entity';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
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

  async signUpUser(signUpUserDto: {
    login: string;
    password: string;
  }): Promise<AuthEntity> {
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

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findByLoginWithPassword(dto.login);
    if (!user) {
      throw new ForbiddenError('Authentication failed');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new ForbiddenError('Authentication failed');
    }

    return this.tokenRepository.generateTokenPair({
      userId: user.id,
      login: user.login,
      role: user.role as UserRole,
    });
  }

  async refresh(
    dto: RefreshDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!dto?.refreshToken) {
      throw new UnauthorizedError('refreshToken is required');
    }

    try {
      const payload = await this.tokenRepository.verifyRefreshToken(
        dto.refreshToken,
      );

      return this.tokenRepository.generateTokenPair({
        userId: payload.userId,
        login: payload.login,
        role: payload.role,
      });
    } catch {
      throw new ForbiddenError('Invalid or expired refresh token');
    }
  }

  async logout(dto: LogoutDto): Promise<{ message: string }> {
    if (!dto?.refreshToken) {
      throw new UnauthorizedError('refreshToken is required');
    }

    try {
      await this.tokenRepository.invalidateRefreshToken(dto.refreshToken);
      return { message: 'Successfully logged out' };
    } catch {
      throw new ForbiddenError('Invalid refresh token');
    }
  }
}
