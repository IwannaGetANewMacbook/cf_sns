import { PickType } from '@nestjs/mapped-types';
import { PostsModel } from '../entity/posts.entity';

/**
 * <TypeScript utility>
 * Pick, Omit, Partial -> Type을 반환
 * 얘네들은 Type을 반환하기 때문에 클래스를 extends 할 수 없음.
 *
 * <NestJS utility>
 * PickType, OmitType, PartialType -> 값을 반환
 * 반면, 애네들은 값을 반환하기 때문에 클래스를 extends 할 수 있음.
 */

export class CreatePostDTO extends PickType(PostsModel, ['title', 'content']) {}
