import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    /**
     * Roles annotation에 대한 metadata를 가져와야 함.
     *
     * Reflector 안에 있는 getAllAndOverride() 메소드 사용.
     * 전부 외우는 코드.
     */
    const requiredRole = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Roles Annotation이 등록 안되어 있을 때, which means 서버에서 접근제어가 불필요하다고 판단하는 API임.
    if (!requiredRole) {
      return true; // 이 guard를 패스함.
    }

    // 사용자 가져옴.
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new UnauthorizedException(`토큰을 제공 해주세요.`);
    }

    if (user.role !== requiredRole) {
      throw new ForbiddenException(
        `이 작업을 수행할 권한이 없음. ${requiredRole} 권한이 필요함.`,
      );
    }

    return true;
  }
}
