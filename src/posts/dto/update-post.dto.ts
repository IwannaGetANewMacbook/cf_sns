import { IsOptional, IsString } from 'class-validator';
/**
 * PartialType(CreatePostDTO)
 * -> createPostDTO의 모든 값들이 partial값으로updatePostDto에 상속됨.
 */
export class UpdatePostDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;
}
