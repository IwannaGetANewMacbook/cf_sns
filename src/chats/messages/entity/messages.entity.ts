import { Column, Entity, ManyToOne } from 'typeorm';
import { ChatsModel } from 'src/chats/entity/chat.entity';
import { BaseModel } from 'src/common/entity/base.entity';
import { UsersModel } from 'src/users/entity/users.entity';
import { IsString } from 'class-validator';

@Entity()
export class MessagesModel extends BaseModel {
  // 여러개의 메시지가 하나의 채팅방에 연결되는 형태.
  @ManyToOne(() => ChatsModel, (chat) => chat.messages)
  chat: ChatsModel;

  @ManyToOne(() => UsersModel, (user) => user.messages)
  author: UsersModel;

  @Column()
  @IsString()
  message: string;
}
