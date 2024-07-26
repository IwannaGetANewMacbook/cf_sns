/* eslint-disable @typescript-eslint/no-unused-vars */
import { CommonService } from './../common/common.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';
import { PostsModel } from './entity/posts.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { ConfigService } from '@nestjs/config';
import {
  ENV_HOST_KEY,
  ENV_PROTOCOL_KEY,
} from 'src/common/const/env-keys.const';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
    private readonly commonService: CommonService,
    private readonly configService: ConfigService,
  ) {}

  // 모든 repository method는 전부 다 async(비동기)임!
  async getAllPosts() {
    return await this.postsRepository.find({ relations: ['author'] });
  }

  // Pagination을 테스트해 볼 수 있도록 임의로 데이터를 생성하는 함수(나중에 삭제할 거.)
  async generatePosts(userId: number) {
    for (let i = 0; i < 100; i++) {
      const title = `임의로 생성된 타이틀${i}`;
      const content = `임의로 생성된 컨텐트${i}`;
      await this.createPost(userId, title, content, []);
    }
  }

  async paginatePosts(dto: PaginatePostDto) {
    // if (dto.page) {
    //   return this.pagePaginatePosts(dto);
    // } else {
    //   return this.cursorPaginatePosts(dto);
    // }
    return this.commonService.paginate(
      dto,
      this.postsRepository,
      {
        relations: ['author'],
      },
      'posts',
    );
  }

  /**
   * 일반화 하기 전의 pagePaginatePosts() 함수.
   */
  // async pagePaginatePosts(dto: PaginatePostDto) {
  //   /** 리턴값.
  //    * data: Data[],
  //    * total: number, // 전체 데이터 는 몇개가 되는지.
  //    */
  //   const [posts, count] = await this.postsRepository.findAndCount({
  //     skip: dto.take * (dto.page - 1),
  //     take: dto.take,
  //     order: { createdAt: dto.order__createdAt },
  //   });

  //   return {
  //     data: posts,
  //     total: count,
  //   };
  // }

  /**
   * 일반화 하기 전의 cursorPaginatePosts() 함수.
   */

  // async cursorPaginatePosts(dto: PaginatePostDto) {
  //   const where: FindOptionsWhere<PostsModel> = {};

  //   if (dto.where__id__less_than) {
  //     where.id = LessThan(dto.where__id__less_than);
  //   } else if (dto.where__id__more_than) {
  //     where.id = MoreThan(dto.where__id__more_than);
  //   }

  //   const posts = await this.postsRepository.find({
  //     where,
  //     order: { createdAt: dto.order__createdAt },
  //     take: dto.take,
  //   });

  //   // 해당되는 포스트가 0개 이상이면 마지막 포스트를 가져오고 아니면 null을 반환.
  //   const lastItem =
  //     posts.length > 0 && posts.length === dto.take
  //       ? posts[posts.length - 1]
  //       : null;

  //   const protocol = this.configService.get<string>(ENV_PROTOCOL_KEY);
  //   const host = this.configService.get<string>(ENV_HOST_KEY);

  //   // next에 해당하는 url만들기.
  //   const nextUrl = lastItem && new URL(`${protocol}://${host}/posts`);
  //   if (nextUrl) {
  //     for (const key of Object.keys(dto)) {
  //       if (dto[key]) {
  //         if (
  //           key !== 'where__id__more_than' &&
  //           key !== 'where__id__less_than'
  //         ) {
  //           nextUrl.searchParams.append(key, dto[key]);
  //         }
  //       }
  //     }

  //     let key = null;

  //     if (dto.order__createdAt === 'ASC') {
  //       key = 'where__id__more_than';
  //     } else {
  //       key = 'where__id__less_than';
  //     }

  //     nextUrl.searchParams.append(key, lastItem.id.toString());
  //   }

  //   return {
  //     data: posts,
  //     cursor: {
  //       after: lastItem?.id ?? null, // 여기서 ?? 붙여서 lastItem이 null 일 경우 null값을 고대로 넣어줌.
  //     },
  //     count: posts.length,
  //     next: nextUrl?.toString() ?? null,
  //   };
  // }

  async getPostById(id: number) {
    const post = await this.postsRepository.findOne({
      where: {
        id: id,
      },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('404 Not Found.');
    }

    return post;
  }

  async createPost(
    authorId: number,
    title: string,
    content: string,
    images?: Array<Express.Multer.File>,
  ) {
    // 1) create -> 저장할 객체를 생성한다.
    // 2) save -> 객체를 저장한다.(create 메서드에서 생성한 객체로 저장)

    // files 배열에서 filename만 추출.
    const filenames = [];
    images.forEach((v) => {
      filenames.push(v.filename);
    });

    // create() 함수는 동기식으로 처리됨.
    const post = this.postsRepository.create({
      author: { id: authorId },
      title: title,
      content: content,
      images: filenames,
      likeCount: 0,
      commentCount: 0,
    });

    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async updatePost(id: number, title: string, content: string) {
    // save의 기능
    // 1) 만약에 데이터가 존재하지 않는다면 (id 기준으로) 새로 생성한다.
    // 2) 만약에 데이터가 존재한다면 (같은 id값이 존재한다면) 존재하던 값을 업데이트 한다.

    const post = await this.postsRepository.findOne({
      where: {
        id: id,
      },
    });

    // If there's no post, I'll throw the error.
    if (!post) {
      throw new NotFoundException('404 Not Found');
    }

    // if 'title' is changed, I'll replace previous title with new title.
    if (title) {
      post.title = title;
    }

    // if 'content' is changed, I'll replace previous content with new content.
    if (content) {
      post.content = content;
    }

    // insert updated post into database
    const updatedPost = await this.postsRepository.save(post);

    return updatedPost;
  }

  async deletePost(id: number) {
    const post = await this.postsRepository.findOne({
      where: {
        id: id,
      },
    });

    if (!post) {
      throw new NotFoundException('404 Not Found');
    }

    await this.postsRepository.delete(id);

    return `The id of deleted post is ${id}`;
  }

  checkPostExistsById(postId: number) {
    return this.postsRepository.exist({
      where: { id: postId },
    });
  }

  // 자기자신의 포스트인지 아닌지 확인하는 API
  async isPostMine(userId: number, postId: number) {
    return this.postsRepository.exist({
      where: { id: postId, author: { id: userId } },
      relations: { author: true },
    });
  }
}
