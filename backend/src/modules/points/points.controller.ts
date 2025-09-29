import { Body, Controller, Get, Param, ParseFloatPipe, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { PointsService } from './points.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('points')
export class PointsController {
  constructor(private readonly service: PointsService) {}

  @Get('balance')
  balance(@Req() req: any) {
    return this.service.balance(req.user.userId);
  }

  // 管理员接口（此处未加角色控制，后续可扩展）
  @Post('add/:userId')
  addPoints(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { pointType: 'AIC' | 'HH'; amount: number }
  ) {
    return this.service.addForUser(userId, body.pointType, Number(body.amount));
  }
}


