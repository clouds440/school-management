import * as React from "react"
import { LucideIcon } from "lucide-react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: LucideIcon
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, icon: Icon, ...props }, ref) => {
        return (
            <div className="relative group">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                        <Icon className="h-5 w-5" />
                    </div>
                )}
                <input
                    type={type}
                    className={`
            block w-full rounded-sm border border-gray-200 bg-gray-50/50 
            ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 
            text-gray-900 placeholder-gray-400 
            focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 
            sm:text-sm transition-all duration-200 shadow-sm
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
