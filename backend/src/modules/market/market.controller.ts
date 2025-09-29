import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { MarketService } from './market.service';
import { PointType } from '../../entities/order.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('market')
export class MarketController {
  constructor(private readonly service: MarketService) {}

  @Get('orders')
  list(@Query('pointType') pointType?: PointType) {
    return this.service.listActive(pointType as any);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sell')
  createSell(@Req() req: any, @Body() body: { pointType: PointType; amount: number; unitPrice: number }) {
    // 参数阈值校验
    if (Number(body.amount) <= 0 || Number(body.amount) > 1_000_000) throw new BadRequestException('数量不合法')
    if (Number(body.unitPrice) <= 0 || Number(body.unitPrice) > 1_000_000) throw new BadRequestException('价格不合法')
    return this.service.sell({
      userId: req.user.userId,
      pointType: body.pointType,
      amount: Number(body.amount),
      unitPrice: Number(body.unitPrice)
    })
  }

  @UseGuards(JwtAuthGuard)
  @Post('buy/:id')
  buy(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: { amount: number }) {
    if (Number(body.amount) <= 0 || Number(body.amount) > 1_000_000) throw new BadRequestException('数量不合法')
    return this.service.buy(id, { userId: req.user.userId, amount: Number(body.amount) });
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  myOrders(@Req() req: any) {
    return this.service.myOrders(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:id')
  getOrderDetail(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.getOrderDetail(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('orders/:id')
  cancel(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.cancel(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/:id/review')
  review(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: { rating: number; comment?: string }) {
    if (Number(body.rating) < 1 || Number(body.rating) > 5) throw new BadRequestException('评分必须在1-5之间')
    return this.service.review(id, req.user.userId, { rating: Number(body.rating), comment: body.comment });
  }
}


