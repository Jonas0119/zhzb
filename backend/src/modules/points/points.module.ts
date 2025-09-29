import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [PointsController],
  providers: [PointsService]
})
export class PointsModule {}


