import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { PermissionEntity } from './permission.entity';
import { UserEntity } from '../users/user.entity';

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToMany(() => PermissionEntity, (perm) => perm.roles, { cascade: false })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions?: PermissionEntity[];

  @ManyToMany(() => UserEntity, (user) => user.roles)
  users?: UserEntity[];
}
