/* eslint-disable @typescript-eslint/no-unused-vars */
/** Socket.IO가 연결하게 되는 곳을 Gateway 라고 부름. */

import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatsService } from './chats.service';
import { EnterChatDto } from './dto/enter-chat.dto';
import { createMessagesDto } from './messages/dto/create-messages.dto';
import { ChatsMessagesService } from './messages/messages.service';
import {
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SocketCatchHttpExceptionFilter } from 'src/common/exception-filter/socket-catch-http.exception-filter';
import { SocketBearerTokenGuard } from 'src/auth/guard/socket/socket-bearer-token.guard';
import { UsersModel } from 'src/users/entity/users.entity';
import { UsersService } from 'src/users/users.service';
import { AuthService } from 'src/auth/auth.service';

/**
 * ValidationPipe를 이전에 글로벌하게 적용하였지만 왜인지 모르게 Gateway단에서는 적용이 안됨.
 * 그래서 REST API 들과는 별게로 Gateway단에서도 한 번 더 직접 파이프를 적용해주어야 함.
 */
@UsePipes(
  new ValidationPipe({
    /** dto파일안에서 기본값으로 지정한 property들을 controller에서도 똑같이 적용하게 하게 하기 위함.*/
    transform: true,
    transformOptions: {
      // class-validator Anotation에 적용된 타입으로 class-transformer가 자동으로 해당 property 타입을 변환해줌.
      enableImplicitConversion: true,
    },
    /**
     * 이 옵션이 true가 되면은 validator가 지금 현재 validation이 적용되지
     * 않은 모든 property들을 삭제할것.
     */
    whitelist: true,
    /** whitelist가 true일 경우 stripping을 하는 대신 error를 던짐. */
    forbidNonWhitelisted: true,
  }),
)
@UseFilters(SocketCatchHttpExceptionFilter)
@WebSocketGateway({
  // ws://localhost:3000/chats
  namespace: 'chats',
})
export class ChatsGateway
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
  constructor(
    private readonly chtasService: ChatsService,
    private readonly chatsMessagesService: ChatsMessagesService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  // 서버 가 socket에 message를 보내고 싶을 때 @WebSocketServer() 애노테이션 해줌.
  @WebSocketServer()
  server: Server;

  // OnGatewayInit implements 시 사용할 수 있는 함수 - gateway가 시작되었을 때 특정함수나 로직을 실행하고 싶을 때 사용.
  afterInit(server: Server) {
    console.log(`after gateway init`);
  }

  // OnGatewayDisconnect implements 시 사용할 수 있는 함수 - 소켓의 연결이 끊어졌을 때 실행.
  handleDisconnect(socket: Socket & { user: UsersModel }) {
    console.log(`on disconnect called : ${socket.user.email}`);
  }

  // handleConnection() 함수는 소켓이 연결되었을 때 실행된다. (OnGatewayConnection Implements 시 사용가능한 함수.)
  // (쌩 socket.io 코드의 io.on("connection", () => {})  에 해당.)
  // handleConnection() 함수 안에서 사용자 정보를 입력해주면 소켓이 연결되어있는 동안은 사용자 그 소켓의 사용자 정보가 쭉 지속됨.
  async handleConnection(socket: Socket & { user: UsersModel }) {
    // req헤더 가져오기
    const header = socket.handshake.headers;

    // rawToken 가져오기(Bearer xxxxxxx)
    const rawToken = header['authorization'];
    if (!rawToken) {
      socket.disconnect();
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

      console.log(`on connect called : ${socket.user.email}`);
      // canActivate() 함수 리턴값은 boolean
      return true;
    } catch (e) {
      socket.disconnect();
    }
  }

  /**--------------------------------------------------------------------------------- */

  /**채팅방을 만드는 함수 */
  @SubscribeMessage('create_chat')
  async createChat(
    @MessageBody() data: CreateChatDto,
    @ConnectedSocket() socket: Socket & { user: UsersModel }, // socket 객체안에 socket.user 가 존재해야 소켓 연결.,
  ) {
    const chat = await this.chtasService.createChat(data);
  }

  /**--------------------------------------------------------------------------------- */

  /** 유저가 채팅방에 들어가기 위한 함수. */
  @SubscribeMessage('enter_chat')
  async enterChat(
    // 방의 chat ID들을 리스트로 받는다.
    @MessageBody() data: EnterChatDto,
    // 지금 연결된 소켓들 정보 가져오기.
    @ConnectedSocket() socket: Socket & { user: UsersModel },
  ) {
    /** 채팅방이 존재하는지 check. */
    for (const chatId of data.chatIds) {
      const exists = await this.chtasService.checkIfChatExists(chatId);
      if (!exists) {
        // 자동으로 'exception' 이라는 이벤트로 에러가 던져짐.
        // 그래서 'exception'이벤트를 listening 하고 있어야 함.
        throw new WsException({
          code: 100,
          meassage: `It is a chat room that doesn't exist chat id: ${chatId}`,
        });
      }
    }

    // sokcet.join() 함수는 params로 list를 받아도 list값을 각각 방에 join 해줌.
    socket.join(data.chatIds.map((v) => v.toString()));
  }

  /**--------------------------------------------------------------------------------- */

  // socket.on('send_message', (message) => {consol.log(message)}))
  @SubscribeMessage('send_message') // 파라미터에 이벤트 이름 넣어주면 됨.
  // 이벤트 이름을 클래스로 정의.
  async sendMessage(
    @MessageBody() dto: createMessagesDto,
    @ConnectedSocket() socket: Socket & { user: UsersModel },
  ) {
    const chatExists = await this.chtasService.checkIfChatExists(dto.chatId);
    if (!chatExists) {
      throw new WsException(
        `존재하지 않는 채팅방입니다. Chat ID: ${dto.chatId}`,
      );
    }

    const message = await this.chatsMessagesService.createMessage(
      dto,
      socket.user.id,
    );

    /**나를 제외한 room 안의 모든 socket들한테 broadcasting 하기 */
    socket
      .to(message.chat.id.toString())
      .emit('receive_message', message.message);

    /** 나를 포함한 room 안의 모든 socket들한테 emit 하기 */
    // this.server
    //   .in(message.chatId.toString()) // 해당되는 chat id가 있는 room에다가만 메시지를 보낼 수 있다.
    //   .emit(
    //     'receive_message',
    //     `ID: ${socket} send the message: ${message.message} room number: ${message.chatId}`,
    //   );
  }
}
