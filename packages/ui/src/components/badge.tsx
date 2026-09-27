import { type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { badgeVariants } from "@workspace/ui/components/badge-variants";

const Badge = ({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) => {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
};

export { Badge };
