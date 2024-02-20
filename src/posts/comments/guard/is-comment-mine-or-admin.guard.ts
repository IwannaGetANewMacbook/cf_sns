import { CommentsService } from './../comments.service';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { RolesEnum } from 'src/users/const/roles.const';
import { UsersModel } from 'src/users/entity/users.entity';

@Injectable()
export class IsCommentMineOrAdminGuard implements CanActivate {
  constructor(private readonly commentsService: CommentsService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest() as Request & {
      user: UsersModel;
    };

    const { user } = req;

    if (!user) {
      throw new UnauthorizedException('사용자 정보를 가져올 수 없음.');
    }

    if (user.role === RolesEnum.ADMIN) {
      return true;
    }

    const commentId = req.params.commentId;

    const isOk = await this.commentsService.isCommentMine(
      user.id,
      parseInt(commentId),
    );

    if (!isOk) {
      throw new ForbiddenException('권한이 없음.');
    }

    return true;
  }
}
