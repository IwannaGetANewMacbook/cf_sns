import { UsersService } from './../../../users/users.service';
import { WsException } from '@nestjs/websockets';
import { AuthService } from './../../auth.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class SocketBearerTokenGuard implements CanActivate {
  // 토큰검증을 할 때 필요한 authService
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 연결된 소켓 객체 가져오가
    const socket = context.switchToWs().getClient();

    // req헤더 가져오기
    const header = socket.handshake.headers;

    // rawToken 가져오기(Bearer xxxxxxx)
    const rawToken = header['authorization'];
    if (!rawToken) {
      throw new WsException('401 Not Extant Token');
    }

    try {
      // 실제 토큰 가져오가(bearer xxxxxxx 에서 bearer 제거된 토큰)
      const token = this.authService.extractTokenFromHeader(rawToken, true);

      // payload 가져오기
      const payload = this.authService.verifyToken(token);

      // user 가져오기
      const user = await this.usersService.getUserByEmail(payload.email);

      // 연결된 socket에 user객체 달아주기
      socket.user = user;
      socket.token = token;
      socket.tokenType = payload.tokenType;

      // canActivate() 함수 리턴값은 boolean
      return true;
    } catch (e) {
      throw new WsException('401 Not Extant Token');
    }
  }
}
