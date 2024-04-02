import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ChatsMessagesService } from './messages.service';
import { PaginateMassagesDto } from './dto/pagenate-messages.dto';

@Controller('chats/:cid/messages')
export class MessagesController {
  constructor(private readonly chatsMessagesService: ChatsMessagesService) {}

  @Get()
  paginateMessage(
    @Param('cid', ParseIntPipe) id: number,
    @Query() dto: PaginateMassagesDto,
  ) {
    return this.chatsMessagesService.paginateMessages(dto, {
      where: { chat: { id: id } },
      relations: { author: true, chat: true },
    });
  }
}
