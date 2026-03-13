import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    sortable?: boolean;
    sortAccessor?: (row: T) => string | number;
    width?: number;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (row: T) => string;
    onRowClick?: (row: T) => void;
    isLoading?: boolean;
}

export function DataTable<T>({ data, columns, keyExtractor, onRowClick, isLoading }: DataTableProps<T>) {
    const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [columnWidths, setColumnWidths] = useState<number[]>(columns.map(c => c.width || 200));
    const [resizingIndex, setResizingIndex] = useState<number | null>(null);

    const resizingRef = useRef<{ index: number; startX: number; startWidth: number } | null>(null);
    const tableRef = useRef<HTMLTableElement>(null);

    const pageSize = 10;

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

            if (String(aValue) < String(bValue)) return direction === 'asc' ? -1 : 1;
            if (String(aValue) > String(bValue)) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, columns, sortConfig]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

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

    const handleMouseDown = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        resizingRef.current = {
            index,
            startX: e.clientX,
            startWidth: columnWidths[index]
        };
        setResizingIndex(index);
        document.body.style.cursor = 'col-resize';
    };

    useEffect(() => {
        if (resizingIndex === null) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (resizingRef.current !== null) {
                const { index, startX, startWidth } = resizingRef.current;
                const diff = e.clientX - startX;
                setColumnWidths(prev => {
                    const next = [...prev];
                    next[index] = Math.max(80, startWidth + diff);
                    return next;
                });
            }
        };

        const handleMouseUp = () => {
            setResizingIndex(null);
            resizingRef.current = null;
            document.body.style.cursor = 'default';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingIndex]);

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
                <table
                    ref={tableRef}
                    className="w-full text-left text-sm text-card-text table-fixed"
                    style={{ minWidth: '100%', width: columnWidths.reduce((a, b) => a + b, 0) }}
                >
                    <thead className="bg-primary/5 text-[11px] uppercase tracking-wider font-black opacity-60 border-b border-gray-200/20 select-none">
                        <tr>
                            {columns.map((col, index) => {
                                const isSorted = sortConfig?.key === index;
                                return (
                                    <th
                                        key={index}
                                        style={{ width: columnWidths[index] }}
                                        className={`px-6 py-5 whitespace-nowrap relative group/th ${col.sortable ? 'cursor-pointer hover:bg-primary/5' : ''}`}
                                        onClick={() => handleSort(index)}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="truncate">{col.header}</span>
                                            {col.sortable && (
                                                <span className="opacity-40 group-hover/th:text-primary group-hover/th:opacity-100 transition-colors shrink-0">
                                                    {isSorted ? (
                                                        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />
                                                    ) : (
                                                        <ChevronsUpDown className="w-4 h-4 opacity-0 group-hover/th:opacity-100" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        {/* Resize Handle */}
                                        <div
                                            onMouseDown={(e) => handleMouseDown(e, index)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize group-hover/th:bg-primary/20 transition-colors z-10"
                                        >
                                            <div className="absolute right-0 top-1/4 h-1/2 w-[2px] bg-gray-300 group-hover/th:bg-primary/40 transition-colors" />
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/10">
                        {paginatedData.map((row, rowIndex) => (
                            <tr
                                key={keyExtractor(row)}
                                onClick={() => onRowClick && onRowClick(row)}
                                className={`
                                    transition-colors duration-200 group relative h-20
                                    ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-200/50'}
                                    ${onRowClick ? 'cursor-pointer hover:bg-primary/5' : ''}
                                `}
                            >
                                {columns.map((col, index) => {
                                    const content = typeof col.accessor === 'function'
                                        ? col.accessor(row)
                                        : (row[col.accessor as keyof T] as React.ReactNode);

                                    return (
                                        <td key={index} className="px-6 py-2 align-middle overflow-hidden">
                                            <div className="max-h-16 overflow-hidden line-clamp-2 wrap-break-word text-sm font-medium text-gray-700">
                                                {content}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100/10 bg-primary/5">
                    <div className="text-xs font-bold text-card-text/40">
                        Showing <span className="text-primary">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-primary">{Math.min(currentPage * pageSize, sortedData.length)}</span> of <span className="text-primary">{sortedData.length}</span> results
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-sm hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => {
                                const page = i + 1;
                                if (totalPages > 7 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                                    if (Math.abs(page - currentPage) === 3) return <span key={page} className="px-2 text-card-text/40">...</span>;
                                    return null;
                                }
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-sm text-xs font-black transition-all ${currentPage === page ? 'bg-primary text-primary-text shadow-lg transform scale-110' : 'hover:bg-primary/10 text-card-text/60'}`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-sm hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
