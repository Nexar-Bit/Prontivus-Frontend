"use client";

/* eslint-disable react/forbid-dom-props */
import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const numericValue = Number.isFinite(value) ? Math.round(value) : 0;
    const numericMax = Number.isFinite(max) ? Math.round(max) : 100;
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        role="progressbar"
        aria-valuenow={numericValue}
        aria-valuemin={0}
        aria-valuemax={numericMax}
        {...props}
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={
            {
              "--progress-width": `${percentage}%`,
              width: `${percentage}%`,
            } as React.CSSProperties
          }
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };

