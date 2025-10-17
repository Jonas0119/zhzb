import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Transaction } from '../../entities/transaction.entity';
import { BankCard } from '../../entities/bank-card.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Creem } from 'creem';

@Module({
  imports: [TypeOrmModule.forFeature([User, Transaction, BankCard])],
  controllers: [WalletController],
  providers: [WalletService, {
    provide: 'CREEM_API_KEY',
    useValue: process.env.CREEM_SECRET_KEY || ''
  }]
})
export class WalletModule {}


