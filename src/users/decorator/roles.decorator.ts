import { SetMetadata } from '@nestjs/common';
import { RolesEnum } from '../const/roles.const';

// 이 key 값을 사용해서 metadata를 등록하고 불러올 수 있음.
export const ROLES_KEY = 'user_roles';

// @Roles(RolesEnum.ADMIN) --> 이렇게 애노테이션 해주면 해당 API는 ADMIM 사용자가 아니면 사용할 수 없게 함.
export const Roles = (role: RolesEnum) => SetMetadata(ROLES_KEY, role); // SetMetadata(metadata를 저장할 key, key값에 해당되는 데이터.)
