import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { RouteEntity } from "./route.entity";

@Entity("route_stops")
@Index(["route", "order"], { unique: true })
export class RouteStopEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => RouteEntity, (route) => route.stops, { onDelete: "CASCADE" })
  route!: RouteEntity;

  @Column()
  routeId!: number;

  @Column({ type: "varchar", length: 255 })
  locationName!: string; // e.g., "Bến xe Miền Đông"

  @Column({ type: "varchar", length: 255, nullable: true })
  address?: string;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ type: "integer" })
  order!: number; // Order of stop in the route (0, 1, 2, ...)

  @Column({ type: "integer", default: 0 })
  minutesFromStart!: number; // Minutes from route start

  @Column({ type: "boolean", default: true })
  isPickup!: boolean; // Can passengers board here

  @Column({ type: "boolean", default: true })
  isDropoff!: boolean; // Can passengers alight here

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
