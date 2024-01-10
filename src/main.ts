import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**이 앱 전반적으로 class-validator 모듈을 적용 */
  app.useGlobalPipes(
    new ValidationPipe({
      /** dto파일안에서 기본값으로 지정한 property들을 controller에서도 똑같이 적용하게 하게 하기 위함.*/
      transform: true,
      transformOptions: {
        // class-validator Anotation에 적용된 타입으로 class-transformer가 자동으로 해당 property 타입을 변환해줌.
        enableImplicitConversion: true,
      },
      /**
       * 이 옵션이 true가 되면은 validator가 지금 현재 validation이 적용되지
       * 않은 모든 property들을 삭제할것.
       */
      whitelist: true,
      /** whitelist가 true일 경우 stripping을 하는 대신 error를 던짐. */
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();
