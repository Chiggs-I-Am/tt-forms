import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1 rounded-none border border-transparent px-2 py-0.5 text-xs font-medium tracking-widest whitespace-nowrap uppercase transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border-border text-muted-foreground",
        secondary: "bg-secondary text-secondary-foreground",
      },
    },
  }
);
