import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Transaction } from '../../entities/transaction.entity';
import { BankCard } from '../../entities/bank-card.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Transaction, BankCard])],
  controllers: [WalletController],
  providers: [WalletService]
})
export class WalletModule {}


