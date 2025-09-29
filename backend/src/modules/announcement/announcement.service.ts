import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from '../../entities/announcement.entity';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement) private readonly repo: Repository<Announcement>
  ) {}

  async list() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async detail(id: number) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('公告不存在');
    // 阅读量+1
    await this.repo.update(id, { viewCount: (item.viewCount || 0) + 1 });
    return { ...item, viewCount: (item.viewCount || 0) + 1 };
  }
}


