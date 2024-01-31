import { PickType } from '@nestjs/mapped-types';
import { MessagesModel } from '../entity/messages.entity';
import { IsNumber } from 'class-validator';

export class createMessagesDto extends PickType(MessagesModel, ['message']) {
  @IsNumber()
  chatId: number;

  @IsNumber()
  authorId: number;
}
