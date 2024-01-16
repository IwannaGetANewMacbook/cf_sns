import { CommonService } from './../common/common.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';
import { PostsModel } from './entities/posts.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { ConfigService } from '@nestjs/config';
import {
  ENV_HOST_KEY,
  ENV_PROTOCOL_KEY,
} from 'src/common/const/env-keys.const';
import { CreatePostDTO } from './dto/create.post.dto';
import { basename, join } from 'path';
import { POST_IMAGE_PATH, TEMT_FOLDER_PATH } from 'src/common/const/path.const';
import { promises } from 'fs';

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
      await this.createPost(userId, { title, content });
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

  async pagePaginatePosts(dto: PaginatePostDto) {
    /** 리턴값.
     * data: Data[],
     * total: number, // 전체 데이터 는 몇개가 되는지.
     */
    const [posts, count] = await this.postsRepository.findAndCount({
      skip: dto.take * (dto.page - 1),
      take: dto.take,
      order: { createdAt: dto.order__createdAt },
    });

    return {
      data: posts,
      total: count,
    };
  }

  async cursorPaginatePosts(dto: PaginatePostDto) {
    const where: FindOptionsWhere<PostsModel> = {};

    if (dto.where__id__less_than) {
      where.id = LessThan(dto.where__id__less_than);
    } else if (dto.where__id__more_than) {
      where.id = MoreThan(dto.where__id__more_than);
    }

    const posts = await this.postsRepository.find({
      where,
      order: { createdAt: dto.order__createdAt },
      take: dto.take,
    });

    // 해당되는 포스트가 0개 이상이면 마지막 포스트를 가져오고 아니면 null을 반환.
    const lastItem =
      posts.length > 0 && posts.length === dto.take
        ? posts[posts.length - 1]
        : null;

    const protocol = this.configService.get<string>(ENV_PROTOCOL_KEY);
    const host = this.configService.get<string>(ENV_HOST_KEY);

    // next에 해당하는 url만들기.
    const nextUrl = lastItem && new URL(`${protocol}://${host}/posts`);
    if (nextUrl) {
      for (const key of Object.keys(dto)) {
        if (dto[key]) {
          if (
            key !== 'where__id__more_than' &&
            key !== 'where__id__less_than'
          ) {
            nextUrl.searchParams.append(key, dto[key]);
          }
        }
      }

      let key = null;

      if (dto.order__createdAt === 'ASC') {
        key = 'where__id__more_than';
      } else {
        key = 'where__id__less_than';
      }

      nextUrl.searchParams.append(key, lastItem.id.toString());
    }

    return {
      data: posts,
      cursor: {
        after: lastItem?.id ?? null, // 여기서 ? 붙여서 lastItem이 null 일 경우 null값을 고대로 넣어줌.
      },
      count: posts.length,
      next: nextUrl?.toString() ?? null,
    };
  }

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

  async createPostImage(dto: CreatePostDTO) {
    // dto의 이미지 이름을 기반으로
    // 파일의 경로를 생성한다.
    const tempFilePath = join(TEMT_FOLDER_PATH, dto.image); // /{프로젝트의 위치}/public/temp/dto.image

    try {
      // 파일이 존재하는지 확인
      // 만약에 존재하지 않는다면 에러를 던짐.
      await promises.access(tempFilePath); // promises.access('경로이름') -> 그 경로에 해당하는 파일이 접근이 가능한 상태인지 알려줌.
    } catch (e) {
      throw new BadRequestException(`this file is not existent`);
    }

    // 파일의 이름만 가져오기
    const fileName = basename(tempFilePath); // 파일이름만 따로 추출함.

    // 새로 이동할 포스트 폴더의 경로 + 이미지 이름
    // e.g. {프로젝트 경로}/public/posts/adsf.jpg
    const newPath = join(POST_IMAGE_PATH, fileName);

    // 파일 옮기기
    // 첫번째 파라미터의 경로로부터 두번째 파라미터의 경로로 이미지 옮김.
    await promises.rename(tempFilePath, newPath);

    return true;
  }

  async createPost(authorId: number, postDto: CreatePostDTO) {
    // 1) create -> 저장할 객체를 생성한다.
    // 2) save -> 객체를 저장한다.(create 메서드에서 생성한 객체로 저장)

    // create() 함수는 동기식으로 처리됨.
    const post = this.postsRepository.create({
      author: {
        id: authorId,
      },
      ...postDto,
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
}
