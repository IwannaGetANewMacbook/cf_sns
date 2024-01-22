import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

// nest.js에서 기본으로 제공해주는 모든 expception filter는 HttpException 클래스를  extend 함.
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    // 로그파일을 생성하거나
    // 에러 모니터링 시스템에 API 콜 하기.

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timesStamp: new Date().toLocaleString('kr'),
      path: request.url,
    });
  }
}
