import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum OrderType {
  BUY = 'buy',
  SELL = 'sell'
}

export enum OrderStatus {
  PENDING = 'pending',        // 待付款（订单形成，但是未付款）
  PAID = 'paid',             // 待评价（付款后，但是没有评价）
  COMPLETED = 'completed',   // 已完成（评价完成）
  CANCELLED = 'cancelled',   // 已取消
  ACTIVE = 'active'          // 进行中（卖单专用）
}

export enum PointType {
  AIC = 'AIC',
  HH = 'HH'
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: OrderType
  })
  type: OrderType;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status: OrderStatus;

  @Column({
    name: 'point_type',
    type: 'enum',
    enum: PointType
  })
  pointType: PointType;

  @Column('decimal', { name: 'amount', precision: 10, scale: 4 })
  amount: number;

  @Column('decimal', { name: 'remaining_amount', precision: 10, scale: 4, nullable: true })
  remainingAmount: number;

  @Column('decimal', { name: 'unit_price', precision: 8, scale: 2 })
  unitPrice: number;

  @Column('decimal', { name: 'total_price', precision: 10, scale: 2 })
  totalPrice: number;

  @Column('decimal', { name: 'fee', precision: 8, scale: 2, default: 0 })
  fee: number;

  @Column({ name: 'seller_name', nullable: true })
  sellerName: string;

  @Column({ name: 'buyer_name', nullable: true })
  buyerName: string;

  @Column('text', { nullable: true })
  comment: string;

  @Column('int', { default: 5, nullable: true })
  rating: number;

  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, user => user.sellOrders, { nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column({ name: 'seller_id', nullable: true })
  sellerId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'paid_at', nullable: true })
  paidAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;
}