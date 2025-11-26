import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { RoleEntity } from '../rbac/role.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  user_id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 30, nullable: true, unique: true })
  phone: string | null = null;

  @Column({ type: 'varchar', length: 255 })
  full_name!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 50 })
  role!: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @Column({ type: 'datetime', nullable: true })
  last_login_at: Date | null = null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToMany(() => RoleEntity, (role) => role.users, { cascade: false })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'user_id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles?: RoleEntity[];
}
