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
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-border/50 bg-card/40 backdrop-blur-sm shrink-0">
            {totalResults !== undefined && pageSize !== undefined && (
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 order-2 sm:order-1 shrink-0">
                    <div className="text-xs sm:text-sm font-semibold text-muted-foreground">
                        {totalResults > 0 ? (
                            <>Showing <span className="text-primary">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-primary">{Math.min(currentPage * pageSize, totalResults)}</span> of <span className="text-primary">{totalResults}</span> results</>
                        ) : (
                            <>No results found</>
                        )}
                    </div>
                    
                    {onPageSizeChange && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] sm:text-xs font-semibold uppercase text-muted-foreground/70 tracking-wider">Rows:</span>
                            <select 
                                value={pageSize}
                                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                                disabled={isLoading}
                                className="bg-card px-2 py-1 rounded-lg border border-border/50 text-[10px] sm:text-xs font-semibold text-primary hover:border-primary/50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                <div className={`flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2 ${totalResults === undefined ? 'w-full justify-center' : ''}`}>
                    <button
                        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1 || isDisabled}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all group text-foreground font-semibold border border-transparent hover:border-primary/20 bg-card/30"
                    >
                        <ChevronLeft className="w-4 h-4 text-primary transition-transform group-hover:-translate-x-0.5" />
                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider hidden sm:inline">Previous</span>
                    </button>

                    <div className="flex items-center gap-1 px-1 sm:px-2">
                        {[...Array(totalPages)].map((_, i) => {
                            const page = i + 1;
                            if (totalPages > 7 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                                if (Math.abs(page - currentPage) === 3) return <span key={page} className="px-1 text-muted-foreground font-semibold">...</span>;
                                return null;
                            }
                            return (
                                <button
                                    key={page}
                                    onClick={() => onPageChange(page)}
                                    disabled={isDisabled}
                                    className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                                        currentPage === page 
                                            ? 'bg-primary text-primary-foreground shadow-lg transform scale-105' 
                                            : 'hover:bg-primary/10 text-foreground/80 border border-border/50 hover:border-primary/20 bg-card/50'
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
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all group text-foreground font-semibold border border-transparent hover:border-primary/20 bg-card/30"
                    >
                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider hidden sm:inline">Next</span>
                        <ChevronRight className="w-4 h-4 text-primary transition-transform group-hover:translate-x-0.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
