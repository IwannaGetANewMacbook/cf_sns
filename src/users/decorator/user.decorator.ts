// User 커스텀 데코레이터 생성,

import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';

/**User데코레이터는 무조건 AccessTokenGuard를 사용한 상태에서 사용가능!!*/
export const User = createParamDecorator((data, context: ExecutionContext) => {
  const req = context.switchToHttp().getRequest();

  const user = req.user;

  /** 이 User 데코레이터는 무조건 accessTokenGuard랑 같이 사용되어야하는 데코레이터임.
   * 그래서 따로 user 객체 검증이 필요 없을 수 있지만(accessTokenGuard 에서 이미 검증을 했기 때문.)
   * Just in case.
   */
  if (!user) {
    throw new InternalServerErrorException(
      'there is not user properties in Request... Pleas make sure to use this decorator with AccessTokenGuard',
    );
  }

  return user;
});
