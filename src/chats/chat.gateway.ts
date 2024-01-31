/* eslint-disable @typescript-eslint/no-unused-vars */
/** Socket.IO가 연결하게 되는 곳을 Gateway 라고 부름. */

import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
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

@WebSocketGateway({
  // ws://localhost:3000/chats
  namespace: 'chats',
})
export class ChatsGateway implements OnGatewayConnection {
  constructor(
    private readonly chtasService: ChatsService,
    private readonly chatsMessagesService: ChatsMessagesService,
  ) {}
  // 서버 가 socket에 message를 보내고 싶을 때 @WebSocketServer() 애노테이션 해줌.
  @WebSocketServer()
  server: Server;
  // handleConnection() 함수는 소켓이 연결되었을 때 실행된다.
  // (쌩 socket.io 코드의 io.on("connection", () => {})  에 해당.)
  handleConnection(socket: Socket) {
    console.log(`on connect called : ${socket.id}`);
  }

  @SubscribeMessage('enter_chat')
  // 방의 chat ID들을 리스트로 받는다.
  async enterChat(
    @MessageBody() data: EnterChatDto,
    @ConnectedSocket() socket: Socket,
  ) {
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

    socket.join(data.chatIds.map((v) => v.toString()));
  }

  /**채팅방을 만드는 함수 */
  @SubscribeMessage('create_chat')
  async createChat(
    @MessageBody() data: CreateChatDto,
    @ConnectedSocket() socket: Socket,
  ) {
    const chat = await this.chtasService.createChat(data);
  }

  // socket.on('send_message', (message) => {consol.log(message)}))
  @SubscribeMessage('send_message') // 파라미터에 이벤트 이름 넣어주면 됨.
  // 이벤트 이름을 클래스로 정의.
  async sendMessage(
    @MessageBody() dto: createMessagesDto,
    @ConnectedSocket() socket: Socket,
  ) {
    const chatExists = await this.chtasService.checkIfChatExists(dto.chatId);
    if (!chatExists) {
      throw new WsException(
        `존재하지 않는 채팅방입니다. Chat ID: ${dto.chatId}`,
      );
    }

    const message = await this.chatsMessagesService.createMessage(dto);

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
