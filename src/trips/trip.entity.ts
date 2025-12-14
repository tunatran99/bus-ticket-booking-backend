import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { RouteEntity } from "../routes/route.entity";
import { BusEntity } from "../buses/bus.entity";

export enum TripStatus {
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

@Entity("trips")
@Index(["bus", "departureTime"], { unique: false })
@Index(["route", "departureTime"])
export class TripEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => RouteEntity, (route) => route.trips)
  route!: RouteEntity;

  @Column()
  routeId!: number;

  @ManyToOne(() => BusEntity, (bus) => bus.trips)
  bus!: BusEntity;

  @Column()
  busId!: number;

  @Column({ type: "timestamp" })
  departureTime!: Date;

  @Column({ type: "timestamp", nullable: true })
  arrivalTime?: Date; // Calculated based on route duration

  @Column({ type: "enum", enum: TripStatus, default: TripStatus.SCHEDULED })
  status!: TripStatus;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  basePrice!: number; // Base price for this trip

  @Column({ type: "integer", default: 0 })
  availableSeats!: number; // Updated when bookings are made

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
