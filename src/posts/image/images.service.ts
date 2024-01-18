import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { promises } from 'fs';
import { basename, join } from 'path';
import { POST_IMAGE_PATH, TEMT_FOLDER_PATH } from 'src/common/const/path.const';
import { ImageModel } from 'src/common/entities/image.entity';
import { QueryRunner, Repository } from 'typeorm';
import { CreatePostImageDto } from './dto/create-image.dto';

@Injectable()
export class PostsImagesService {
  constructor(
    @InjectRepository(ImageModel)
    private readonly imageRepository: Repository<ImageModel>,
  ) {}

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<ImageModel>(ImageModel)
      : this.imageRepository;
  }

  async creatPostImage(dto: CreatePostImageDto, qr?: QueryRunner) {
    const repository = this.getRepository(qr);

    // dto의 이미지 이름을 기반으로
    // 파일의 경로를 생성한다.
    const tempFilePath = join(TEMT_FOLDER_PATH, dto.path); // /{프로젝트의 위치}/public/temp/dto.image

    try {
      // 파일이 존재하는지 확인
      // 만약에 존재하지 않는다면 에러를 던짐.
      await promises.access(tempFilePath); // promises.access('경로이름') -> 그 경로에 해당하는 파일이 접근이 가능한 상태인지 알려줌.
    } catch (e) {
      throw new BadRequestException(`this file is not existent`);
    }

    // 파일의 이름만 가져오기
    // e.g. /users/aaa/bbb/ccc/asdf.jpg => asdf.jpg
    const fileName = basename(tempFilePath); // 파일이름만 따로 추출함.

    // 새로 이동할 포스트 폴더의 경로 + 이미지 이름
    // e.g. {프로젝트 경로}/public/posts/asdf.jpg
    const newPath = join(POST_IMAGE_PATH, fileName);

    const result = await repository.save({
      ...dto,
    });

    // 파일 옮기기
    // 첫번째 파라미터의 경로로부터 두번째 파라미터의 경로로 이미지 옮김.
    await promises.rename(tempFilePath, newPath);

    return result;
  }
}
