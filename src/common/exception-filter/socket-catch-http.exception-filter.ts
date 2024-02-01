import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

/** WebSocket 관련 exception인 'BaseWsExceptionFilter'를 extends 해서 웹소켓 전용 exception filter 만듦. */
@Catch(HttpException)
export class SocketCatchHttpExceptionFilter extends BaseWsExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const socket = host.switchToWs().getClient();

    socket.emit('exception', { data: exception.getResponse() });
  }
}
