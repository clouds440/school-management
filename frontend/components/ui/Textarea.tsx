import * as React from 'react'
import { LucideIcon } from 'lucide-react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon?: LucideIcon;
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, icon: Icon, error, ...props }, ref) => {
    return (
      <div className="relative group">
        {Icon && (
          <div className={`absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none transition-colors ${error ? 'text-red-500' : 'text-muted-foreground group-focus-within:text-primary'}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <textarea
          ref={ref}
          {...props}
          className={`w-full pl-11 pr-4 py-3 rounded-sm border bg-card text-foreground placeholder:text-muted-foreground transition-all duration-200 shadow-sm resize-none outline-none min-h-30 ${error ? 'border-red-500 ring-2 ring-red-500/20' : 'border-border focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20'} ${className || ''}`}
        />
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
