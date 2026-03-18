import * as React from "react"

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, ...props }, ref) => {
        return (
            <label
                ref={ref}
                className={`block text-sm font-bold text-gray-700 mb-1.5 pl-1 ${className || ''}`}
                {...props}
            />
        )
    }
)
Label.displayName = "Label"

export { Label }
