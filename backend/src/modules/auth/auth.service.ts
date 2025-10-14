import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { supabaseAdmin } from '../../config/supabase.config';

interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

interface LoginDto {
  username: string;
  password: string;
}

interface GitHubLoginDto {
  accessToken: string;
}

interface GoogleLoginDto {
  accessToken: string;
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

  async githubLogin(dto: GitHubLoginDto) {
    try {
      // 检查 Supabase 是否已配置
      if (!supabaseAdmin) {
        throw new BadRequestException('GitHub 登录功能未配置，请联系管理员');
      }

      // 使用 Supabase 验证 GitHub access token
      const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(dto.accessToken);
      
      if (error || !supabaseUser) {
        throw new UnauthorizedException('GitHub 认证失败');
      }

      // 获取用户信息
      const { data: { user: userWithMetadata }, error: userError } = await supabaseAdmin.auth.getUser(dto.accessToken);
      
      if (userError || !userWithMetadata) {
        throw new UnauthorizedException('获取用户信息失败');
      }

      const githubUser = userWithMetadata.user_metadata;
      const email = userWithMetadata.email;
      const githubId = userWithMetadata.id;

      // 检查用户是否已存在
      let user = await this.userRepo.findOne({ 
        where: [
          { email: email },
          { githubId: githubId }
        ] 
      });

      if (!user) {
        // 创建新用户
        const username = githubUser.preferred_username || githubUser.user_name || `github_${githubId}`;
        user = this.userRepo.create({
          username: username,
          email: email,
          githubId: githubId,
          avatar: githubUser.avatar_url,
          role: 'user'
        });
        await this.userRepo.save(user);
        console.log('GitHub user created:', user.username);
      } else {
        // 更新现有用户信息
        if (!user.githubId) {
          user.githubId = githubId;
        }
        if (!user.avatar && githubUser.avatar_url) {
          user.avatar = githubUser.avatar_url;
        }
        await this.userRepo.save(user);
        console.log('GitHub user updated:', user.username);
      }

      const token = await this.signToken(user);
      return { token, user: this.sanitizeUser(user) };
    } catch (error) {
      console.error('GitHub login error:', error);
      throw error;
    }
  }

  async googleLogin(dto: GoogleLoginDto) {
    try {
      if (!supabaseAdmin) {
        throw new BadRequestException('Google 登录功能未配置，请联系管理员');
      }

      const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(dto.accessToken);
      if (error || !supabaseUser) {
        throw new UnauthorizedException('Google 认证失败');
      }

      const { data: { user: userWithMetadata }, error: userError } = await supabaseAdmin.auth.getUser(dto.accessToken);
      if (userError || !userWithMetadata) {
        throw new UnauthorizedException('获取用户信息失败');
      }

      const googleUser = userWithMetadata.user_metadata;
      const email = userWithMetadata.email;
      const googleId = userWithMetadata.id;

      let user = await this.userRepo.findOne({
        where: [
          { email: email },
          { googleId: googleId }
        ]
      });

      if (!user) {
        const usernameBase = googleUser.full_name || googleUser.name || googleUser.user_name || 'google_user';
        const username = `${usernameBase}_${String(googleId).slice(-6)}`;
        user = this.userRepo.create({
          username,
          email,
          googleId,
          avatar: googleUser.avatar_url || googleUser.picture || null,
          role: 'user'
        });
        await this.userRepo.save(user);
        console.log('Google user created:', user.username);
      } else {
        if (!user.googleId) user.googleId = googleId;
        if (!user.avatar && (googleUser.avatar_url || googleUser.picture)) {
          user.avatar = googleUser.avatar_url || googleUser.picture;
        }
        await this.userRepo.save(user);
        console.log('Google user updated:', user.username);
      }

      const token = await this.signToken(user);
      return { token, user: this.sanitizeUser(user) };
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  private async signToken(user: User) {
    return this.jwtService.signAsync({ sub: user.id, username: user.username });
  }

  private sanitizeUser(user: User) {
    const { password, ...rest } = user as any;
    return rest;
  }
}


