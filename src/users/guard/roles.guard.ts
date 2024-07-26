import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';

/**
 * 메타데이터를 등록하는 기능 하나 만들고 메타데이터를 읽어내가지고 이 데이터로 원하는 작업을 실행하는 로직을 만들어야함.
 * 1. 메타데이터를 등록하는 기능 하나 만들어야 함.
 * 2. 메타데이터를 등록하는 기능은 roles.decorator.ts 파일에 정의.
 * 3. 메타데이러를 등록하는 기능을 만들면, 메타데이러르 읽어내가지고 이 데이터로 원하는 작업을 실행하는 로직을 만들어야 함.
 * 4. 원하는 작업을 실행하는 로직이 roles.guard.ts 임.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    /**
     * Roles annotation에 대한 metadata를 가져와야 함.
     *
     * Reflector 안에 있는 getAllAndOverride() 메소드 사용.
     * getAllAndOverride(ROLES_KEY) -> means, ROLES_KEY가 적용되어있는 모든 애노테이션중 API와 가장 가까운 애노테이션의 정보를 가져와서 override 해줌.
     * 여기서는 @Role() 데코레이터
     * 전부 외우는 코드.
     */
    const requiredRole = this.reflector.getAllAndOverride(ROLES_KEY, [
      //ROLES_KEY값 기준으로 metadata 가져올거.
      context.getHandler(),
      context.getClass(),
    ]);

    // 이 app전체에 글로벌하게 guard를 적용하기 위해서 해당 로직을 추가하는거.
    // 즉, @Roles() 애노테이션을 넣지않은 API에서는 bypass 시키기 위함.
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
