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
                    <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none input-icon-container z-10 ${error ? 'input-icon-error' : ''}`}>
                        <Icon className="h-5 w-5 stroke-primary" />
                    </div>
                )}
                <input
                    type={type}
                    className={`
            block w-full rounded-2xl border bg-input
            ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3
            text-card-foreground placeholder:text-muted-foreground
            transition-all duration-200 shadow-sm outline-none
            ${error
                ? 'border-destructive ring-2 ring-destructive/20 bg-destructive/5 focus:border-primary focus:ring-primary/20'
                : 'border-border focus:bg-input focus:border-primary focus:ring-2 focus:ring-primary/20'
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
