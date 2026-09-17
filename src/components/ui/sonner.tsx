"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      position="bottom-right"
      offset={16}
      // Mobile keeps clear of the fixed bottom tab bar (h-16) in site-mobile-nav.
      mobileOffset={{ bottom: "5.5rem", left: "1rem", right: "1rem" }}
      visibleToasts={4}
      gap={10}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "calc(var(--radius) * 1.4)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast !shadow-e4 !ring-1 !ring-foreground/10 !gap-3 !p-4 !items-start",
          title: "!font-medium !text-[0.875rem]",
          description: "!text-muted-foreground !text-[0.8125rem] !leading-5",
          actionButton:
            "!bg-primary !text-primary-foreground !rounded-lg !h-8 !px-3 !text-xs !font-medium",
          cancelButton:
            "!bg-muted !text-muted-foreground !rounded-lg !h-8 !px-3 !text-xs",
          icon: "!mt-0.5",
          success: "[&_[data-icon]]:text-[var(--success)]",
          warning: "[&_[data-icon]]:text-[var(--warning)]",
          error: "[&_[data-icon]]:text-destructive",
          info: "[&_[data-icon]]:text-primary",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
