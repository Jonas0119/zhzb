import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum TransactionType {
  RECHARGE = 'recharge',     // 充值
  WITHDRAW = 'withdraw',     // 提现
  BUY = 'buy',              // 购买积分
  SELL = 'sell',            // 卖出积分
  FEE = 'fee'               // 手续费
}

export enum TransactionStatus {
  PENDING = 'pending',       // 处理中
  COMPLETED = 'completed',   // 已完成
  FAILED = 'failed'          // 失败
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: TransactionType
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED
  })
  status: TransactionStatus;

  @Column()
  title: string;

  @Column('decimal', { name: 'amount', precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { name: 'balance_after', precision: 10, scale: 2 })
  balanceAfter: number;

  @Column('text', { nullable: true })
  description: string;

  @Column({ name: 'related_order_id', nullable: true })
  relatedOrderId: number;

  @ManyToOne(() => User, user => user.transactions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}