import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

interface LoginDto {
  username: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    try {
      console.log('Register attempt:', { username: dto.username, email: dto.email });

      const exists = await this.userRepo.findOne({ where: [{ username: dto.username }, { email: dto.email }] });
      if (exists) {
        throw new BadRequestException('用户名或邮箱已存在');
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const user = this.userRepo.create({ username: dto.username, email: dto.email, password: passwordHash });
      await this.userRepo.save(user);

      const token = await this.signToken(user);
      console.log('Register success for user:', user.username);

      return { token, user: this.sanitizeUser(user) };
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: [{ username: dto.username }, { email: dto.username }] });
    if (!user) throw new UnauthorizedException('账号或密码错误');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('账号或密码错误');
    const token = await this.signToken(user);
    return { token, user: this.sanitizeUser(user) };
  }

  async profile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    return this.sanitizeUser(user);
  }

  private async signToken(user: User) {
    return this.jwtService.signAsync({ sub: user.id, username: user.username });
  }

  private sanitizeUser(user: User) {
    const { password, ...rest } = user as any;
    return rest;
  }
}


