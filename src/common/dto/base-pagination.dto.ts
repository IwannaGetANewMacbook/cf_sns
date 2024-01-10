import { IsIn, IsNumber, IsOptional } from 'class-validator';

export class BasePaginationDto {
  // 이 property가 들어가 있으면 무조건 page기반 pagination임.
  // 다른 property가 있다해도 에러처리 안해도 됨.
  @IsNumber()
  @IsOptional()
  page?: number;

  // 내림차순을 위한 property
  @IsNumber()
  @IsOptional()
  where__id__less_than?: number;

  // 이전 마지막 데이터의 ID.
  // 이 프로퍼티에 입력된 ID 보다 높은 ID 부터 값을 가져오기.
  // Query는 url에 붙어있기 때문에 아무리 number validation을 달아도 string으로 간주됨.
  // @Type(() => Number) // 이렇게 하면 query안에서 적용된 string타입이 number타입으로 반환되서 들어옴.
  @IsNumber()
  @IsOptional()
  where__id__more_than?: number;

  // 정렬
  // createdAt -> 생성된 시간의 내림차/오름차 순으로 정렬.
  @IsIn(['ASC', 'DESC']) //IsIn([]) 리스트 안의 값들 중 적어도 하나가 들어와야 검증됨.(리스트 안의 값들만 허용이 됨.)
  @IsOptional()
  order__createdAt?: 'ASC' | 'DESC' = 'ASC'; // 기본값=='ASC'

  // 몇 개의 데이터를 응답으로 받을 지.
  @IsNumber()
  @IsOptional()
  take: number = 20;
}
