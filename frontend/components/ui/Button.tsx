import * as React from "react"
import { useGlobal } from "@/context/GlobalContext"
import { useAccess } from "@/hooks/useAccess"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean
    loadingText?: string
    loadingId?: string
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'black'
    icon?: React.ElementType
    px?: string
    py?: 'py-2.5' | string;
    requireWrite?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, isLoading: localIsLoading, loadingId, loadingText, variant = 'primary', children, disabled, icon, px = 'px-6', py = 'py-3', requireWrite, ...props }, ref) => {
        const { state } = useGlobal();
        const { canWrite } = useAccess();

        // Determine effective loading/disabled state
        const isThisButtonProcessing = loadingId ? state.ui.processing[loadingId] : false;
        const accessDisabled = requireWrite && !canWrite;
        const effectiveDisabled = disabled || isThisButtonProcessing || localIsLoading || accessDisabled;

        // Only show spinner if local loading is true OR this specific button is processing
        const effectiveLoading = localIsLoading || isThisButtonProcessing;
        
        let variantClasses = "";
        if (variant === 'primary') {
            variantClasses = "bg-linear-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 focus:ring-4 focus:ring-primary/30";
        } else if (variant === 'secondary') {
            variantClasses = "bg-linear-to-r from-accent to-accent/80 text-foreground border-border/50 hover:from-accent/90 hover:to-accent/70 hover:shadow-lg hover:shadow-secondary/20 hover:-translate-y-0.5 active:translate-y-0 focus:ring-4 focus:ring-secondary/20 disabled:from-secondary/50 disabled:to-secondary/40 disabled:text-muted-foreground";
        } else if (variant === 'danger') {
            variantClasses = "bg-linear-to-r from-destructive to-destructive/90 text-destructive-foreground hover:from-destructive/90 hover:to-destructive hover:shadow-xl hover:shadow-destructive/30 hover:-translate-y-0.5 active:translate-y-0 focus:ring-4 focus:ring-destructive/30 disabled:from-destructive/30";
        } else if (variant === 'success') {
            variantClasses = "bg-linear-to-r from-emerald-600 to-emerald-500 text-foreground hover:from-emerald-700 hover:to-emerald-600 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 focus:ring-4 focus:ring-emerald-500/30 disabled:from-emerald-300";
        } else if (variant === 'warning') {
            variantClasses = "bg-linear-to-r from-amber-600 to-amber-500 text-foreground hover:from-amber-700 hover:to-amber-600 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0 focus:ring-4 focus:ring-amber-500/30 disabled:from-amber-300";
        } else if (variant === 'black') {
            variantClasses = "bg-linear-to-r from-black/70 to-black/60 text-background hover:text-foreground hover:from-black/80 hover:to-black/70 border-border/50 hover:shadow-lg hover:shadow-foreground/10 hover:-translate-y-0.5 active:translate-y-0 focus:ring-4 focus:ring-foreground/20 disabled:opacity-50";
        }

        return (
            <button
                className={`
          group relative flex justify-center items-center space-x-3 cursor-pointer
          rounded-2xl border border-transparent ${px} ${py} text-base font-bold
          focus:outline-none focus:ring-4
          transition-all duration-300 shadow-lg
          ${variantClasses}
          ${effectiveDisabled ? 'pointer-events-none cursor-not-allowed opacity-90' : ''}
          ${className || ''}
        `}
                disabled={effectiveDisabled}
                ref={ref}
                title={accessDisabled ? "You do not have permission to perform this action (Read-only mode)" : props.title}
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
