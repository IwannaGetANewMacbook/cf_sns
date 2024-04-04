import { DEFAULT_COMMENT_FIND_OPTIONS } from './const/default-comment-find-options.const';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { PaginateCommnetsDto } from './dto/paginate-comments.dto';
import { Repository } from 'typeorm';
import { CommentsModel } from './entity/comments.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCommentsDto } from './dto/create-comments.dto';
import { UsersModel } from 'src/users/entity/users.entity';
import { UpdateCommentsDto } from './dto/update-comments.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentsModel)
    private readonly commentsRepository: Repository<CommentsModel>,
    private readonly commonService: CommonService,
  ) {}

  paginateCommnets(dto: PaginateCommnetsDto, postId: number) {
    return this.commonService.paginate(
      dto,
      this.commentsRepository,
      {
        where: { post: { id: postId } },
        ...DEFAULT_COMMENT_FIND_OPTIONS,
      },
      `posts/${postId}/comments`,
    );
  }

  async getCommentById(id: number) {
    const comment = await this.commentsRepository.findOne({
      where: { id: id },
      ...DEFAULT_COMMENT_FIND_OPTIONS,
    });

    if (!comment) {
      throw new BadRequestException(`id: ${id} Comment is not exitant`);
    }
    return comment;
  }

  async createComment(
    dto: CreateCommentsDto,
    postId: number,
    author: UsersModel,
  ) {
    return this.commentsRepository.save({
      ...dto,
      // 어떤 포스트랑 연동될지는 postId기반으로 연동.
      post: {
        id: postId,
      },
      author: author,
    });
  }

  async updateComment(dto: UpdateCommentsDto, commentId: number) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new BadRequestException('this is not a existant comment');
    }

    const prevComment = await this.commentsRepository.preload({
      // 이 id를 기준으로 comment객체를 반환해줌.
      id: commentId,
      ...dto,
    });

    const newComment = await this.commentsRepository.save(prevComment);

    return newComment;
  }

  async deleteComment(commentId: number) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new BadRequestException('this is not a existant comment');
    }

    await this.commentsRepository.delete({ id: commentId });

    return commentId;
  }

  async isCommentMine(userId: number, commentId: number) {
    return this.commentsRepository.exist({
      where: { id: commentId, author: { id: userId } },
      relations: { author: true },
    });
  }
}
