import * as React from "react"
import { LucideIcon } from "lucide-react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: LucideIcon;
    error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, icon: Icon, error, ...props }, ref) => {
        return (
            <div className="relative group">
                {Icon && (
                    <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${error ? 'text-red-500' : 'text-gray-400 group-focus-within:text-primary'}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                )}
                <input
                    type={type}
                    className={`
            block w-full rounded-sm border bg-white 
            ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 
            text-card-text placeholder:text-card-text/40 
            transition-all duration-200 shadow-sm
            ${error 
                ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/50 focus:border-primary focus:ring-primary/20' 
                : 'border-gray-200 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20'
            }
            sm:text-sm
            ${className || ''}
          `}
                    ref={ref}
                    {...props}
                />
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
