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
     * 요청이 들어올때 REQ요청이 들어온 타임스탬프를 찍는다.
     * e.g. [REQ] {요청 path} {요청 시간}
     *
     * 요청이 끝날 때 (응답이 나갈때 ) 다시 타임스탬프를 찍는다.
     * e.g. [RES] {요청 path} {응답 시간} {얼마나 걸렸는지 ms } */

    // 현재 이 시간을 가져옴.
    const now = new Date();
    // req객체 가져옴
    const req = context.switchToHttp().getRequest();
    // e.g. /posts     /common/image
    const path = req.originalUrl;

    // [REQ] {요청 path} {요청 시간} 형식
    console.log(`[REQ] ${path} ${now.toLocaleString('kr')}`);

    // retrun next.handle()을 실행하는 순간 라우트의 로직이 전부 실행되고 'observable'로 응답이 반환된다.
    // 그리고 반환된 응답값은 pipe()를 통해서 각각의 함수를 전부다 실행함.
    return next.handle().pipe(
      // [RES] {요청 path} {응답 시간} {얼마나 걸렸는지 ms }
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
// tap()은 res값을 전달받아서 모니터링 할 수 있는 rxjs 함수.(변형은 안됨.)
// map()은 tap()과 다르게 반환된 응답값을 변형 할 수있음.
