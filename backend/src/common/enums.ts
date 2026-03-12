export enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    PLATFORM_ADMIN = 'PLATFORM_ADMIN',
    ORG_ADMIN = 'ORG_ADMIN',
    ORG_MANAGER = 'ORG_MANAGER',
    TEACHER = 'TEACHER',
    STUDENT = 'STUDENT',
}

export enum OrgStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    SUSPENDED = 'SUSPENDED',
}

export enum SupportTopic {
    ACCOUNT_STATUS = 'ACCOUNT_STATUS',
    GENERAL_SUPPORT = 'GENERAL_SUPPORT',
    BUG_ISSUE = 'BUG_ISSUE',
    SUGGESTION = 'SUGGESTION',
}

export enum TeacherStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    ON_LEAVE = 'ON_LEAVE',
    DELETED = 'DELETED',
}

export enum StudentStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    ALUMNI = 'ALUMNI',
    DELETED = 'DELETED',
}

export enum OrganizationType {
    HIGH_SCHOOL = 'HIGH_SCHOOL',
    UNIVERSITY = 'UNIVERSITY',
    PRIMARY_SCHOOL = 'PRIMARY_SCHOOL',
    OTHER = 'OTHER',
}
