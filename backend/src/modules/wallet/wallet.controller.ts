import { Body, Controller, Get, Post, Req, UseGuards, Delete, Param, ParseIntPipe, Headers, BadRequestException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import type { Request } from 'express';

@Controller('wallet')
export class WalletController {
  constructor(private readonly service: WalletService) {}

  @Get('recharge-products')
  getRechargeProducts() {
    return this.service.getRechargeProducts();
  }

  @Get('test-creem-product/:productId')
  async testCreemProduct(@Param('productId') productId: string) {
    return this.service.testCreemProduct(productId);
  }

  @Get('diagnose-creem')
  async diagnoseCreem() {
    return this.service.diagnoseCreemAPI();
  }

  @Get('test-auth-formats')
  async testAuthFormats() {
    return this.service.testApiKeyFormats();
  }

  @UseGuards(JwtAuthGuard)
  @Get('info')
  info(@Req() req: any) {
    return this.service.getInfo(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('recharge')
  createRechargeIntent(@Req() req: any, @Body() body: { productId: string }) {
    return this.service.createRechargeIntent(req.user.userId, body.productId);
  }

  @Post('webhook')
  async webhook(@Req() req: any, @Body() body: any, @Headers('creem-signature') signature: string) {
    console.log('=== CREEM WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Signature:', signature);
    console.log('Body type:', typeof body);
    console.log('Body content:', JSON.stringify(body, null, 2));
    console.log('=== WEBHOOK INFO END ===');

    // 检查是否有body内容
    if (!body) {
      console.error('Webhook请求缺少body内容');
      throw new BadRequestException('Missing webhook body');
    }

    // 检查是否是有效的Creem webhook格式
    if (!body.eventType && !body.type) {
      console.error('无效的webhook格式，缺少eventType或type字段');
      throw new BadRequestException('Invalid webhook format');
    }

    try {
      // 直接使用body作为event，因为Creem已经发送了JSON格式
      const event = body;
      console.log('处理webhook事件:', event.eventType || event.type);
      
      await this.service.handleWebhook(event);
      console.log('Webhook处理完成');
      return { received: true };
    } catch (err) {
      console.error('Webhook处理错误:', err.message);
      console.error('错误堆栈:', err.stack);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  transactions(@Req() req: any) {
    return this.service.transactions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bank-cards')
  bankCards(@Req() req: any) {
    return this.service.listCards(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bank-card')
  addCard(@Req() req: any, @Body() body: { cardNumber: string; holderName: string; bankName: string; phone: string }) {
    return this.service.addCard(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('bank-cards/:id')
  deleteCard(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.deleteCard(req.user.userId, id);
  }
}


