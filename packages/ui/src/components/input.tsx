import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";

const Input = ({
  className,
  type,
  ...props
}: InputPrimitive.Props & { readonly type?: React.HTMLInputTypeAttribute }) => {
  return (
    <InputPrimitive
      data-slot="input"
      type={type}
      className={cn(
        "h-11 w-full rounded-none border border-input bg-background px-3 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:bg-input/30",
        className
      )}
      {...props}
    />
  );
};

export { Input };
