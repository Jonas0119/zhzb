import { Body, Controller, Get, Post, Req, UseGuards, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly service: WalletService) {}

  @Get('info')
  info(@Req() req: any) {
    return this.service.getInfo(req.user.userId);
  }

  @Post('recharge')
  recharge(@Req() req: any, @Body() body: { amount: number }) {
    return this.service.recharge(req.user.userId, Number(body.amount));
  }

  @Get('transactions')
  transactions(@Req() req: any) {
    return this.service.transactions(req.user.userId);
  }

  @Get('bank-cards')
  bankCards(@Req() req: any) {
    return this.service.listCards(req.user.userId);
  }

  @Post('bank-card')
  addCard(@Req() req: any, @Body() body: { cardNumber: string; holderName: string; bankName: string; phone: string }) {
    return this.service.addCard(req.user.userId, body);
  }

  @Delete('bank-cards/:id')
  deleteCard(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.deleteCard(req.user.userId, id);
  }
}


