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
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [User, Order, Transaction, BankCard, Announcement, AdminLog],
        synchronize: false,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        extra: {
          max: 5,
          connectionTimeoutMillis: 30000,
          idleTimeoutMillis: 30000,
        },
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
