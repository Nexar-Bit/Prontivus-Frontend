import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-lg border-2 bg-background px-4 py-2 text-sm shadow-sm transition-all duration-200 outline-none focus-visible:shadow-md disabled:cursor-not-allowed disabled:opacity-50 medical-form-input",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
