import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalResults?: number;
    pageSize?: number;
    onPageSizeChange?: (size: number) => void;
    isLoading?: boolean;
}

export function Pagination({ currentPage, totalPages, onPageChange, totalResults, pageSize, onPageSizeChange, isLoading }: PaginationProps) {
    const isDisabled = isLoading;

    return (
        <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200/20 bg-white/40 backdrop-blur-sm shrink-0">
            {totalResults !== undefined && pageSize !== undefined && (
                <div className="flex flex-col sm:flex-row items-center gap-4 order-2 sm:order-1 shrink-0">
                    <div className="text-xs font-bold text-card-text/40">
                        {totalResults > 0 ? (
                            <>Showing <span className="text-primary">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-primary">{Math.min(currentPage * pageSize, totalResults)}</span> of <span className="text-primary">{totalResults}</span> results</>
                        ) : (
                            <>No results found</>
                        )}
                    </div>
                    
                    {onPageSizeChange && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-card-text/30 tracking-widest">Rows:</span>
                            <select 
                                value={pageSize}
                                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                                disabled={isLoading}
                                className="bg-white px-2 py-1 rounded-sm border border-gray-200/50 text-[10px] font-black text-primary hover:border-primary/30 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20"
                            >
                                {[10, 20, 50, 100].map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}
            
            {totalPages > 1 && (
                <div className={`flex items-center gap-1 order-1 sm:order-2 ${totalResults === undefined ? 'w-full justify-center' : ''}`}>
                    <button
                        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1 || isDisabled}
                        className="flex items-center gap-2 px-4 py-2 rounded-sm hover:bg-primary/10 disabled:opacity-20 disabled:hover:bg-transparent transition-all group text-card-text font-bold border border-transparent hover:border-primary/20 bg-white/30"
                    >
                        <ChevronLeft className="w-4 h-4 text-primary transition-transform group-hover:-translate-x-0.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Previous</span>
                    </button>

                    <div className="flex items-center gap-1 px-2">
                        {[...Array(totalPages)].map((_, i) => {
                            const page = i + 1;
                            if (totalPages > 7 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                                if (Math.abs(page - currentPage) === 3) return <span key={page} className="px-1 text-card-text/40 font-black">...</span>;
                                return null;
                            }
                            return (
                                <button
                                    key={page}
                                    onClick={() => onPageChange(page)}
                                    disabled={isDisabled}
                                    className={`w-8 h-8 flex items-center justify-center rounded-sm text-[11px] font-black transition-all ${
                                        currentPage === page 
                                            ? 'bg-primary text-white shadow-lg transform scale-110' 
                                            : 'hover:bg-primary/10 text-card-text/80 border border-gray-200/50 hover:border-primary/20 bg-white/50'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages || isDisabled}
                        className="flex items-center gap-2 px-4 py-2 rounded-sm hover:bg-primary/10 disabled:opacity-20 disabled:hover:bg-transparent transition-all group text-card-text font-bold border border-transparent hover:border-primary/20 bg-white/30"
                    >
                        <span className="text-[10px] font-black uppercase tracking-wider">Next</span>
                        <ChevronRight className="w-4 h-4 text-primary transition-transform group-hover:translate-x-0.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
