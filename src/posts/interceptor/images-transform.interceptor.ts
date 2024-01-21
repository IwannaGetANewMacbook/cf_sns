import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { join } from 'path';
import { Observable, map } from 'rxjs';
import { POST_PUBLIC_IMAGE_PATH } from 'src/common/const/path.const';

@Injectable()
export class ImagesTransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    /**
     * 요청이 들어올 때 REQ 요청이 들어온 타임스탬프를 찍는다.
     * e.g. [REQ] {요청 paht} {요청 시간}
     *
     * 요청이 끝날 때 (응답이 나갈 때) 다시 타임스탬프를 찍는다.
     * e.g. [RES] {요청 paht} {응답 시간} {얼마나 걸렸는지 ms}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const req = context.switchToHttp().getRequest();

    // return next.handle()을 실행하는 순간 라우트의 로직이 전부 실행되고 응답이 'observable'로 반환된다.
    return next.handle().pipe(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      map((observable) => {
        const oldImages: string[] = observable['images'];
        const newImages: string[] = [];
        oldImages.forEach((v) => {
          newImages.push(`/${join(POST_PUBLIC_IMAGE_PATH, v)}`);
        });
        return { ...observable, images: newImages };
      }),
    );
  }
}
