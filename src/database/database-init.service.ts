import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { RoleEntity } from '../rbac/role.entity';
import { PermissionEntity } from '../rbac/permission.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(RoleEntity) private readonly roles: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity) private readonly permissions: Repository<PermissionEntity>,
  ) {}

  async onModuleInit() {
    await this.seedRolesAndPermissions();
    await this.seedAdminUser();
  }

  private async seedRolesAndPermissions() {
    const roleNames = ['admin', 'passenger', 'support'];
    for (const name of roleNames) {
      const exists = await this.roles.findOne({ where: { name } });
      if (!exists) {
        await this.roles.save(this.roles.create({ name, description: `${name} role` }));
        this.logger.log(`Created role: ${name}`);
      }
    }

    const permissionKeys = [
      'user.read',
      'user.write',
      'ticket.read',
      'ticket.write',
      'dashboard.view',
    ];
    for (const key of permissionKeys) {
      const exists = await this.permissions.findOne({ where: { name: key } });
      if (!exists) {
        await this.permissions.save(this.permissions.create({ name: key, description: `Permission ${key}` }));
        this.logger.log(`Created permission: ${key}`);
      }
    }

    // Link admin role to all permissions
    const adminRole = await this.roles.findOne({ where: { name: 'admin' }, relations: ['permissions'] });
    const allPerms = await this.permissions.find();
    if (adminRole) {
      const missing = allPerms.filter(p => !adminRole.permissions?.some(ep => ep.id === p.id));
      if (missing.length) {
        adminRole.permissions = [...(adminRole.permissions || []), ...missing];
        await this.roles.save(adminRole);
        this.logger.log(`Linked ${missing.length} new permissions to admin role.`);
      }
    }
  }

  private async seedAdminUser() {
    const adminEmail = 'admin@example.com';
    let admin = await this.users.findOne({ where: { email: adminEmail }, relations: ['roles'] });
    if (!admin) {
      const hashed = await bcrypt.hash('Admin123!', 10);
      const adminRole = await this.roles.findOne({ where: { name: 'admin' } });
      admin = this.users.create({
        user_id: `usr_admin_${Date.now()}`,
        email: adminEmail,
        full_name: 'System Administrator',
        password: hashed,
        role: 'admin', // legacy field
        status: 'active',
        roles: adminRole ? [adminRole] : [],
      });
      await this.users.save(admin);
      this.logger.log('Created initial admin user');
    } else if (!admin.roles?.length) {
      const adminRole = await this.roles.findOne({ where: { name: 'admin' } });
      if (adminRole) {
        admin.roles = [adminRole];
        await this.users.save(admin);
        this.logger.log('Attached admin role to existing admin user');
      }
    }
  }
}