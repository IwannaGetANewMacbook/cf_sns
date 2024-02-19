/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModel } from './entity/posts.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import * as multer from 'multer';
import { POST_IMAGE_PATH } from 'src/common/const/path.const';
import { v4 as uuid } from 'uuid';
import { LogMiddleware } from 'src/common/middleware/log.middleware';
import { CommentsModule } from './comments/comments.module';

// TypeOrmModule.forFeature([PostsModel]) 에서 forFeature() 메서드는
// forRoot() 메서드와는 다르게 모델에 해당하는 repository를 주입할 때 사용.

@Module({
  imports: [
    TypeOrmModule.forFeature([PostsModel]),
    AuthModule,
    UsersModule,
    CommonModule,
    // file을 다운로드 받을때 여러가지 옵션들을 제공해 줄 수 있는 기능.
    MulterModule.register({
      // limits = 파일 크기 제한
      limits: {
        // bite 단위로 입력
        fieldSize: 10000000, // 10mb
      },
      fileFilter: (req, file, cb) => {
        /**
         * cb(error, boolean)
         *
         * 첫번째 파라미터에는 에러가 있을 경우 에러 정보를 넣어준다.
         * 두번째 파라미터에는 파일을 받을 지 말지 boolean값을 넣어준다.
         */

        // extname()함수는 파일의 확장자만 따와주는 함수.
        // e.g. xxx.jpg -> .jpg =>
        const ext = extname(file.originalname);

        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
          return cb(new BadRequestException('jpg/jpeg/png only'), false);
        }

        // if문 통과하면 error는 null로 처리하고 파일을 다운.
        return cb(null, true);
      },
      storage: multer.diskStorage({
        // 파일을 다운로드 했을 때 파일을 어디로 보낼건지.(폴더까지만 입력)
        destination: function (req, res, cb) {
          cb(null, POST_IMAGE_PATH); // 파일을 저장할 위치.
        },
        // 파일이름 작명
        filename: function (req, file, cb) {
          cb(null, `${uuid()}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}

// middleware 쓸 때 모듈에다 middleware 적용하는 방법.
/** middleware는 해당 모듈에다가 적용.
 * 근데 이렇게 path 에다가 * 를 적용할 빠엔 app.module에 middleware 선언해주고 전역으로 적용하는게 나음.
 */
// export class PostsModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(LogMiddleware).forRoutes({ path: 'posts *', method: RequestMethod.ALL });
//   }
// }
