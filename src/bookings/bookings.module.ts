import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { BookingsService } from "./bookings.service";
import { BookingsController } from "./bookings.controller";
import { SeatLocksService } from "./seat-locks.service";

@Module({
  imports: [AuthModule],
  providers: [BookingsService, SeatLocksService],
  controllers: [BookingsController],
})
export class BookingsModule {}
