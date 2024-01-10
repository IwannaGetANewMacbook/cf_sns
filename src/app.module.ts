import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModel } from './posts/entities/posts.entity';
import { UsersModule } from './users/users.module';
import { UsersModel } from './users/entities/users.entity';
import { AuthModule } from './auth/auth.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import {
  ENV_DB_DATABASE_KEY,
  ENV_DB_HOST_KEY,
  ENV_DB_PASSWORD_KEY,
  ENV_DB_PORT_KEY,
  ENV_DB_USERNAME_KEY,
} from './common/const/env-keys.const';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PUBLIC_FOLDER_PATH } from './common/const/path.const';

// 다른 모듈을 불러올 때 imports 배열에 등록시킴.
@Module({
  imports: [
    PostsModule,
    ServeStaticModule.forRoot({
      // 파일들을 serving할 가장 최상단의 폴더(절대 경로)
      rootPath: PUBLIC_FOLDER_PATH, // => http://localhost:3000/posts/dwd.jpg
      serveRoot: '/public', // => http://localhost:3000/public/posts/dwd.jpg
    }),
    ConfigModule.forRoot({
      envFilePath: '.env', // 환경변수로 쓸 파일 이름.
      isGlobal: true, // 글로벌로 적용할껀지.
    }),
    TypeOrmModule.forRoot({
      type: 'postgres', // 데이터베이스 타입
      host: process.env[ENV_DB_HOST_KEY],
      port: parseInt(process.env[ENV_DB_PORT_KEY]),
      username: process.env[ENV_DB_USERNAME_KEY],
      password: process.env[ENV_DB_PASSWORD_KEY],
      database: process.env[ENV_DB_DATABASE_KEY],
      entities: [PostsModel, UsersModel],
      // synchronize: true -> nestJS에서 작성하는 typeORM코드와 db싱크를 자동으로 맞추겠다!
      // 개발환경에서는 synchronize: true, 프로덕션 환경에서는 synchronize: false
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      /**
       * 이렇게 하면 class-transformer 애노테이션이 적용된 모든 API에
       * Interceptor 애노테이션이 자동적으로 적용됨. (app.module은 최상단 module.)
       */
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor, // 어떤 클래스를 적용할지.
    },
  ],
})
export class AppModule {}
