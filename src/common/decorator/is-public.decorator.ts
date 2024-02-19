import { SetMetadata } from '@nestjs/common';

// metadata 설정을 위한 key.
export const IS_PUBLIC_KEY = 'is_public';

// annotation 만들기.
export const IsPublic = () => SetMetadata(IS_PUBLIC_KEY, true);
