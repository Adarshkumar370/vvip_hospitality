import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface RupeeIconProps {
    className?: string;
}

interface RupeeAmountProps {
    value: ReactNode;
    className?: string;
    iconClassName?: string;
    amountClassName?: string;
    "aria-label"?: string;
}

export function RupeeIcon({ className }: RupeeIconProps) {
    return (
        <span
            aria-hidden="true"
            className={cn("inline-block h-[0.82em] w-[0.56em] shrink-0 translate-y-[0.04em] bg-current", className)}
            style={{
                WebkitMask: "url('/Indian_Rupee_symbol.svg') center / contain no-repeat",
                mask: "url('/Indian_Rupee_symbol.svg') center / contain no-repeat",
            }}
        />
    );
}

export function RupeeAmount({
    value,
    className,
    iconClassName,
    amountClassName,
    "aria-label": ariaLabel,
}: RupeeAmountProps) {
    return (
        <span className={cn("inline-flex items-baseline gap-1 whitespace-nowrap", className)} aria-label={ariaLabel}>
            <RupeeIcon className={iconClassName} />
            <span className={amountClassName}>{value}</span>
        </span>
    );
}
