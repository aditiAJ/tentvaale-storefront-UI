"use client";

import { useState } from "react";
import { Icon } from "./Icon";

const BOX = { sm: 36, md: 44, lg: 52 } as const;

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  icon: string;
  size?: keyof typeof BOX;
  label: string;
  badge?: number | string;
}

export function IconButton({ icon, size = "md", label, badge, style, ...rest }: IconButtonProps) {
  const [hover, setHover] = useState(false);
  const box = BOX[size];

  return (
    <button
      type="button"
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        width: box,
        height: box,
        display: "inline-grid",
        placeItems: "center",
        borderRadius: "var(--radius-button)",
        background: "transparent",
        border: "1px solid transparent",
        cursor: "pointer",
        transition: "var(--transition-control)",
        ...style,
      }}
      {...rest}
    >
      <Icon name={icon} size={size === "sm" ? "sm" : "md"} color={hover ? "var(--accent)" : "var(--icon-color)"} />
      {badge != null && (
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 2,
            minWidth: 16,
            height: 16,
            padding: "0 4px",
            display: "grid",
            placeItems: "center",
            borderRadius: "var(--radius-pill)",
            background: "var(--luxury-gold)",
            color: "var(--graphite-black)",
            fontFamily: "var(--font-ui)",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
