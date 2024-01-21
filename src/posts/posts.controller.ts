/* eslint-disable @typescript-eslint/no-unused-vars */

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
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { User } from 'src/users/decorator/user.decorator';
import { UsersModel } from 'src/users/entities/users.entity';
import { CreatePostDTO } from './dto/create.post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import {
  FileFieldsInterceptor,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { LogInterceptor } from 'src/common/interceptor/log.interceptor';
import { ImagesTransformInterceptor } from './interceptor/images-transform.interceptor';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @UseInterceptors(LogInterceptor)
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
  @UseInterceptors(FilesInterceptor('image'))
  @UseInterceptors(ImagesTransformInterceptor)
  createPost(
    @User() user: UsersModel,
    @Body() body: CreatePostDTO,
    // @Body('title') title: string,
    // @Body('content') content: string,
    @UploadedFiles() files?: Array<Express.Multer.File>,
  ) {
    return this.postsService.createPost(
      user.id,
      body.title,
      body.content,
      files, // 만약 file이 undefined면 undefined 그대로 전달.
    );
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
