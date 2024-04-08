import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModel } from './posts/entity/posts.entity';
import { UsersModule } from './users/users.module';
import { UsersModel } from './users/entity/users.entity';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
import { LogMiddleware } from './common/middleware/log.middleware';
import { ChatsModule } from './chats/chats.module';
import { ChatsModel } from './chats/entity/chat.entity';
import { MessagesModel } from './chats/messages/entity/messages.entity';
import { CommentsModel } from './posts/comments/entity/comments.entity';
import { CommentsModule } from './posts/comments/comments.module';
import { RolesGuard } from './users/guard/roles.guard';
import { AccessTokenGuard } from './auth/guard/bearer-token.guard';
import { UserFollowersModel } from './users/entity/user-followers.entity';

// 다른 모듈을 불러올 때 imports 배열에 등록시킴.
@Module({
  imports: [
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
      entities: [
        PostsModel,
        UsersModel,
        ChatsModel,
        MessagesModel,
        CommentsModel,
        UserFollowersModel,
      ],
      // synchronize: true -> nestJS에서 작성하는 typeORM코드와 db싱크를 자동으로 맞추겠다!
      // 개발환경에서는 synchronize: true, 프로덕션 환경에서는 synchronize: false
      synchronize: true,
    }),
    PostsModule,
    UsersModule,
    AuthModule,
    ChatsModule,
    CommentsModule,
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
    // app 전체에다가 guard 등록함.
    // 주의!: app 전체에 등록한 guard는 해당API에 등록한 guard 보다 무조건 먼저 실행됨.
    {
      // app안에 있는 API 전체에다가 토큰가드 씌어서 privateAPI로 만들어버림.
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
/** LogMiddleware를 이 서버 전역으로 적용 */
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LogMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
