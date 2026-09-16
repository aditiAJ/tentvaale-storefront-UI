"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-3 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit items-center justify-center rounded-xl p-1 text-muted-foreground group-data-horizontal/tabs:h-10 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none data-[variant=line]:p-0",
  {
    variants: {
      variant: {
        default: "bg-muted ring-1 ring-foreground/5 ring-inset",
        line: "gap-1 bg-transparent group-data-horizontal/tabs:border-b group-data-horizontal/tabs:border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * The sliding active-tab indicator. Base UI measures the active tab and
 * publishes --active-tab-left/top/width/height on this element, so the
 * indicator can animate between tabs with a plain CSS transition — no layout
 * library, and it survives tabs being added, removed or resized.
 */
function TabsIndicator({ className, ...props }: TabsPrimitive.Indicator.Props) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      renderBeforeHydration
      className={cn(
        "pointer-events-none absolute z-0 transition-[translate,width,height] duration-300 ease-out-quint",
        // Pill: a raised chip that slides behind the labels.
        "group-data-[variant=default]/tabs-list:top-1 group-data-[variant=default]/tabs-list:left-0 group-data-[variant=default]/tabs-list:h-[var(--active-tab-height)] group-data-[variant=default]/tabs-list:w-[var(--active-tab-width)] group-data-[variant=default]/tabs-list:translate-x-[var(--active-tab-left)] group-data-[variant=default]/tabs-list:rounded-lg group-data-[variant=default]/tabs-list:bg-background group-data-[variant=default]/tabs-list:shadow-e1 group-data-[variant=default]/tabs-list:ring-1 group-data-[variant=default]/tabs-list:ring-foreground/10",
        // Line: a gold rule that slides along the bottom edge.
        "group-data-[variant=line]/tabs-list:bottom-[-1px] group-data-[variant=line]/tabs-list:left-0 group-data-[variant=line]/tabs-list:h-0.5 group-data-[variant=line]/tabs-list:w-[var(--active-tab-width)] group-data-[variant=line]/tabs-list:translate-x-[var(--active-tab-left)] group-data-[variant=line]/tabs-list:rounded-full group-data-[variant=line]/tabs-list:bg-primary",
        className
      )}
      {...props}
    />
  )
}

function TabsList({
  className,
  variant = "default",
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {children}
      <TabsIndicator />
    </TabsPrimitive.List>
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        // z-10 keeps the label above the sliding indicator, which sits at z-0.
        "relative z-10 inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-colors duration-200 ease-out-quint group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Background comes from the sliding indicator, never from the tab itself.
        "data-active:text-foreground",
        "group-data-[variant=line]/tabs-list:h-9 group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:data-active:text-primary",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      // Panels fade+rise on activation. Base UI unmounts inactive panels
      // (keepMounted defaults to false), so the CSS animation replays on every
      // switch rather than firing once on first paint.
      className={cn("flex-1 animate-rise text-sm outline-none", className)}
      {...props}
    />
  )
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsIndicator,
  tabsListVariants,
}
