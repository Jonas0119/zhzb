import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Order } from '../../entities/order.entity';
import { Transaction } from '../../entities/transaction.entity';
import { Announcement } from '../../entities/announcement.entity';
import { AdminLog } from '../../entities/admin-log.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order, Transaction, Announcement, AdminLog])],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}


