import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PostsService } from 'src/posts/posts.service';

@Injectable()
export class PostExistsMiddleware implements NestMiddleware {
  constructor(private readonly postsService: PostsService) {}
  // 미들웨어는 use 라는 function을 override 해줘야 함!
  async use(req: Request, res: Response, next: NextFunction) {
    // req 의 path 파라미터안의 postId 가져오기.
    const postId = req.params.postId;

    if (!postId) {
      throw new BadRequestException('Post ID parameter is essential');
    }
    const exist = await this.postsService.checkPostExistsById(parseInt(postId));
    if (!exist) {
      throw new BadRequestException('Post is not existent.');
    }

    next();
  }
}
