import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusesService } from './buses.service';
import { BusEntity } from './bus.entity';
import { SeatLayoutEntity } from './seat-layout.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BusEntity, SeatLayoutEntity])],
  providers: [BusesService],
  exports: [BusesService],
})
export class BusesModule {}


