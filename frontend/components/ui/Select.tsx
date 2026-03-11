import * as React from "react"
import { LucideIcon } from "lucide-react"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    icon?: LucideIcon
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, icon: Icon, children, ...props }, ref) => {
        return (
            <div className="relative group">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                        <Icon className="h-5 w-5" />
                    </div>
                )}
                <select
                    className={`
            block w-full rounded-sm border border-gray-200/50 bg-primary/5
            ${Icon ? 'pl-11' : 'pl-4'} pr-10 py-3 
            text-card-text focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/10 
            sm:text-sm transition-all duration-200 shadow-sm appearance-none
            ${className || ''}
          `}
                    ref={ref}
                    {...props}
                >
                    {children}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        )
    }
)
Select.displayName = "Select"

export { Select }
