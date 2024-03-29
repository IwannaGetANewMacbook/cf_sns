import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LogInterceptor implements NestInterceptor {
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
    const req = context.switchToHttp().getRequest();

    // e.g. /posts,     /common/image etc.
    const path = req.originalUrl;

    // 현재 날짜와 시간 가져오기.
    const now = new Date();

    //[REQ] {요청 paht} {요청 시간}
    console.log(`[REQ] ${path} ${now.toLocaleString('kr')}`);

    // return next.handle()을 실행하는 순간 라우트의 로직이 전부 실행되고 응답이 'observable'로 반환된다.
    return next.handle().pipe(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      tap((observable) => {
        return console.log(
          `[RES] ${path} ${new Date().toLocaleString('kr')} ${
            new Date().getMilliseconds() - now.getMilliseconds()
          }ms`,
        );
      }),
    );
  }
}

/**
pipe() -> 우리가 원하는 rxjs의 모든 함수들을 넣어줄 수 있음.
tap() -> 응답값을 전달받아서 모니터링 할 수 있는 rxjs 함수(응답값을 변형하진 못함).
map() -> 응답값을 전달받아서 응답값을 변형할 수 있는 rxjs 함수.
*/
