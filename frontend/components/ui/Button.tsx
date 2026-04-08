import * as React from "react"
import { useGlobal } from "@/context/GlobalContext"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean
    loadingText?: string
    loadingId?: string
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'black'
    icon?: React.ElementType
    iconPosition?: 'start' | 'end'
    px?: string
    py?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, isLoading: localIsLoading, loadingId, loadingText, variant = 'primary', children, disabled, icon, iconPosition = 'start', px = 'px-6', py = 'py-3', ...props }, ref) => {
        const { state } = useGlobal();

        // Determine effective loading/disabled state
        const isGlobalBusy = state.ui.isProcessing || state.ui.isLoading;
        const effectiveDisabled = disabled || isGlobalBusy || localIsLoading;

        // Only show spinner if:
        // 1. Local loading is true
        // 2. Global processing is true AND (no specific ID was tracked OR the ID matches this button)
        const effectiveLoading = localIsLoading || (state.ui.isProcessing && (!state.ui.processingId || state.ui.processingId === (loadingId || props.id)));

        let variantClasses = "";
        if (variant === 'primary') {
            variantClasses = "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/20 hover:-translate-y-0.5 focus:ring-primary/20 disabled:bg-primary/50";
        } else if (variant === 'secondary') {
            variantClasses = "bg-accent text-foreground border-border hover:bg-accent/80 hover:shadow-md hover:-translate-y-0.5 focus:ring-secondary/20 disabled:bg-secondary/50 disabled:text-muted-foreground";
        } else if (variant === 'danger') {
            variantClasses = "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-destructive/20 hover:-translate-y-0.5 focus:ring-destructive/20 disabled:bg-destructive/30";
        } else if (variant === 'success') {
            variantClasses = "bg-emerald-600 text-foreground hover:bg-emerald-700 hover:shadow-emerald-500/20 hover:-translate-y-0.5 focus:ring-emerald-500/20 disabled:bg-emerald-300";
        } else if (variant === 'warning') {
            variantClasses = "bg-amber-600 text-foreground hover:bg-amber-700 hover:shadow-amber-500/20 hover:-translate-y-0.5 focus:ring-amber-500/20 disabled:bg-amber-300";
        } else if (variant === 'black') {
            variantClasses = "bg-black/60 text-background hover:text-foreground hover:bg-background/80 border-border hover:shadow-foreground/10 hover:-translate-y-0.5 focus:ring-foreground/20 disabled:opacity-50";
        }

        return (
            <button
                className={`
          group relative flex justify-center items-center space-x-3 cursor-pointer
          rounded-sm border border-transparent ${px} ${py} text-base font-bold
          focus:outline-none focus:ring-4
          transition-all duration-300 shadow-lg
          ${variantClasses}
          ${effectiveDisabled ? 'pointer-events-none cursor-not-allowed opacity-70' : ''}
          ${className || ''}
        `}
                disabled={effectiveDisabled}
                ref={ref}
                {...props}
            >
                {effectiveLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {loadingText && <span>{loadingText}</span>}
                    </>
                ) : (
                    <>
                        {icon && (
                            <div className="w-5 h-5 shrink-0">
                                {React.createElement(icon, { className: "w-full h-full" })}
                            </div>
                        )}
                        {children && <span>{children}</span>}
                    </>
                )}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }
