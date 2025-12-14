import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { BusEntity } from "./bus.entity";

export enum SeatType {
  REGULAR = "regular",
  VIP = "vip",
  SLEEPER = "sleeper",
}

export enum SeatPosition {
  WINDOW = "window",
  AISLE = "aisle",
  MIDDLE = "middle",
}

@Entity("seat_layouts")
@Index(["bus", "seatNumber"], { unique: true })
export class SeatLayoutEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => BusEntity, (bus) => bus.seatLayouts, { onDelete: "CASCADE" })
  bus!: BusEntity;

  @Column()
  busId!: number;

  @Column({ type: "varchar", length: 10 })
  seatNumber!: string; // e.g., "1A", "2B", "12"

  @Column({ type: "integer" })
  row!: number; // Row number

  @Column({ type: "varchar", length: 1 })
  column!: string; // Column letter/number (A, B, C, etc.)

  @Column({ type: "enum", enum: SeatType, default: SeatType.REGULAR })
  seatType!: SeatType;

  @Column({ type: "enum", enum: SeatPosition, nullable: true })
  position?: SeatPosition;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  basePrice!: number; // Base price for this seat

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
