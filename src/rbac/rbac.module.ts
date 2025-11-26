import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/user.entity';
import { RoleEntity } from './role.entity';
import { PermissionEntity } from './permission.entity';
import { RbacService } from './rbac.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity, PermissionEntity])],
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule {}
