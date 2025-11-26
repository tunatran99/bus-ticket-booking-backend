import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RbacService } from '../rbac.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private rbac: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.userId) return false;
    return this.rbac.hasRoles(user.userId, required);
  }
}
