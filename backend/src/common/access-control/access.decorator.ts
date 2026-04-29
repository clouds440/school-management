import { SetMetadata } from '@nestjs/common';
import { AccessLevel } from './access-level.enum';

export const ACCESS_LEVEL_KEY = 'access_level';
export const IS_ANONYMOUS_ACCESS_KEY = 'is_anonymous_access';

export const Access = (level: AccessLevel) => SetMetadata(ACCESS_LEVEL_KEY, level);
export const AnonymousAccess = () => SetMetadata(IS_ANONYMOUS_ACCESS_KEY, true);
