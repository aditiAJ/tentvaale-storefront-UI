"use client";

import { useState } from "react";
import { Logo } from "./Logo";
import { IconButton } from "./IconButton";

export interface TopNavProps {
  items: string[];
  active?: string;
  onNavigate?: (label: string) => void;
  cartCount?: number;
  showMark?: boolean;
  markSrc?: string;
}

function NavItem({ label, active, onClick }: { label: string; active: boolean; onClick?: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "6px 0",
        fontFamily: "var(--font-ui)",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "0.02em",
        color: active || hover ? "var(--accent)" : "var(--text-primary)",
        transition: "var(--transition-control)",
      }}
    >
      {label}
      <span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          background: "var(--accent)",
          opacity: active ? 1 : hover ? 0.5 : 0,
          transition: "opacity var(--dur-fast) var(--ease-standard)",
        }}
      />
    </button>
  );
}

export function TopNav({ items, active, onNavigate, cartCount, showMark, markSrc }: TopNavProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 32,
        padding: "0 32px",
        minHeight: 72,
        background: "var(--surface-card)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <Logo variant={showMark ? "lockup" : "wordmark"} tone="auto" size={20} markSrc={markSrc} />
      <nav style={{ display: "flex", alignItems: "center", gap: 30 }}>
        {items.map((it) => (
          <NavItem key={it} label={it} active={it === active} onClick={() => onNavigate?.(it)} />
        ))}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <IconButton icon="search" label="Search" size="sm" />
        <IconButton icon="heart" label="Wishlist" size="sm" />
        <IconButton icon="user" label="Account" size="sm" />
        <IconButton icon="shopping-cart" label="Cart" size="sm" badge={cartCount} />
      </div>
    </header>
  );
}
