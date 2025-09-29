import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Transaction, TransactionStatus, TransactionType } from '../../entities/transaction.entity';
import { BankCard } from '../../entities/bank-card.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Transaction) private readonly txRepo: Repository<Transaction>,
    @InjectRepository(BankCard) private readonly cardRepo: Repository<BankCard>
  ) {}

  async getInfo(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    return {
      balance: user.balance,
      frozenBalance: user.frozenBalance,
      points: {
        AIC: user.aicPoints,
        HH: user.hhPoints
      },
      frozenPoints: {
        AIC: user.frozenAicPoints,
        HH: user.frozenHhPoints
      }
    };
  }

  async recharge(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('金额需大于0');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    user.balance = Number(user.balance) + Number(amount);
    await this.userRepo.save(user);
    await this.txRepo.save(this.txRepo.create({
      userId,
      type: TransactionType.RECHARGE,
      status: TransactionStatus.COMPLETED,
      title: '钱包充值',
      amount,
      balanceAfter: user.balance
    }));
    return { balance: user.balance };
  }

  async transactions(userId: number) {
    return this.txRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async listCards(userId: number) {
    return this.cardRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async addCard(userId: number, data: { cardNumber: string; holderName: string; bankName: string; phone: string }) {
    const card = this.cardRepo.create({ ...data, userId });
    await this.cardRepo.save(card);
    return card;
  }

  async deleteCard(userId: number, id: number) {
    const card = await this.cardRepo.findOne({ where: { id, userId } });
    if (!card) throw new NotFoundException('银行卡不存在');
    await this.cardRepo.delete(id);
    return { success: true };
  }
}


