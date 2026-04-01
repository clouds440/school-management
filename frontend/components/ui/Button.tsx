import * as React from "react"
import { useGlobal } from "@/context/GlobalContext"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean
    loadingText?: string
    loadingId?: string
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
    icon?: React.ElementType
    iconPosition?: 'start' | 'end'
    px?: string
    py?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, isLoading: localIsLoading, loadingId, loadingText = "LOADING...", variant = 'primary', children, disabled, icon, iconPosition = 'start', px = 'px-6', py = 'py-3', ...props }, ref) => {
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
            variantClasses = "bg-primary text-primary-text hover:bg-primary-hover hover:shadow-2xl hover:-translate-y-1 focus:ring-(--primary)/20 disabled:bg-primary/50 disabled:hover:translate-y-0";
        } else if (variant === 'secondary') {
            variantClasses = "bg-gray-300 text-gray-900 border-gray-200/50 hover:bg-gray-400 hover:shadow-lg hover:-translate-y-1 focus:ring-(--secondary)/20 disabled:bg-secondary/50 disabled:text-gray-400 disabled:hover:translate-y-0";
        } else if (variant === 'danger') {
            variantClasses = "bg-red-600 text-white hover:bg-red-700 hover:shadow-2xl hover:-translate-y-1 focus:ring-red-500/20 disabled:bg-red-300 disabled:hover:translate-y-0";
        } else if (variant === 'success') {
            variantClasses = "bg-green-600 text-white hover:bg-green-700 hover:shadow-2xl hover:-translate-y-1 focus:ring-green-500/20 disabled:bg-green-300 disabled:hover:translate-y-0";
        } else if (variant === 'warning') {
            variantClasses = "bg-yellow-600 text-white hover:bg-yellow-700 hover:shadow-2xl hover:-translate-y-1 focus:ring-yellow-500/20 disabled:bg-yellow-300 disabled:hover:translate-y-0";
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
                        <span>{loadingText}</span>
                    </>
                ) : (
                    <>
                        {icon && (
                            <div className="w-5 h-5 shrink-0">
                                {React.createElement(icon, { className: "w-full h-full" })}
                            </div>
                        )}
                        <span>{children}</span>
                    </>
                )}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }
