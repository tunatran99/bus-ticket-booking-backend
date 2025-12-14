import { Module } from "@nestjs/common";
import { AdminRoutesController } from "./admin-routes.controller";
import { AdminBusesController } from "./admin-buses.controller";
import { AdminTripsController } from "./admin-trips.controller";
import { RoutesModule } from "../routes/routes.module";
import { BusesModule } from "../buses/buses.module";
import { TripsModule } from "../trips/trips.module";
import { RbacModule } from "../rbac/rbac.module";

@Module({
  imports: [RoutesModule, BusesModule, TripsModule, RbacModule],
  controllers: [
    AdminRoutesController,
    AdminBusesController,
    AdminTripsController,
  ],
})
export class AdminModule {}
