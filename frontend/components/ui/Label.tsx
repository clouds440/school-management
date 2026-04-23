import * as React from "react"

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, ...props }, ref) => {
        return (
            <label
                ref={ref}
                className={`block text-xs md:text-sm font-semibold tracking-wider text-foreground/70 mb-2 pl-1 transition-colors hover:text-foreground/90 ${className || ''}`}
                {...props}
            />
        )
    }
)
Label.displayName = "Label"

export { Label }
