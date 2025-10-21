import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderStatus, OrderType, PointType } from '../../entities/order.entity';
import { User } from '../../entities/user.entity';
import { Transaction, TransactionStatus, TransactionType } from '../../entities/transaction.entity';

interface SellDto {
  userId: number;
  pointType: PointType;
  amount: number;
  unitPrice: number;
}

interface BuyDto {
  userId: number;
  amount: number;
}

@Injectable()
export class MarketService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Transaction) private readonly txRepo: Repository<Transaction>,
    private readonly dataSource: DataSource
  ) {}

  private toNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  async listActive(pointType?: PointType) {
    const where: any = { status: OrderStatus.ACTIVE };
    if (pointType) where.pointType = pointType;
    return this.orderRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async sell(dto: SellDto) {
    console.log('Sell DTO:', dto);
    
    // 使用事务确保数据一致性
    return await this.dataSource.transaction(async (manager) => {
      // 使用悲观锁防止并发修改
      const user = await manager.findOne(User, { 
        where: { id: dto.userId },
        lock: { mode: 'pessimistic_write' }
      });
      
      if (!user) throw new NotFoundException('用户不存在');
      
      console.log('User before update:', {
        id: user.id,
        aicPoints: user.aicPoints,
        hhPoints: user.hhPoints,
        frozenAicPoints: user.frozenAicPoints,
        frozenHhPoints: user.frozenHhPoints
      });
      
      const available = dto.pointType === PointType.AIC ? this.toNumber(user.aicPoints) : this.toNumber(user.hhPoints);
      if (available < dto.amount) throw new BadRequestException('积分不足');

      // 冻结积分
      if (dto.pointType === PointType.AIC) {
        user.aicPoints = this.toNumber(user.aicPoints) - dto.amount;
        user.frozenAicPoints = this.toNumber(user.frozenAicPoints) + dto.amount;
      } else {
        user.hhPoints = this.toNumber(user.hhPoints) - dto.amount;
        user.frozenHhPoints = this.toNumber(user.frozenHhPoints) + dto.amount;
      }
      
      console.log('User after calculation:', {
        id: user.id,
        aicPoints: user.aicPoints,
        hhPoints: user.hhPoints,
        frozenAicPoints: user.frozenAicPoints,
        frozenHhPoints: user.frozenHhPoints
      });
      
      await manager.save(user);

      const order = manager.create(Order, {
        type: OrderType.SELL,
        status: OrderStatus.ACTIVE,
        pointType: dto.pointType,
        amount: dto.amount,
        remainingAmount: dto.amount,
        unitPrice: dto.unitPrice,
        totalPrice: Number((dto.amount * dto.unitPrice).toFixed(2)),
        sellerId: dto.userId,
        sellerName: user.username,
        userId: dto.userId
      });
      
      console.log('Creating order at:', new Date().toISOString());
      console.log('Current timezone offset:', new Date().getTimezoneOffset());
      
      const savedOrder = await manager.save(order);
      console.log('Order saved with createdAt:', savedOrder.createdAt);
      console.log('Order createdAt ISO:', savedOrder.createdAt.toISOString());
      
      return savedOrder;
    });
  }

  async buy(orderId: number, dto: BuyDto) {
    // 使用事务和悲观锁确保并发安全
    return await this.dataSource.transaction(async (manager) => {
      // 1. 锁定订单，防止超卖
      const order = await manager.findOne(Order, { 
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' }
      });
      
      if (!order || order.status !== OrderStatus.ACTIVE) {
        throw new NotFoundException('订单不可购买');
      }
      
      if (this.toNumber(order.remainingAmount) < dto.amount) {
        throw new BadRequestException('订单剩余数量不足');
      }

      // 2. 锁定买家账户
      const buyer = await manager.findOne(User, { 
        where: { id: dto.userId },
        lock: { mode: 'pessimistic_write' }
      });
      
      if (!buyer) throw new NotFoundException('买家不存在');

      // 3. 计算费用
      const cost = Number((dto.amount * Number(order.unitPrice)).toFixed(2));
      const fee = Number((cost * 0.003).toFixed(2));
      const finalPay = cost + fee;
      
      if (this.toNumber(buyer.balance) < finalPay) {
        throw new BadRequestException('余额不足');
      }

      // 4. 锁定卖家账户
      const seller = await manager.findOne(User, { 
        where: { id: order.sellerId },
        lock: { mode: 'pessimistic_write' }
      });
      
      if (!seller) throw new NotFoundException('卖家不存在');

      // 5. 扣买家余额
      buyer.balance = this.toNumber(buyer.balance) - finalPay;
      
      // 6. 给买家增加积分
      if (order.pointType === PointType.AIC) {
        buyer.aicPoints = this.toNumber(buyer.aicPoints) + dto.amount;
      } else {
        buyer.hhPoints = this.toNumber(buyer.hhPoints) + dto.amount;
      }
      await manager.save(buyer);

      // 7. 卖家减少冻结积分，增加余额（扣手续费）
      if (order.pointType === PointType.AIC) {
        seller.frozenAicPoints = this.toNumber(seller.frozenAicPoints) - dto.amount;
      } else {
        seller.frozenHhPoints = this.toNumber(seller.frozenHhPoints) - dto.amount;
      }
      seller.balance = this.toNumber(seller.balance) + (cost - fee);
      await manager.save(seller);

      // 8. 更新卖单
      order.remainingAmount = Number((this.toNumber(order.remainingAmount) - dto.amount).toFixed(4));
      if (order.remainingAmount === 0) {
        order.status = OrderStatus.COMPLETED;
        order.completedAt = new Date();
      }
      await manager.save(order);

      // 9. 为买家创建购买订单
      const buyOrder = manager.create(Order, {
        type: OrderType.BUY,
        userId: buyer.id,
        sellerId: seller.id,
        pointType: order.pointType,
        amount: dto.amount,
        remainingAmount: dto.amount,
        unitPrice: order.unitPrice,
        totalPrice: cost,
        fee: fee,
        sellerName: seller.username,
        buyerName: buyer.username,
        status: OrderStatus.PAID,
        paidAt: new Date()
      });
      await manager.save(buyOrder);

      // 10. 记录交易流水
      await manager.save(Transaction, manager.create(Transaction, {
        userId: buyer.id,
        type: TransactionType.BUY,
        status: TransactionStatus.COMPLETED,
        title: '购买积分',
        amount: finalPay,
        balanceAfter: buyer.balance,
        relatedOrderId: order.id
      }));

      await manager.save(Transaction, manager.create(Transaction, {
        userId: seller.id,
        type: TransactionType.SELL,
        status: TransactionStatus.COMPLETED,
        title: '卖出积分',
        amount: cost - fee,
        balanceAfter: seller.balance,
        relatedOrderId: order.id
      }));

      await manager.save(Transaction, manager.create(Transaction, {
        userId: seller.id,
        type: TransactionType.FEE,
        status: TransactionStatus.COMPLETED,
        title: '交易手续费',
        amount: fee,
        balanceAfter: seller.balance,
        relatedOrderId: order.id
      }));

      return { orderId: order.id, cost, fee, finalPay, remainingAmount: order.remainingAmount };
    });
  }

  async cancel(orderId: number, userId: number) {
    // 使用事务确保取消操作的原子性
    return await this.dataSource.transaction(async (manager) => {
      // 锁定订单
      const order = await manager.findOne(Order, { 
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' }
      });
      
      if (!order || order.status !== OrderStatus.ACTIVE) {
        throw new BadRequestException('订单不可取消');
      }
      
      if (order.sellerId !== userId) {
        throw new BadRequestException('无权取消该订单');
      }

      // 锁定卖家账户
      const seller = await manager.findOne(User, { 
        where: { id: userId },
        lock: { mode: 'pessimistic_write' }
      });
      
      if (!seller) throw new NotFoundException('用户不存在');

      // 解冻积分
      const unfreeze = this.toNumber(order.remainingAmount || 0);
      if (order.pointType === PointType.AIC) {
        seller.frozenAicPoints = this.toNumber(seller.frozenAicPoints) - unfreeze;
        seller.aicPoints = this.toNumber(seller.aicPoints) + unfreeze;
      } else {
        seller.frozenHhPoints = this.toNumber(seller.frozenHhPoints) - unfreeze;
        seller.hhPoints = this.toNumber(seller.hhPoints) + unfreeze;
      }
      await manager.save(seller);
      
      // 更新订单状态
      order.status = OrderStatus.CANCELLED;
      await manager.save(order);
      
      return { success: true, unfreeze };
    });
  }

  async myOrders(userId: number) {
    return this.orderRepo.find({ 
      where: { userId }, // 我拥有的所有订单（包括卖单和买单）
      order: { createdAt: 'DESC' } 
    });
  }

  async getOrderDetail(orderId: number, userId: number) {
    const order = await this.orderRepo.findOne({ 
      where: { id: orderId, userId } // 只能查看自己的订单
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    return order;
  }

  async review(orderId: number, userId: number, dto: { rating: number; comment?: string }) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== OrderStatus.PAID) throw new BadRequestException('订单状态不正确，无法评价');
    if (order.userId !== userId) throw new BadRequestException('只能评价自己的订单');

    // 更新订单评价信息
    order.rating = dto.rating;
    order.comment = dto.comment || '';
    order.status = OrderStatus.COMPLETED; // 评价后订单完成
    order.completedAt = new Date(); // 记录完成时间
    await this.orderRepo.save(order);

    return { success: true, message: '评价成功' };
  }
}


