import React from 'react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (row: T) => string;
    isLoading?: boolean;
}

export function DataTable<T>({ data, columns, keyExtractor, isLoading }: DataTableProps<T>) {
    if (isLoading) {
        return <div className="p-8 text-center text-gray-500 animate-pulse">Loading data...</div>;
    }

    if (data.length === 0) {
        return <div className="p-8 text-center text-gray-500">No data available</div>;
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500 border-b border-gray-200">
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} className="px-6 py-4">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {data.map((row, rowIndex) => (
                        <tr
                            key={keyExtractor(row)}
                            className="hover:bg-indigo-50/40 transition-all duration-200 group animate-scale-in"
                            style={{ animationDelay: `${rowIndex * 50}ms` }}
                        >
                            {columns.map((col, index) => (
                                <td key={index} className="px-6 py-4 group-hover:px-7 transition-all">
                                    {typeof col.accessor === 'function'
                                        ? col.accessor(row)
                                        // @ts-ignore
                                        : row[col.accessor] as React.ReactNode}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
