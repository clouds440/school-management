import { SetMetadata } from '@nestjs/common';

export const BYPASS_ACTIVE_ORG_KEY = 'bypassActiveOrg';
export const BypassActiveOrg = () => SetMetadata(BYPASS_ACTIVE_ORG_KEY, true);
