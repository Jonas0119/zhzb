import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('bank_cards')
export class BankCard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'card_number' })
  cardNumber: string;

  @Column({ name: 'holder_name' })
  holderName: string;

  @Column({ name: 'bank_name' })
  bankName: string;

  @Column({ name: 'phone' })
  phone: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @ManyToOne(() => User, user => user.bankCards)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}