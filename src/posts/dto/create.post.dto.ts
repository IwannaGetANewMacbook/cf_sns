import { PickType } from '@nestjs/mapped-types';
import { PostsModel } from '../entities/posts.entity';

/**
 * TypeScript utility
 * Pick, Omit, Partial -> Type을 반환
 * PickType, OmitType, PartialType -> 값을 반환
 */

export class CreatePostDTO extends PickType(PostsModel, ['title', 'content']) {}
