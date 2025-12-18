import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { UsersModule } from "../users/users.module";
import { RbacModule } from "../rbac/rbac.module";
import { BookingsModule } from "../bookings/bookings.module";

@Module({
  imports: [UsersModule, RbacModule, BookingsModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
