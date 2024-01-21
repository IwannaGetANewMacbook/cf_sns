/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { join } from 'path';
import { POST_PUBLIC_IMAGE_PATH } from 'src/common/const/path.const';
import { BaseModel } from 'src/common/entities/base.entity';
import { UsersModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

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

  @Column('text', {
    nullable: true,
    array: true,
  })
  // @Transform(({ value }) => value && `/${join(POST_PUBLIC_IMAGE_PATH, value)}`)
  images: string[]; // img파일은 db에 직접 저장하지 않음. -> db에서는 이미지 위치만 저장. -> 그래서 string타입.

  @Column()
  likeCount: number;

  @Column()
  commentCount: number;
}
