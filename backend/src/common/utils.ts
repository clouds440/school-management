import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS!, 10);

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  my?: boolean;
  sectionId?: string;
  userId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

export const getPaginationOptions = (options: PaginationOptions) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;
  const take = limit;

  return { skip, take, search, sortBy, sortOrder };
};

export const formatPaginatedResponse = <T>(
  data: T[],
  totalRecords: number,
  page: number = 1,
  limit: number = 10,
): PaginatedResult<T> => {
  return {
    data,
    totalRecords,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: page,
  };
};

export const extractUpdateFields = async <T extends Record<string, unknown>>(
  data: T,
  userFields: string[],
  entityFields: string[],
  existingUserEmail?: string,
) => {
  const userData: Record<string, unknown> = {};
  const entityData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;

    if (userFields.includes(key)) {
      if (
        key === 'password' &&
        typeof value === 'string' &&
        value.trim() !== ''
      ) {
        userData.password = await bcrypt.hash(value, BCRYPT_ROUNDS);
      } else if (key === 'password') {
        // Skip empty password to preserve existing password
        continue;
      } else if (key === 'email') {
        if (value !== existingUserEmail) {
          userData.email = value;
        }
      } else {
        userData[key] = value;
      }
    } else if (entityFields.includes(key)) {
      entityData[key] = value;
    }
  }

  return { userData: userData as Prisma.UserUpdateInput, entityData };
};

export const mapStatusCounts = <T extends string>(
  statusCounts: { status: string; _count: { _all?: number; id?: number } }[],
  allowedStatuses: Record<T, unknown>,
): Record<T, number> => {
  const countsMap = {} as Record<T, number>;
  for (const status of Object.keys(allowedStatuses)) {
    countsMap[status as T] = 0;
  }

  statusCounts.forEach((c) => {
    if (c.status in countsMap) {
      countsMap[c.status as T] = c._count._all || c._count.id || 0;
    }
  });

  return countsMap;
};
