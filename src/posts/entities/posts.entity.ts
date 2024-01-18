import { IsString } from 'class-validator';
import { BaseModel } from 'src/common/entities/base.entity';
import { ImageModel } from 'src/common/entities/image.entity';
import { UsersModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

// @Entity() 데코레이터 의미
// -> @Entity() 선언해주면 PostModel이라는 클래스 이름을 기반으로 자동으로 PostSQL DB에다가 테이블을 생성함.
@Entity()
export class PostsModel extends BaseModel {
  @ManyToOne(() => UsersModel, (user) => user.posts, {
    nullable: false,
  })
  author: UsersModel;

  @Column()
  @IsString({
    message: 'title must be a string -suhyeon',
  })
  title: string;

  @Column()
  @IsString({
    message: 'content must be a string -suhyeon',
  })
  content: string;

  @Column()
  likeCount: number;

  @Column()
  commentCount: number;

  @OneToMany(() => ImageModel, (image) => image.post)
  images: ImageModel[];
}
//
