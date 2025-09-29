import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Order } from './entities/order.entity';
import { Transaction } from './entities/transaction.entity';
import { BankCard } from './entities/bank-card.entity';
import { Announcement } from './entities/announcement.entity';
import { AdminLog } from './entities/admin-log.entity';
import { AuthModule } from './modules/auth/auth.module';
import { AnnouncementModule } from './modules/announcement/announcement.module';
import { MarketModule } from './modules/market/market.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PointsModule } from './modules/points/points.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'Tjfae@123',
        database: process.env.DB_NAME || 'zhzb',
        entities: [User, Order, Transaction, BankCard, Announcement, AdminLog],
        synchronize: false,
        timezone: '+08:00',
        charset: 'utf8mb4',
        extra: {
          charset: 'utf8mb4_unicode_ci'
        },
        url: `mysql://${process.env.DB_USER || 'root'}:${process.env.DB_PASS || 'Tjfae@123'}@${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '3306'}/${process.env.DB_NAME || 'zhzb'}?charset=utf8mb4&timezone=+08:00`
      })
    }),
    TypeOrmModule.forFeature([User, Order, Transaction, BankCard, Announcement, AdminLog]),
    AuthModule,
    AnnouncementModule,
    MarketModule,
    WalletModule,
    PointsModule,
    AdminModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
