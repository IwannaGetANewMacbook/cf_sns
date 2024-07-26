import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatsModel } from './entity/chat.entity';
import { Repository } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { CommonService } from 'src/common/common.service';
import { PaginateChatDto } from './dto/paginate-chat.dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatsModel)
    private readonly chatsRepository: Repository<ChatsModel>,
    private readonly commonService: CommonService,
  ) {}

  paginateChats(dto: PaginateChatDto) {
    return this.commonService.paginate(
      dto,
      this.chatsRepository,
      { relations: { users: true } },
      'chats',
    );
  }

  // 채팅방 만들기.
  async createChat(dto: CreateChatDto) {
    const chat = await this.chatsRepository.save({
      // e.g. 3명의 사용자의 id가 각각 1, 2, 3 이라면 => [{id:1}, {id:2}, {id:3}] 이렇게 넣어줌.
      users: dto.userIds.map((v) => {
        return { id: v };
      }),
    });
    return this.chatsRepository.findOne({
      where: {
        id: chat.id,
      },
    });
  }

  async checkIfChatExists(chatId: number) {
    const exists = await this.chatsRepository.exist({
      where: {
        id: chatId,
      },
    });
    return exists;
  }
}
