import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';

export const QueryRunner = createParamDecorator(
  (data, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    if (!req.queryRunner) {
      throw new InternalServerErrorException(
        `You have to apply 'TransactionInterceptor' in order to use 'QueryRunner Decorator'`,
      );
    }

    return req.queryRunner;
  },
);
