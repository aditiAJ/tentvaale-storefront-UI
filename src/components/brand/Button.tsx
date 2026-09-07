"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "gold";
export type ButtonSize = "sm" | "md" | "lg";

const PAD: Record<ButtonSize, string> = { sm: "10px 18px", md: "14px 26px", lg: "18px 34px" };
const FS: Record<ButtonSize, number> = { sm: 12, md: 13, lg: 15 };

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconAfter?: string;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconAfter,
  fullWidth,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const on = hover && !disabled;

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: "var(--tap-min)",
    padding: PAD[size],
    width: fullWidth ? "100%" : undefined,
    borderRadius: "var(--radius-button)",
    fontFamily: "var(--font-ui)",
    fontWeight: 700,
    fontSize: FS[size],
    letterSpacing: "var(--tracking-label)",
    textTransform: "uppercase",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.38 : 1,
    border: "1px solid transparent",
    transition: "var(--transition-control)",
    transform: press && !disabled ? "translateY(var(--press-offset))" : "none",
    whiteSpace: "nowrap",
  };

  const skin: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: on ? "var(--btn-primary-bg-hover)" : "var(--btn-primary-bg)",
      color: on ? "var(--btn-primary-text-hover)" : "var(--btn-primary-text)",
    },
    secondary: {
      background: "transparent",
      color: on ? "var(--accent)" : "var(--btn-secondary-text)",
      borderColor: on ? "var(--accent)" : "var(--btn-secondary-border)",
    },
    ghost: {
      background: "transparent",
      color: on ? "var(--accent)" : "var(--text-secondary)",
      letterSpacing: "var(--tracking-nav)",
    },
    gold: {
      background: on ? "var(--warm-beige)" : "var(--luxury-gold)",
      color: "var(--graphite-black)",
    },
  };

  const ink =
    variant === "primary"
      ? on
        ? "var(--btn-primary-text-hover)"
        : "var(--btn-primary-text)"
      : variant === "gold"
        ? "var(--graphite-black)"
        : "currentColor";

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPress(false);
      }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{ ...base, ...skin[variant], ...style }}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === "lg" ? "md" : "sm"} color={ink} />}
      {children}
      {iconAfter && <Icon name={iconAfter} size={size === "lg" ? "md" : "sm"} color={ink} />}
    </button>
  );
}
