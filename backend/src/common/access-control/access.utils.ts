import { UserStatus, OrgStatus } from '../enums';
import { AccessLevel } from './access-level.enum';

/**
 * Maps UserStatus to AccessLevel
 */
export function getUserStatusAccess(status: UserStatus): AccessLevel {
  switch (status) {
    case UserStatus.ACTIVE:
    case UserStatus.ON_LEAVE:
      return AccessLevel.WRITE;
    case UserStatus.SUSPENDED:
      return AccessLevel.READ;
    case UserStatus.ALUMNI:
    case UserStatus.EMERITUS:
    case UserStatus.DELETED:
      return AccessLevel.NONE;
    default:
      return AccessLevel.NONE;
  }
}

/**
 * Maps OrgStatus to AccessLevel
 */
export function getOrgStatusAccess(status: OrgStatus): AccessLevel {
  switch (status) {
    case OrgStatus.APPROVED:
      return AccessLevel.WRITE;
    case OrgStatus.SUSPENDED:
    case OrgStatus.REJECTED:
    case OrgStatus.PENDING:
    default:
      return AccessLevel.NONE;
  }
}

/**
 * Resolves the final access level using the most restrictive rule (Math.min)
 */
export function resolveAccessLevel({
  userStatus,
  orgStatus,
}: {
  userStatus: UserStatus;
  orgStatus?: OrgStatus;
}): AccessLevel {
  const userAccess = getUserStatusAccess(userStatus);
  
  // Platform admins/Super admins might not have an organization
  if (!orgStatus) {
    return userAccess;
  }

  const orgAccess = getOrgStatusAccess(orgStatus);

  return Math.min(userAccess, orgAccess) as AccessLevel;
}
