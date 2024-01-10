import { UsersService } from './../../users/users.service';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from '../auth.service';

@Injectable()
export class BearerTokenGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /** implements한 CanActivate 클래스의 canActivate 함수 오버라이드. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

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

    if (req.tokenType !== 'refresh') {
      throw new UnauthorizedException('401 Not Refresh Token');
    }

    return true;
  }
}
