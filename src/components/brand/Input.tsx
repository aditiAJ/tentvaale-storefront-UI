"use client";

import { useId, useState } from "react";
import { Icon } from "./Icon";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  icon?: string;
  error?: string;
  wrapperClassName?: string;
}

export function Input({
  label,
  hint,
  icon,
  error,
  id,
  wrapperClassName,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focus, setFocus] = useState(false);
  const generatedId = useId();
  const uid = id || generatedId;

  return (
    <label htmlFor={uid} className={wrapperClassName} style={{ display: "grid", gap: 8 }}>
      {label && (
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "var(--tracking-label)",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </span>
      )}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 14px",
          minHeight: "var(--tap-min)",
          background: "var(--surface-card)",
          border: `1px solid ${error ? "var(--status-danger)" : focus ? "var(--border-accent)" : "var(--border-subtle)"}`,
          borderRadius: "var(--radius-button)",
          transition: "var(--transition-control)",
        }}
      >
        {icon && <Icon name={icon} size="sm" color={focus ? "var(--accent)" : "var(--text-muted)"} />}
        <input
          id={uid}
          onFocus={(e) => {
            setFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            onBlur?.(e);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            color: "var(--text-primary)",
            padding: "12px 0",
            ...style,
          }}
          {...rest}
        />
      </span>
      {(hint || error) && (
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: error ? "var(--status-danger)" : "var(--text-muted)",
          }}
        >
          {error || hint}
        </span>
      )}
    </label>
  );
}
