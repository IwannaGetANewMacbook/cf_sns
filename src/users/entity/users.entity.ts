/**
 * enum: 특정한 값들이 지정되어 있고 이 값들만 존재할 수 있다고 했을 때 유용함.
 */

import { PostsModel } from 'src/posts/entity/posts.entity';
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { RolesEnum } from '../const/roles.const';
import { BaseModel } from 'src/common/entity/base.entity';
import { IsEmail, IsString, Length } from 'class-validator';
import { Exclude } from 'class-transformer';
import { ChatsModel } from 'src/chats/entity/chat.entity';
import { MessagesModel } from 'src/chats/messages/entity/messages.entity';
import { CommentsModel } from 'src/posts/comments/entity/comments.entity';

@Entity()
export class UsersModel extends BaseModel {
  @Column({ length: 20, unique: true })
  // 1) 길이가 20을 넘지 않을 것.
  // 2) 유일무이한 값이 될 것.
  @IsString()
  @Length(1, 20)
  nickname: string;

  @Column({ unique: true })
  // 1) 유일무이한 값이 될 것.
  @IsString()
  @IsEmail()
  email: string;

  @Column()
  @IsString()
  @Length(3, 8)
  /**
   * Request
   * frontend -> backend 데이터 전송 시에는,
   * plain object (JSON) -> class instance (dto) 로 변환됨.
   *
   * Response
   * backend -> frontend 데이터 전송 시에는,
   * class instance (dto) -> plain object (JSON) 로 변환.
   *
   * toClassOnly -> class instance 변환될때만(즉, 요청을 보낼때만 적용)
   * toPlainOnly -> plain object로 변환될때만(즉, 응답을 보낼때만 적용)
   * @Exclude() 애노태이션을 옵션없이 사용하면 toClassOnly, toPlainOnly 모두 적용됨.
   *
   * request에서는 password를 제외시키지 말아야 하고 response에서만 제외시키고 싶음.
   */
  @Exclude({
    toPlainOnly: true, // 응답이 나가는 상황에서만 제외시키겠다.(요청에서는 제외안됨.)
  })
  password: string;

  @Column({ enum: Object.values(RolesEnum), default: RolesEnum.USER })
  role: RolesEnum;

  @OneToMany(() => PostsModel, (post) => post.author)
  posts: PostsModel[];

  @ManyToMany(() => ChatsModel, (chat) => chat.users)
  @JoinTable()
  chats: ChatsModel[];

  @OneToMany(() => MessagesModel, (message) => message.author)
  messages: MessagesModel;

  @OneToMany(() => CommentsModel, (comment) => comment.author)
  postComments: CommentsModel[];
}
