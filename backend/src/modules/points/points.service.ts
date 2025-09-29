import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class PointsService {
  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  async balance(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    return {
      AIC: user.aicPoints,
      HH: user.hhPoints,
      frozenAIC: user.frozenAicPoints,
      frozenHH: user.frozenHhPoints
    };
  }

  async addForUser(userId: number, pointType: 'AIC' | 'HH', amount: number) {
    if (amount <= 0) throw new BadRequestException('积分数量需大于0');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    if (pointType === 'AIC') user.aicPoints += amount; else user.hhPoints += amount;
    await this.userRepo.save(user);
    return { success: true };
  }
}


