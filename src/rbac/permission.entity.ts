import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { RoleEntity } from './role.entity';

@Entity('permissions')
export class PermissionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 120, unique: true })
  name!: string; // e.g. 'user.read', 'user.write'

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToMany(() => RoleEntity, (role) => role.permissions)
  roles?: RoleEntity[];
}
