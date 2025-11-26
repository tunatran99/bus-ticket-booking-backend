import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { UsersModule } from '../users/users.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [UsersModule, RbacModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
