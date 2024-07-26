import { PartialType } from '@nestjs/mapped-types';
import { CreateCommentsDto } from './create-comments.dto';

/**
 * PartialType 쓰면 CreateCommentDto 에 들어가있는
 * 어떤 property든 우리가 부분적으로 입력해서 사용가능
 */
export class UpdateCommentsDto extends PartialType(CreateCommentsDto) {}
