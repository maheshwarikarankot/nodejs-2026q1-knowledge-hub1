import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { AuthEntity } from './entities/auth.entity';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto): Promise<AuthEntity> {
    return this.authService.signUpUser(signUpDto);
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.login(loginDto);
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Body() refreshDto: RefreshDto): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refresh(refreshDto);
  }
}
