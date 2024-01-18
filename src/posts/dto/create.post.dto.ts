import { PickType } from '@nestjs/mapped-types';
import { PostsModel } from '../entities/posts.entity';
import { IsOptional, IsString } from 'class-validator';

/**
 * TypeScript utility
 * Pick, Omit, Partial -> Type을 반환
 * PickType, OmitType, PartialType -> 값을 반환
 */

export class CreatePostDTO extends PickType(PostsModel, ['title', 'content']) {
  @IsString({
    // 리스트 안에 있는 각각의 값들은 모두 string type으로 검증해야 한다
    each: true,
  })
  @IsOptional()
  images: string[] = [];
}
