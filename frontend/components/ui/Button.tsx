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
            variantClasses = "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/60 focus:ring-4 focus:ring-primary/30";
        } else if (variant === 'secondary') {
            variantClasses = "bg-accent text-foreground border border-border/50 hover:bg-accent/90 disabled:bg-accent/60 disabled:text-muted-foreground focus:ring-4 focus:ring-secondary/20";
        } else if (variant === 'danger') {
            variantClasses = "bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:bg-destructive/60 focus:ring-4 focus:ring-destructive/30";
        } else if (variant === 'success') {
            variantClasses = "bg-emerald-600 text-foreground hover:bg-emerald-600/90 disabled:bg-emerald-600/60 focus:ring-4 focus:ring-emerald-500/30";
        } else if (variant === 'warning') {
            variantClasses = "bg-amber-600 text-foreground hover:bg-amber-600/90 disabled:bg-amber-600/60 focus:ring-4 focus:ring-amber-500/30";
        } else if (variant === 'black') {
            variantClasses = "bg-black text-background hover:bg-black/90 hover:text-foreground disabled:bg-black/60 disabled:opacity-70 border border-border/50 focus:ring-4 focus:ring-foreground/20";
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
