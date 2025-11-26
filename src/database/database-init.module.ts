import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseInitService } from './database-init.service';
import { UserEntity } from '../users/user.entity';
import { RoleEntity } from '../rbac/role.entity';
import { PermissionEntity } from '../rbac/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity, PermissionEntity])],
  providers: [DatabaseInitService],
})
export class DatabaseInitModule {}