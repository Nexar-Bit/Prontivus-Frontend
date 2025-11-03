/**
 * Prontivus Medical Icon System
 * Professional, modern medical icons with consistent 24x24px size and 2px stroke width
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

const baseProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
} as const;

/**
 * Patient Profile Icon
 * User silhouette with subtle medical identifier
 */
export const PatientProfileIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        {...baseProps}
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        className={cn("stroke-current", className)}
        {...props}
      >
        {/* User head */}
        <circle cx="12" cy="7.5" r="3.5" />
        {/* User body */}
        <path d="M6 20.5c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        {/* Subtle medical identifier - small badge */}
        <circle cx="18" cy="6" r="2.5" className="opacity-60" />
        <path d="M18 4.5v3M16.5 6h3" className="opacity-80" strokeWidth={1.5} />
      </svg>
    );
  }
);
PatientProfileIcon.displayName = "PatientProfileIcon";

/**
 * Stethoscope Icon
 * Modern, clean stethoscope design
 */
export const StethoscopeIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        {...baseProps}
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        className={cn("stroke-current", className)}
        {...props}
      >
        {/* Left earpiece */}
        <path d="M3.5 4.5a2.5 2.5 0 0 1 2.5-2.5h1.5a2.5 2.5 0 0 1 2.5 2.5v1.5" />
        {/* Right earpiece */}
        <path d="M16.5 4.5a2.5 2.5 0 0 1 2.5-2.5h1.5a2.5 2.5 0 0 1 2.5 2.5v1.5" />
        {/* Tubing connection */}
        <path d="M6.5 6v2a5.5 5.5 0 0 0 5.5 5.5h0a5.5 5.5 0 0 0 5.5-5.5V6" />
        {/* Chest piece */}
        <circle cx="12" cy="17" r="3.5" />
        {/* Chest piece diaphragm */}
        <circle cx="12" cy="17" r="2" className="opacity-40" />
      </svg>
    );
  }
);
StethoscopeIcon.displayName = "StethoscopeIcon";

/**
 * Medical Calendar Icon
 * Calendar with subtle medical identifier
 */
export const MedicalCalendarIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        {...baseProps}
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        className={cn("stroke-current", className)}
        {...props}
      >
        {/* Calendar base */}
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 10h16" />
        {/* Calendar rings */}
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        {/* Appointment indicators */}
        <circle cx="9" cy="14" r="1" className="fill-current opacity-60" />
        <circle cx="12" cy="14" r="1" className="fill-current opacity-60" />
        <circle cx="15" cy="14" r="1" className="fill-current opacity-60" />
        {/* Subtle medical identifier */}
        <circle cx="17.5" cy="7.5" r="1.5" className="opacity-40" />
        <path d="M17.5 6.5v2M16.5 7.5h2" className="opacity-60" strokeWidth={1.5} />
      </svg>
    );
  }
);
MedicalCalendarIcon.displayName = "MedicalCalendarIcon";

/**
 * Prescription Pad Icon
 * Modern prescription document with Rx symbol
 */
export const PrescriptionPadIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        {...baseProps}
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        className={cn("stroke-current", className)}
        {...props}
      >
        {/* Document base */}
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        {/* Prescription lines */}
        <path d="M8 11h8" className="opacity-50" />
        <path d="M8 14h7" className="opacity-50" />
        <path d="M8 17h5" className="opacity-50" />
        {/* Rx symbol */}
        <path d="M16.5 12.5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" className="opacity-70" />
        <path d="M15 11.5l2 3M17 11.5l-2 3" className="opacity-80" />
      </svg>
    );
  }
);
PrescriptionPadIcon.displayName = "PrescriptionPadIcon";

/**
 * Laboratory Flask Icon
 * Modern laboratory flask/beaker
 */
export const LaboratoryFlaskIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        {...baseProps}
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        className={cn("stroke-current", className)}
        {...props}
      >
        {/* Flask neck */}
        <path d="M9 2v6" />
        <path d="M15 2v6" />
        {/* Flask body */}
        <path d="M6 8h12c0 4-2 8-2 12H8c0-4-2-8-2-12" />
        {/* Liquid */}
        <path d="M8 12h8" className="opacity-40" strokeDasharray="2 2" />
        <path d="M8 14h6" className="opacity-40" strokeDasharray="2 2" />
      </svg>
    );
  }
);
LaboratoryFlaskIcon.displayName = "LaboratoryFlaskIcon";

/**
 * Pharmacy Pill Bottle Icon
 * Modern pill bottle design
 */
export const PharmacyBottleIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        {...baseProps}
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        className={cn("stroke-current", className)}
        {...props}
      >
        {/* Bottle cap */}
        <rect x="8" y="2" width="8" height="4" rx="1" />
        {/* Bottle neck */}
        <path d="M9 6h6" />
        {/* Bottle body */}
        <rect x="7" y="6" width="10" height="16" rx="2" />
        {/* Label */}
        <rect x="8" y="9" width="8" height="4" rx="0.5" className="opacity-30" />
        {/* Pills inside */}
        <circle cx="11" cy="17" r="1.5" className="opacity-60" />
        <circle cx="13" cy="17" r="1.5" className="opacity-60" />
        <circle cx="11" cy="19" r="1.5" className="opacity-60" />
      </svg>
    );
  }
);
PharmacyBottleIcon.displayName = "PharmacyBottleIcon";

/**
 * Medical Finance Icon
 * Document with insurance/shield symbol
 */
export const MedicalFinanceIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        {...baseProps}
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        className={cn("stroke-current", className)}
        {...props}
      >
        {/* Document */}
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        {/* Document lines */}
        <path d="M8 12h7" className="opacity-50" />
        <path d="M8 15h6" className="opacity-50" />
        {/* Insurance shield */}
        <path d="M16 13.5c0 2-1.5 3.5-3.5 3.5S9 15.5 9 13.5v-2h7v2z" className="opacity-70" />
        <path d="M12.5 12.5v3M11 14h3" className="opacity-80" strokeWidth={1.5} />
      </svg>
    );
  }
);
MedicalFinanceIcon.displayName = "MedicalFinanceIcon";

/**
 * Secure Lock Icon
 * Medical-grade security lock with privacy emphasis
 */
export const SecureLockIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        {...baseProps}
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        className={cn("stroke-current", className)}
        {...props}
      >
        {/* Lock body */}
        <rect x="6" y="11" width="12" height="9" rx="1.5" />
        {/* Lock shackle */}
        <path d="M9.5 11V7.5a2.5 2.5 0 0 1 5 0V11" />
        {/* Security indicator - shield */}
        <path d="M12 14.5c-1 0-1.5-.8-1.5-1.5v-1h3v1c0 .7-.5 1.5-1.5 1.5z" className="opacity-60" />
        <path d="M12 13.5v2M11 14.5h2" className="opacity-70" strokeWidth={1.5} />
      </svg>
    );
  }
);
SecureLockIcon.displayName = "SecureLockIcon";

/**
 * Medical File Icon
 * File folder with medical cross
 */
export const MedicalFileIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        {...baseProps}
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        className={cn("stroke-current", className)}
        {...props}
      >
        {/* Folder */}
        <path d="M4 5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-7l-2-2H4z" />
        {/* Medical cross */}
        <circle cx="12" cy="13" r="3" className="opacity-30" />
        <path d="M12 11v4M10 13h4" />
      </svg>
    );
  }
);
MedicalFileIcon.displayName = "MedicalFileIcon";

/**
 * Medical Heart Icon
 * Modern heart with pulse line
 */
export const MedicalHeartIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        {...baseProps}
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        className={cn("stroke-current", className)}
        {...props}
      >
        {/* Heart shape */}
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        {/* Pulse line */}
        <path d="M6 12h2l1-3 1.5 4.5L12 10l1.5 3.5L15 12h3" className="opacity-60" />
      </svg>
    );
  }
);
MedicalHeartIcon.displayName = "MedicalHeartIcon";

/**
 * Medical Chart Icon
 * Chart with medical cross
 */
export const MedicalChartIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        {...baseProps}
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        className={cn("stroke-current", className)}
        {...props}
      >
        {/* Chart bars */}
        <rect x="4" y="16" width="3" height="4" />
        <rect x="9" y="12" width="3" height="8" />
        <rect x="14" y="8" width="3" height="12" />
        <rect x="19" y="6" width="3" height="14" />
        {/* Medical cross overlay */}
        <circle cx="14" cy="12" r="5" className="opacity-20" strokeDasharray="1 1" />
        <path d="M14 10v4M12 12h4" className="opacity-40" />
      </svg>
    );
  }
);
MedicalChartIcon.displayName = "MedicalChartIcon";

/**
 * Medical Record Icon
 * Clipboard with medical symbol
 */
export const MedicalRecordIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        {...baseProps}
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        className={cn("stroke-current", className)}
        {...props}
      >
        {/* Clipboard */}
        <path d="M9 2h6v4H9V2z" />
        <path d="M7 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
        {/* Lines */}
        <path d="M7 10h10" className="opacity-60" />
        <path d="M7 13h8" className="opacity-60" />
        <path d="M7 16h6" className="opacity-60" />
        {/* Medical symbol */}
        <circle cx="16" cy="13" r="2.5" className="opacity-30" />
        <path d="M16 11.5v3M14.5 13h3" className="opacity-60" />
      </svg>
    );
  }
);
MedicalRecordIcon.displayName = "MedicalRecordIcon";

