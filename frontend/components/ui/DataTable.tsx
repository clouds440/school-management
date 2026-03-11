import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    sortable?: boolean;
    sortAccessor?: (row: T) => string | number;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (row: T) => string;
    isLoading?: boolean;
}

export function DataTable<T>({ data, columns, keyExtractor, isLoading }: DataTableProps<T>) {
    const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;

        const { key, direction } = sortConfig;
        const column = columns[key];

        return [...data].sort((a, b) => {
            let aValue: unknown;
            let bValue: unknown;

            if (column.sortAccessor) {
                aValue = column.sortAccessor(a);
                bValue = column.sortAccessor(b);
            } else if (typeof column.accessor === 'string') {
                aValue = (a as Record<string, unknown>)[column.accessor];
                bValue = (b as Record<string, unknown>)[column.accessor];
            } else {
                return 0;
            }

            if (aValue === bValue) return 0;
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return direction === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return direction === 'asc' ? aValue - bValue : bValue - aValue;
            }

            // Fallback for other types (e.g., booleans or dates)
            if (String(aValue) < String(bValue)) return direction === 'asc' ? -1 : 1;
            if (String(aValue) > String(bValue)) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, columns, sortConfig]);

    const handleSort = (index: number) => {
        const column = columns[index];
        if (!column.sortable) return;

        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === index && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig && sortConfig.key === index && sortConfig.direction === 'desc') {
            setSortConfig(null);
            return;
        }
        setSortConfig({ key: index, direction });
    };

    if (isLoading) {
        return (
            <div className="p-12 text-center text-(--primary)/60 font-bold flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
                Loading data...
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="p-12 text-center bg-card/30 rounded-sm border border-dashed border-gray-200/50">
                <p className="text-card-text/50 font-bold">No data available</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden rounded-sm border border-gray-200/20 bg-card shadow-[0_8px_30px_var(--shadow-color)] ring-1 ring-gray-900/5">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                <table className="w-full text-left text-sm text-card-text min-w-[600px]">
                    <thead className="bg-primary/5 text-[11px] uppercase tracking-wider font-black opacity-60 border-b border-gray-200/20 select-none">
                        <tr>
                            {columns.map((col, index) => {
                                const isSorted = sortConfig?.key === index;
                                return (
                                    <th
                                        key={index}
                                        className={`px-6 py-5 whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:bg-primary/5 transition-colors group' : ''}`}
                                        onClick={() => handleSort(index)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.header}
                                            {col.sortable && (
                                                <span className="opacity-40 group-hover:text-primary group-hover:opacity-100 transition-colors shrink-0">
                                                    {isSorted ? (
                                                        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />
                                                    ) : (
                                                        <ChevronsUpDown className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/10">
                        {sortedData.map((row, rowIndex) => (
                            <tr
                                key={keyExtractor(row)}
                                className="hover:bg-primary/5 transition-colors duration-200 group relative"
                            >
                                {columns.map((col, index) => (
                                    <td key={index} className="px-6 py-5 transition-all">
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(row)
                                            : (row[col.accessor as keyof T] as React.ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
