import { cn } from "@/lib/utils";

/**
 * DijitalBrains wordmark placeholder. Swap the inner content for the real
 * logo asset (e.g. /public/logo.svg) when it is exported from Figma.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <span className="text-2xl font-bold tracking-wide">
        <span className="text-primary">DIJITAL</span>
        <span className="text-secondary">BRAINS</span>
      </span>
      <span className="text-xs text-muted-foreground">Making Ideas Happen</span>
    </div>
  );
}
