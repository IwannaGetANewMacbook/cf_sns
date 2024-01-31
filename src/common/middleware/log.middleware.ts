import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';

@Injectable()
export class LogMiddleware implements NestMiddleware {
  // middleware 는 use() 라는 함수 오버라이드.
  use(req: Request, res: Response, next: NextFunction) {
    console.log(
      `[REQ] ${req.method} ${req.url} ${new Date().toLocaleString('kr')}`,
    );

    next();
  }
}
