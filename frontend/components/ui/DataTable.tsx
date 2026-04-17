import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Pagination } from './Pagination';

export interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    sortable?: boolean;
    sortKey?: string; // Key to send to backend for sorting
    width?: number;
    sticky?: 'left' | 'right';
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (row: T) => string;
    onRowClick?: (row: T) => void;
    isLoading?: boolean;

    // Server-side props
    currentPage: number;
    totalPages: number;
    totalResults: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
    onSort?: (key: string, direction: 'asc' | 'desc') => void;
    getRowClassName?: (row: T) => string;
    disableZebra?: boolean;
    maxHeight?: string; // e.g., '500px' or 'calc(100vh - 300px)'
}

export function DataTable<T>({
    data,
    columns,
    keyExtractor,
    onRowClick,
    isLoading,
    currentPage,
    totalPages,
    totalResults,
    pageSize,
    onPageChange,
    onPageSizeChange,
    sortConfig,
    onSort,
    getRowClassName,
    disableZebra = false,
    maxHeight
}: DataTableProps<T>) {
    const [columnWidths, setColumnWidths] = useState<number[]>(columns.map(c => c.width || 200));
    const [resizingIndex, setResizingIndex] = useState<number | null>(null);

    const resizingRef = useRef<{ index: number; startX: number; startWidth: number } | null>(null);
    const tableRef = useRef<HTMLTableElement>(null);

    const handleSort = (index: number) => {
        const column = columns[index];
        if (!column.sortable || !onSort || isLoading) return;

        const key = column.sortKey || (typeof column.accessor === 'string' ? column.accessor : '');
        if (!key) return;

        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }

        onSort(key, direction);
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
        // eslint-disable-next-line react-hooks/immutability
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

    return (
        <div
            className="w-full overflow-hidden rounded-sm border border-border bg-card shadow-[0_8px_30px_var(--shadow-color)] ring-1 ring-foreground/5 relative flex flex-col"
            style={maxHeight ? { height: maxHeight } : {}}
        >
            <div className={`flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-border`}>
                <table
                    ref={tableRef}
                    className="w-full text-left text-sm text-card-text table-fixed"
                    style={{ minWidth: '100%', width: columnWidths.reduce((a, b) => a + b, 0) }}
                >
                    <thead className="bg-primary/30 text-[11px] uppercase tracking-wider font-black opacity-95 border-b border-border select-none sticky top-0 z-100 backdrop-blur-3xl shadow-md">
                        <tr>
                            {columns.map((col, index) => {
                                const key = col.sortKey || (typeof col.accessor === 'string' ? col.accessor : '');
                                const isSorted = sortConfig?.key === key;

                                return (
                                    <th
                                        key={index}
                                        style={{
                                            width: index === 0 ? columnWidths[index] + 30 : columnWidths[index]
                                        }}
                                        className={`
                                            px-6 py-5 border-b border-border whitespace-nowrap relative group/th
                                            ${col.sortable ? 'cursor-pointer hover:bg-primary/10' : ''}
                                        `}
                                        onClick={() => handleSort(index)}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="truncate">{col.header}</span>
                                            {col.sortable && (
                                                <span className="opacity-60 group-hover/th:text-primary group-hover/th:opacity-100 transition-colors shrink-0">
                                                    {isSorted ? (
                                                        sortConfig?.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />
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
                                            <div className="absolute right-0 top-1/4 h-1/2 w-0.5 bg-border group-hover/th:bg-primary/60 transition-colors" />
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/10 relative">
                        {data.length === 0 && !isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="p-12 text-center bg-card/30 border border-dashed border-border">
                                    <p className="text-card-text/50 font-bold">No data available</p>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <tr
                                    key={keyExtractor(row)}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`
                                        transition-colors duration-200 group relative h-20 border-b border-border
                                        ${(!disableZebra && rowIndex % 2 === 0) ? 'bg-card' : (!disableZebra ? 'bg-muted/30' : '')}
                                        ${onRowClick ? 'cursor-pointer hover:bg-primary/5' : ''}
                                        ${getRowClassName ? getRowClassName(row) : ''}
                                    `}
                                >
                                    {columns.map((col, index) => {
                                        const isActions = col.header === 'Actions';
                                        const content = typeof col.accessor === 'function'
                                            ? col.accessor(row)
                                            : (row[col.accessor as keyof T] as React.ReactNode);

                                        return (
                                            <td
                                                key={index}
                                                className={`py-2 align-middle ${isActions ? 'overflow-visible px-auto' : 'overflow-hidden px-6 '}`}
                                            >
                                                {isActions ? (
                                                    <div className="flex shrink-0 flex-nowrap w-max">
                                                        {content}
                                                    </div>
                                                ) : (
                                                    <div className="max-h-16 overflow-hidden line-clamp-2 wrap-break-word text-sm font-medium text-foreground/80">
                                                        {content}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-card/60 backdrop-blur-[1px] flex items-center justify-center z-20 transition-all duration-300">
                        <div className="flex flex-col items-center gap-3">
                            <div className="bg-primary shadow-lg p-3 rounded-full animate-bounce">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                            <span className="text-primary font-black text-[10px] uppercase tracking-[0.2em]">Refreshing Data...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                totalResults={totalResults}
                pageSize={pageSize}
                isLoading={isLoading}
            />
        </div>
    );
}
