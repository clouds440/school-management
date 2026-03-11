import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean
    loadingText?: string
    variant?: 'primary' | 'secondary' | 'danger'
    icon?: React.ElementType
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, isLoading, loadingText = "LOADING...", variant = 'primary', children, disabled, icon, ...props }, ref) => {

        let variantClasses = "";
        if (variant === 'primary') {
            variantClasses = "bg-primary text-primary-text hover:bg-primary-hover hover:shadow-2xl hover:-translate-y-1 focus:ring-(--primary)/20 disabled:bg-primary/50 disabled:hover:translate-y-0";
        } else if (variant === 'secondary') {
            variantClasses = "bg-secondary text-secondary-text border-gray-200/50 hover:bg-secondary-hover hover:shadow-lg hover:-translate-y-1 focus:ring-(--secondary)/20 disabled:bg-secondary/50 disabled:text-gray-400 disabled:hover:translate-y-0";
        } else if (variant === 'danger') {
            variantClasses = "bg-red-600 text-white hover:bg-red-700 hover:shadow-2xl hover:-translate-y-1 focus:ring-red-500/20 disabled:bg-red-300 disabled:hover:translate-y-0";
        }

        return (
            <button
                className={`
          group relative flex justify-center items-center space-x-3 
          rounded-sm border border-transparent py-3 px-6 text-base font-bold
          focus:outline-none focus:ring-4
          transition-all duration-300 shadow-lg
          ${variantClasses}
          ${className || ''}
        `}
                disabled={isLoading || disabled}
                ref={ref}
                {...props}
            >
                {isLoading ? (
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
