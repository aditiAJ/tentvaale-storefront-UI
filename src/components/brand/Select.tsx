"use client";

import { useId } from "react";
import { Icon } from "./Icon";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  icon?: string;
  options: (string | SelectOption)[];
  placeholder?: string;
  wrapperClassName?: string;
}

export function Select({
  label,
  icon,
  options,
  placeholder,
  id,
  wrapperClassName,
  style,
  ...rest
}: SelectProps) {
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
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-button)",
        }}
      >
        {icon && <Icon name={icon} size="sm" color="var(--text-muted)" />}
        <select
          id={uid}
          style={{
            flex: 1,
            minWidth: 0,
            appearance: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            color: "var(--text-primary)",
            padding: "12px 0",
            cursor: "pointer",
            ...style,
          }}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => {
            const v = typeof o === "string" ? o : o.value;
            const l = typeof o === "string" ? o : o.label;
            return (
              <option key={v} value={v}>
                {l}
              </option>
            );
          })}
        </select>
        <Icon name="chevron-down" size="sm" color="var(--text-muted)" />
      </span>
    </label>
  );
}
