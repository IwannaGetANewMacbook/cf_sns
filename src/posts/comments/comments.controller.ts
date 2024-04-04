import { IsCommentMineOrAdminGuard } from './guard/is-comment-mine-or-admin.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PaginateCommnetsDto } from './dto/paginate-comments.dto';
import { CreateCommentsDto } from './dto/create-comments.dto';
import { UsersModel } from 'src/users/entity/users.entity';
import { User } from 'src/users/decorator/user.decorator';
import { UpdateCommentsDto } from './dto/update-comments.dto';
import { IsPublic } from 'src/common/decorator/is-public.decorator';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {
    /**
     * 1) Entity 생성
     * author -> 작성자
     * post -> 귀속되는 포스트
     * comment -> 실제 댓글 내용
     * likeCount -> 좋아요 갯수
     *
     * id -> PrimaryGeneratedColumn
     * createdAt -> 생성일자
     * updatedAt -> 업데이트 일자
     *
     * 2) GET() pagination
     * 3) GET(':cid') 특정 코멘트만 하나 가져오는 기능
     * 4) POST() 코멘트 생성하는 기능
     * 5) PATCH(':commentId') 특정 comment 업데이트 하는 기능
     * 6) DELETE(':commentId') 특정 commnet 삭제하는 기능
     */
  }
  @Get()
  @IsPublic()
  getComments(
    @Query() query: PaginateCommnetsDto,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.commentsService.paginateCommnets(query, postId);
  }

  @Get(':commentId')
  @IsPublic()
  getCommentById(@Param('commentId', ParseIntPipe) commentId: number) {
    return this.commentsService.getCommentById(commentId);
  }

  @Post()
  //어떤 포스트에다가 코멘트를 달건지 필요하니까 pid받음
  postComment(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: CreateCommentsDto,
    @User() user: UsersModel,
  ) {
    return this.commentsService.createComment(dto, postId, user);
  }

  @Patch(':commentId')
  @UseGuards(IsCommentMineOrAdminGuard)
  async patchConmment(
    @Body() dto: UpdateCommentsDto,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return this.commentsService.updateComment(dto, commentId);
  }

  @Delete(':commentId')
  @UseGuards(IsCommentMineOrAdminGuard)
  async deleteComment(@Param('commentId', ParseIntPipe) commentId: number) {
    return this.commentsService.deleteComment(commentId);
  }
}
