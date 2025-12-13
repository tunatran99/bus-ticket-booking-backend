import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RouteStopEntity } from './route-stop.entity';
import { TripEntity } from '../trips/trip.entity';

@Entity('routes')
export class RouteEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string; // e.g., "Hà Nội - Hồ Chí Minh"

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ type: 'integer', default: 0 })
  distance!: number; // in kilometers

  @Column({ type: 'integer', default: 0 })
  estimatedDuration!: number; // in minutes

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => RouteStopEntity, (stop) => stop.route, { cascade: true, eager: true })
  stops!: RouteStopEntity[];

  @OneToMany(() => TripEntity, (trip) => trip.route)
  trips!: TripEntity[];
}

