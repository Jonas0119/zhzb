import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string; // 用户名或邮箱

  @IsString()
  @IsNotEmpty()
  password: string;
}

class GitHubLoginDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('github-login')
  githubLogin(@Body() dto: GitHubLoginDto) {
    return this.authService.githubLogin(dto);
  }

  @Post('google-login')
  googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@Req() req: any) {
    return this.authService.profile(req.user.userId);
  }
}