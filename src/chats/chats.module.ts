import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsModel } from './entity/chat.entity';
import { CommonModule } from 'src/common/common.module';
import { ChatsMessagesService } from './messages/messages.service';
import { MessagesModel } from './messages/entity/messages.entity';
import { MessagesController } from './messages/messages.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatsModel, MessagesModel]),
    CommonModule,
  ],
  controllers: [ChatsController, MessagesController],
  providers: [ChatsService, ChatsGateway, ChatsMessagesService],
})
export class ChatsModule {}
