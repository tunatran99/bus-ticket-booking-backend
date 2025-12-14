import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TripsService } from "./trips.service";
import { TripsController } from "./trips.controller";
import { TripEntity } from "./trip.entity";
import { BusEntity } from "../buses/bus.entity";
import { RouteEntity } from "../routes/route.entity";

@Module({
  imports: [TypeOrmModule.forFeature([TripEntity, BusEntity, RouteEntity])],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
