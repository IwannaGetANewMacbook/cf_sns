import { UsersService } from './../../users/users.service';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from '../auth.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/common/decorator/is-public.decorator';

@Injectable()
export class BearerTokenGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  /** implements한 CanActivate 클래스의 canActivate 함수 오버라이드. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // public annotation인지 아닌지 검증, public route면 바로 true 반환해서 가드를 패스시킴.
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest();

    if (isPublic) {
      // req 에 isRoutePublic 프로퍼티를 달아주어야 AccessTokenGuard 또는 RefreshTokenGuard 에서 검증을 안함.
      req.isRoutePublic = true;
      return true;
    }

    const rawToken = req.headers['authorization'];
    if (!rawToken) {
      throw new UnauthorizedException('401 Not Extant Token');
    }

    const token = this.authService.extractTokenFromHeader(rawToken, true);

    /** verifyToken() 함수의 return값은 Token의 Payload. */
    const result = await this.authService.verifyToken(token);

    /**
     * request 안에 넣을 정보
     * 1) 사용자 정보 - user
     * 2) token - 받아왔던 token값을 그래도 넣음.
     * 3) tokenType - accessToken 인지 refreshToken 인지
     */

    /**사용자 가져오기. */
    const user = await this.usersService.getUserByEmail(result.email);

    req.user = user;
    req.token = token;
    req.tokenType = result.type;

    return true;
  }
}

@Injectable()
export class AccessTokenGuard extends BearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const req = context.switchToHttp().getRequest();

    if (req.isRoutePublic) {
      return true;
    }

    if (req.tokenType !== 'access') {
      throw new UnauthorizedException('401 Not Access Token');
    }

    return true;
  }
}

@Injectable()
export class RefreshTokenGuard extends BearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const req = context.switchToHttp().getRequest();

    if (req.isRoutePublic) {
      return true;
    }

    if (req.tokenType !== 'refresh') {
      throw new UnauthorizedException('401 Not Refresh Token');
    }

    return true;
  }
}
