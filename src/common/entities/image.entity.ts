import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseModel } from './base.entity';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { join } from 'path';
import { POST_PUBLIC_IMAGE_PATH } from '../const/path.const';
import { PostsModel } from 'src/posts/entities/posts.entity';

export enum ImageModelType {
  POST_IMAGE,
}

@Entity()
export class ImageModel extends BaseModel {
  // 사용자가 이미지를 올릴때 순서
  // 프론트에서 order값을 안넣어주면 default value 는 0, 생성된 순서대로 정렬
  @Column({
    default: 0,
  })
  @IsInt()
  @IsOptional()
  order: number;

  // 이미지 모델의 타입이 무엇인지.
  // UserModle -> 사용자 프로필 이미지
  // PostsMoel -> 포스트 이미지
  @Column({
    enum: ImageModelType,
  })
  @IsEnum(ImageModel)
  @IsString()
  type: ImageModelType;

  // 이미지의 경로
  @Column()
  @IsString()
  @Transform(({ value, obj }) => {
    if (obj.type === ImageModelType.POST_IMAGE) {
      return `/${join(POST_PUBLIC_IMAGE_PATH, value)}`;
    } else {
      return value;
    }
  })
  path: string;

  @ManyToOne(() => PostsModel, (post) => post.images)
  post?: PostsModel;
}
