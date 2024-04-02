import { IsNumber } from 'class-validator';

export class CreateChatDto {
  @IsNumber({}, { each: true }) // { each: true } -> 배열안의 값들이 다 숫자인지 확인
  userIds: number[];
}
