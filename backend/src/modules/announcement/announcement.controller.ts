import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';

@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly service: AnnouncementService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.detail(id);
  }
}


