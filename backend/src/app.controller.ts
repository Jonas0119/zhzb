import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('time')
  getTime() {
    const now = new Date();
    return {
      serverTime: now.toISOString(),
      localTime: now.toString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: now.getTimezoneOffset(),
      beijingTime: new Date(now.getTime() + (8 * 60 * 60 * 1000)).toISOString()
    };
  }
}
