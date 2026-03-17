import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

export interface PaginationOptions {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
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
        sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const take = limit;

    return { skip, take, search, sortBy, sortOrder };
};

export const formatPaginatedResponse = <T>(
    data: T[],
    totalRecords: number,
    page: number = 1,
    limit: number = 10
): PaginatedResult<T> => {
    return {
        data,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page
    };
};

export const handleFileUpdate = async (
    oldUrl: string | null,
    file: Express.Multer.File,
) => {
    // 1. Delete old file from disk (best-effort)
    if (oldUrl) {
        const oldAbsolute = path.resolve(oldUrl.replace(/^\/uploads\//, 'uploads/'));
        if (fs.existsSync(oldAbsolute)) {
            try {
                fs.unlinkSync(oldAbsolute);
            } catch (err) {
                console.error(`Failed to delete old file: ${oldAbsolute}`, err);
            }
        }
    }

    // 2. Derive portable relative path
    const forwardSlash = file.path.replace(/\\/g, '/');
    const uploadsIndex = forwardSlash.indexOf('uploads/');
    const relativePath = uploadsIndex >= 0
        ? forwardSlash.slice(uploadsIndex)
        : forwardSlash;

    return `/${relativePath}`;
};

export const extractUpdateFields = async <T extends Record<string, any>>(
    data: T,
    userFields: string[],
    entityFields: string[],
    existingUserEmail?: string
) => {
    const userData: Prisma.UserUpdateInput = {};
    const entityData: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
        if (value === undefined) continue;

        if (userFields.includes(key)) {
            if (key === 'password' && typeof value === 'string' && value.trim() !== '') {
                userData.password = await bcrypt.hash(value, 10);
            } else if (key === 'email') {
                if (value !== existingUserEmail) {
                    userData.email = value;
                }
            } else {
                (userData as any)[key] = value;
            }
        } else if (entityFields.includes(key)) {
            entityData[key] = value;
        }
    }

    return { userData, entityData };
};

export const mapStatusCounts = <T extends string>(
    statusCounts: any[],
    allowedStatuses: Record<T, any>
): Record<T, number> => {
    const countsMap = {} as Record<T, number>;
    for (const status of Object.keys(allowedStatuses)) {
        countsMap[status as T] = 0;
    }

    statusCounts.forEach(c => {
        if (c.status in countsMap) {
            countsMap[c.status as T] = c._count._all || c._count.id || 0;
        }
    });

    return countsMap;
};
