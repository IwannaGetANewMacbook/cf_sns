/**
 * 구현할 기능
 *
 * 1) 요청객체 (request)를 불러오고 authorization header로부터 Token을 가져옴.
 *
 * 2) authService.extractTokenFromHeader를 이용해서 사용할 수 있는 형태의 Token을 추출함.
 *
 * 3) authService.decodeBasicToken을 실행해서 email 과 password를 추출.
 *
 * 4) email과 password를 이용해서 사용자를 가져옴.
 *
 * 5) 찾아낸 사용자를 (1) 요청 객체에 붙여줌.
 *    req.user = user;
 *
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class BasicTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  /** implements한 CanActivate 클래스의 canActivate 함수 오버라이드. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    /**해당 route에 요청이 들어왔을 때 그 요청객체를 가져옴. */
    const req = context.switchToHttp().getRequest();

    const rawToken = req.headers['authorization'];
    if (!rawToken) {
      throw new UnauthorizedException('401 Not Extant Token');
    }

    const token = this.authService.extractTokenFromHeader(rawToken, false);

    const { email, password } = this.authService.decodeBasicToken(token);

    const user = await this.authService.authenticateWithEmailAndPassword({
      email: email,
      password: password,
    });

    /** req객체는 라우터에서 요청이 끝날때까지 계속 살아있음! */
    req.user = user;

    return true;
  }
}
