import { PostsImagesService } from './image/images.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { User } from 'src/users/decorator/user.decorator';
import { UsersModel } from 'src/users/entities/users.entity';
import { CreatePostDTO } from './dto/create.post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { ImageModelType } from 'src/common/entities/image.entity';
import { DataSource } from 'typeorm';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postsImagesService: PostsImagesService,
    // database와 관련된 작업들을 할 수 있는 API를 Inject를 받음
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  getPosts(@Query() query: PaginatePostDto) {
    return this.postsService.paginatePosts(query);
  }

  // 테스트용 임의 API
  @Post('random')
  @UseGuards(AccessTokenGuard)
  async postPostsRandom(@User() user: UsersModel) {
    await this.postsService.generatePosts(user.id);
    return true;
  }

  @Get(':id')
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  @Post()
  @UseGuards(AccessTokenGuard)
  async createPost(
    @User() user: UsersModel,
    @Body() body: CreatePostDTO,
    // @Body('title') title: string,
    // @Body('content') content: string,
  ) {
    // 1. Transaction과 관련된 모든 쿼리를 담당할 '쿼리 러너'를 생성한다.
    const qr = this.dataSource.createQueryRunner();
    // 2. 쿼리 러너에 연결한다.
    await qr.connect();
    // 3. 쿼리 러너에서 Transaction을 시작한다.
    // 이 시점부터 같은 '쿼리 러너' 를 사용하면 Transaction안에서 'db action'을 실행할 수 있다.
    await qr.startTransaction();
    // 4. 로직실행
    try {
      // post 를 먼저 받고 그 다음 이미지 생성.
      const post = await this.postsService.createPost(user.id, body, qr);

      for (let i = 0; i < body.images.length; i++) {
        await this.postsImagesService.creatPostImage(
          {
            post,
            order: i,
            path: body.images[i],
            type: ImageModelType.POST_IMAGE,
          },
          qr,
        );
      }
      // 정상적으로 transaction이 실행되었을 경우.
      await qr.commitTransaction();
      await qr.release();

      return this.postsService.getPostById(post.id);
    } catch (e) {
      // 어떤 에러든 에러가 던져지면, Transaction을 종료하고 원래 상태로 되돌린다.
      await qr.rollbackTransaction();
      await qr.release(); // '쿼리 러너' 해제.
    }
  }

  //
  @Patch(':id')
  updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePostDto,
    // @Body('title') title?: string,
    // @Body('content') content?: string,
  ) {
    return this.postsService.updatePost(id, body.title, body.content);
  }

  @Delete(':id')
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePost(id);
  }
}
