import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Order } from './order.entity';
import { Transaction } from './transaction.entity';
import { BankCard } from './bank-card.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'user',
    enum: ['user', 'admin']
  })
  role: string;

  @Column('decimal', { name: 'aic_points', precision: 10, scale: 4, default: 1000, transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) } })
  aicPoints: number;

  @Column('decimal', { name: 'hh_points', precision: 10, scale: 4, default: 1000, transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) } })
  hhPoints: number;

  @Column('decimal', { name: 'frozen_aic_points', precision: 10, scale: 4, default: 0, transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) } })
  frozenAicPoints: number;

  @Column('decimal', { name: 'frozen_hh_points', precision: 10, scale: 4, default: 0, transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) } })
  frozenHhPoints: number;

  @Column('decimal', { name: 'balance', precision: 10, scale: 2, default: 10000, transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) } })
  balance: number;

  @Column('decimal', { name: 'frozen_balance', precision: 10, scale: 2, default: 0, transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) } })
  frozenBalance: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => Order, order => order.seller)
  sellOrders: Order[];

  @OneToMany(() => Transaction, transaction => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => BankCard, bankCard => bankCard.user)
  bankCards: BankCard[];
}