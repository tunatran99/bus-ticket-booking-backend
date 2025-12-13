import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SeatLayoutEntity } from './seat-layout.entity';
import { TripEntity } from '../trips/trip.entity';

@Entity('buses')
@Index(['licensePlate'], { unique: true })
export class BusEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  licensePlate!: string; // e.g., "29A-12345"

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand?: string; // e.g., "Mercedes", "Hyundai"

  @Column({ type: 'varchar', length: 100, nullable: true })
  model?: string;

  @Column({ type: 'integer' })
  totalSeats!: number;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string; // active, maintenance, retired

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => SeatLayoutEntity, (layout) => layout.bus, { cascade: true, eager: true })
  seatLayouts!: SeatLayoutEntity[];

  @OneToMany(() => TripEntity, (trip) => trip.bus)
  trips!: TripEntity[];
}

