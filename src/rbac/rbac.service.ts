import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { RoleEntity } from './role.entity';
import { PermissionEntity } from './permission.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(RoleEntity) private readonly roles: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity) private readonly perms: Repository<PermissionEntity>,
  ) {}

  async getUserRoles(userId: string): Promise<string[]> {
    const user = await this.users.findOne({ where: { user_id: userId }, relations: ['roles'] });
    if (!user) return [];
    const relationRoles = user.roles?.map(r => r.name) || [];
    // legacy single role column fallback
    return Array.from(new Set([user.role, ...relationRoles].filter(Boolean)));
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.users.findOne({ where: { user_id: userId }, relations: ['roles', 'roles.permissions'] });
    if (!user) return [];
    const permissions = (user.roles || []).flatMap(r => r.permissions || []).map(p => p.name);
    return Array.from(new Set(permissions));
  }

  async hasRoles(userId: string, required: string[]): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return required.every(r => roles.includes(r));
  }

  async hasPermissions(userId: string, required: string[]): Promise<boolean> {
    const perms = await this.getUserPermissions(userId);
    return required.every(p => perms.includes(p));
  }
}
