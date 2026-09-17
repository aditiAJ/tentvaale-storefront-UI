import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Motion: a button reacts on press (scale down a hair, 90ms) rather than
// nudging down a pixel — compression reads as "pushed" and survives being
// interrupted, where a translate on an element that also lifts on hover fights
// itself. Hover/press are transform+shadow only, so both composite.
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap outline-none select-none [transition:background-color_200ms_var(--ease-out-quint),border-color_200ms_var(--ease-out-quint),color_200ms_var(--ease-out-quint),box-shadow_260ms_var(--ease-out-quint),transform_140ms_var(--ease-out-quint),opacity_200ms_var(--ease-out-quint)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_0_rgba(34,29,23,0.18),0_0_0_0_color-mix(in_oklab,var(--primary)_40%,transparent)] hover:bg-[color-mix(in_oklab,var(--primary),white_8%)] hover:shadow-[0_4px_14px_-4px_color-mix(in_oklab,var(--primary)_70%,transparent),0_0_20px_-2px_color-mix(in_oklab,var(--primary)_45%,transparent)]",
        outline:
          "border-border bg-background hover:border-primary/60 hover:bg-muted hover:text-foreground hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_35%,transparent),0_4px_14px_-6px_color-mix(in_oklab,var(--primary)_50%,transparent)] aria-expanded:border-primary/60 aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-e1 hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)] hover:shadow-e2 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 hover:shadow-[0_4px_14px_-6px_color-mix(in_oklab,var(--destructive)_60%,transparent)] focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline active:not-aria-[haspopup]:scale-100",
      },
      size: {
        // Heights were 6/7/8/9px-scale — cramped for a consumer storefront and
        // below the 44px tap target on the sizes used for primary actions.
        default:
          "h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-7 gap-1 rounded-md px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-[0.9375rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-[1.125rem]",
        icon: "size-9",
        "icon-xs":
          "size-7 rounded-md in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-11 [&_svg:not([class*='size-'])]:size-[1.125rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
