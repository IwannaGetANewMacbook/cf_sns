/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable } from '@nestjs/common';
import { BasePaginationDto } from './dto/base-pagination.dto';
import {
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { FILTER_MAPPER } from './const/filter-mapper.const';
import { BaseModel } from './entity/base.entity';
import { ConfigService } from '@nestjs/config';
import { ENV_HOST_KEY, ENV_PROTOCOL_KEY } from './const/env-keys.const';

@Injectable()
export class CommonService {
  constructor(private readonly configService: ConfigService) {}
  paginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string,
  ) {
    // page기반 pagination
    if (dto.page) {
      return this.pagePaginate(dto, repository, overrideFindOptions);
    } else {
      // cursor기반 pagination
      return this.cursorPaginate(dto, repository, overrideFindOptions, path);
    }
  }

  private async pagePaginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
  ) {
    const findOptions = this.composeFindOptions<T>(dto);

    const [data, count] = await repository.findAndCount({
      ...findOptions,
      ...overrideFindOptions,
    });

    return {
      data,
      total: count,
    };
  }

  private async cursorPaginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string,
  ) {
    const findOptions = this.composeFindOptions<T>(dto);

    const results = await repository.find({
      ...findOptions,
      ...overrideFindOptions,
    });

    const lastItem =
      results.length > 0 && results.length === dto.take
        ? results[results.length - 1]
        : null;

    const protocol = this.configService.get<string>(ENV_PROTOCOL_KEY);
    const host = this.configService.get<string>(ENV_HOST_KEY);

    // next에 해당하는 url만들기.
    const nextUrl = lastItem && new URL(`${protocol}://${host}/${path}`);
    if (nextUrl) {
      for (const key of Object.keys(dto)) {
        if (dto[key]) {
          if (
            key !== 'where__id__more_than' &&
            key !== 'where__id__less_than'
          ) {
            nextUrl.searchParams.append(key, dto[key]);
          }
        }
      }

      let key = null;

      if (dto.order__createdAt === 'ASC') {
        key = 'where__id__more_than';
      } else {
        key = 'where__id__less_than';
      }

      nextUrl.searchParams.append(key, lastItem.id.toString());
    }

    return {
      data: results,
      cursor: {
        after: lastItem?.id ?? null,
      },
      count: results.length,
      next: nextUrl?.toString() ?? null,
    };
  }

  private composeFindOptions<T extends BaseModel>(
    dto: BasePaginationDto,
  ): FindManyOptions<T> {
    /** 반환값
     * where,
     * order,
     * take,
     * skip -> page 기반일때만
     */
    /** DTO의 햔재 생긴 구조는 아래와 같다(예시)
     * {
     *  where__id__more_than: 1,
     *  order__createdAt: 'ASC'
     * }
     *
     * 현재는 where__id__more_than / where__id__less_than 에 해당되는 where 필터만 사용중이지만
     * 나중에 where__likeCount__morethan 이나 where__titile__ilike 등 추가 필터를 넣고싶어졌을때
     * 모든 where 필터들을 자동으로 파싱 할 수 있을만한 기능을 제작해야 함.
     *
     * 1) where로 시작한다면 필터 로직을 적용한다
     * 2) order로 시작하면 정렬 로직을 적용한다.
     * 3) 필터 로직을 적용한다면 '__' 기준으로 split 했을때 3개의 값으로 나뉘는지 2개의 값으로 나뉘는지 확인한다.
     *    3-1) 3개의 값으로 나뉜다면 FILTER_MAPPER에서 해당되는 operator 함수를 찾아서 적용한다.
     *            e.g. where__id__more_than ---> ['where', 'id', 'more_than']
     *    3-2) 2개의 값으로 나뉜다면 정확한 값을 필터하는 것이기 때문에 operator 없이 작용한다.
     *            e.g. where__id ---> ['where', 'id']
     * 4) order의 경우 3-2와 같이 적용한다.
     *
     */

    let where: FindOptionsWhere<T> = {};
    let order: FindOptionsOrder<T> = {};

    // dto의 key값과 value값을 리스트로 뽑아서 looping함.
    for (const [key, value] of Object.entries(dto)) {
      // key가 'where__'로 시작하는 경우
      if (key.startsWith('where__')) {
        where = {
          ...where,
          ...this.parseWhereFilter(key, value),
        };
        // key가 'order__'로 시작하는 경우
      } else if (key.startsWith('order__')) {
        order = {
          ...order,
          ...this.parseOrderFilter(key, value),
        };
      }
    }
    return {
      where,
      order,
      take: dto.take,
      skip: dto.page ? dto.take * (dto.page - 1) : null,
    };
  }

  private parseWhereFilter<T extends BaseModel>(
    key: string,
    value: any,
  ): FindOptionsWhere<T> {
    const where: FindOptionsWhere<T> = {};

    const split = key.split('__');

    if (split.length !== 2 && split.length !== 3) {
      throw new BadRequestException(
        `where 필터는 '__'로 split 했을때 길이가 2 또는 3이어야 합니다 - 문제되는 키값${key}`,
      );
    }

    if (split.length === 2) {
      const [_, field] = split;
      where[field] = value;
    } else if (split.length === 3) {
      // ['where', 'id', 'more_than']
      const [_, field, operator] = split;

      // where__id__between = 3, 4
      // 만약에 split 대상 문자가 존재하지 않으면 길이가 무조건 1임.

      // field -> id
      // operator -> more_than
      // FILTER_MAPPER[operator] -> MoreThan(from TypeORM)
      if (operator === 'i_like') {
        where[field] = FILTER_MAPPER[operator](`%${value}%`);
      } else if (operator === 'between') {
        const values = value.toString().split(',');
        where[field] = FILTER_MAPPER[operator](values[0], values[1]);
      } else {
        where[field] = FILTER_MAPPER[operator](value);
      }
    }

    return where;
  }

  private parseOrderFilter<T extends BaseModel>(
    key: string,
    value: any,
  ): FindOptionsOrder<T> {
    const order: FindOptionsOrder<T> = {};
    /**
     * order는 무조건 2개로 split된다.
     */
    const split = key.split('__');

    if (split.length !== 2) {
      throw new BadRequestException(
        `order 필터는 '__'로 split 했을때 길이가 2 이어야 합니다 - 문제되는 키값: ${key}`,
      );
    }

    const [_, field] = split;

    order[field] = value;

    return order;
  }
}
