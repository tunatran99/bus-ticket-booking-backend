import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutesService } from './routes.service';
import { RouteEntity } from './route.entity';
import { RouteStopEntity } from './route-stop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RouteEntity, RouteStopEntity])],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RoutesModule {}


