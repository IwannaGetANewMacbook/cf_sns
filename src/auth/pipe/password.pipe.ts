import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

/** 비밀번호 8자 이하 파이프 */
@Injectable()
export class PasswordPipe implements PipeTransform {
  transform(value: any) {
    if (value.toString().length > 8) {
      throw new BadRequestException(
        'Password should be less than 8 characters.',
      );
    }
    return value.toString();
  }
}

/** 최대길이 제한 파이프 */
@Injectable()
export class MaxLengthPipe implements PipeTransform {
  constructor(private readonly length: number) {}

  transform(value: any) {
    if (value.toString().length > this.length) {
      throw new BadRequestException(`MaxLength is ${this.length}.`);
    }
    return value.toString();
  }
}

@Injectable()
export class MinLengthPipe implements PipeTransform {
  constructor(private readonly length: number) {}
  transform(value: any) {
    if (value.toString().length < this.length) {
      throw new BadRequestException(`MinLength is ${this.length}.`);
    }
    return value.toString();
  }
}
