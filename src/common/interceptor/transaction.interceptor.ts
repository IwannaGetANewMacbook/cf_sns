import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap } from 'rxjs';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const req = context.switchToHttp().getRequest();
    // 1. Transaction과 관련된 모든 쿼리를 담당할 '쿼리 러너'를 생성한다.
    const qr = this.dataSource.createQueryRunner();
    // 2. 쿼리 러너에 연결한다.
    await qr.connect();
    // 3. 쿼리 러너에서 Transaction을 시작한다.
    // 이 시점부터 같은 '쿼리 러너' 를 사용하면 Transaction안에서 'db action'을 실행할 수 있다.
    await qr.startTransaction();

    req.QueryRunner = qr;

    return next.handle().pipe(
      catchError(async (e) => {
        await qr.rollbackTransaction();
        await qr.release();
        throw new InternalServerErrorException(e.message);
      }),
      tap(async () => {
        await qr.commitTransaction();
        await qr.release();
      }),
    );
  }
}
