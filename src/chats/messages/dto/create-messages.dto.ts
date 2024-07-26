import { PickType } from '@nestjs/mapped-types';
import { MessagesModel } from '../entity/messages.entity';
import { IsNumber } from 'class-validator';

export class createMessagesDto extends PickType(MessagesModel, ['message']) {
  @IsNumber()
  /** 채팅방 Id */
  chatId: number;
}
