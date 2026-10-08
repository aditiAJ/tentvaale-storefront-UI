"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** What the server takes: JPEG, PNG or WebP, up to 10 MB. Checked here first so the message is clear. */
export const COVER_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const COVER_MAX_BYTES = 10 * 1024 * 1024;

/**
 * What the customer did to the picture in a form that is not saved yet: chose a new file, or took the
 * current one away. Nothing is sent until they press Create or Save, so Cancel changes nothing.
 */
export interface CoverChange {
  file: File | null;
  removed: boolean;
}
export const NO_COVER_CHANGE: CoverChange = { file: null, removed: false };

/** Why this file cannot be used, in words for the customer; null when it can. */
export function coverFileProblem(file: File): string | null {
  if (!(COVER_TYPES as readonly string[]).includes(file.type)) return "Use a JPEG, PNG or WebP photo.";
  if (file.size > COVER_MAX_BYTES) return `That photo is ${(file.size / 1048576).toFixed(1)} MB. Use one under 10 MB.`;
  if (file.size === 0) return "That file is empty.";
  return null;
}

/**
 * "A picture of your event": a drop area to add one, and a preview with Replace and Remove once there
 * is one. `currentUrl` is the picture the plan already has (none on a new plan).
 */
export function PlanCoverField({
  currentUrl,
  change,
  onChange,
  disabled,
  className,
}: {
  currentUrl?: string;
  change: CoverChange;
  onChange: (change: CoverChange) => void;
  disabled?: boolean;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  // Preview addresses live as long as the form: let the browser free the file when the form goes.
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  function replacePreview(file: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = file ? URL.createObjectURL(file) : null;
    setPreviewUrl(previewRef.current);
  }

  function pick(file: File | undefined) {
    if (!file || disabled) return;
    const problem = coverFileProblem(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    replacePreview(file);
    onChange({ file, removed: false });
  }

  function remove() {
    setError(null);
    replacePreview(null);
    // A photo only picked in this form is simply forgotten; a saved one is removed when they save.
    onChange({ file: null, removed: Boolean(currentUrl) });
  }

  const shown = change.file ? previewUrl : change.removed ? null : (currentUrl ?? null);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-foreground">
        Photo of your event <span className="font-normal text-muted-foreground">(optional)</span>
      </span>

      {shown ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
          {/* A plain <img>: the picture is a local preview or a storage address, which next/image has nothing to optimise. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shown} alt="Your event" className="aspect-[16/7] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-linear-to-t from-black/70 to-transparent p-2.5 pt-8">
            <span className="text-xs text-white/90">{change.file ? "Saved when you press the button below" : "Your current photo"}</span>
            <span className="flex gap-1.5">
              <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={() => input.current?.click()} className="gap-1.5">
                <Upload className="size-3.5" /> Replace
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={remove} className="gap-1.5" aria-label="Remove photo">
                <Trash2 className="size-3.5" /> Remove
              </Button>
            </span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            pick(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
            dragging ? "border-primary bg-primary/10" : "border-border bg-muted/30",
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ImagePlus className="size-5" />
          </span>
          <p className="text-sm text-foreground">{dragging ? "Drop the photo here" : "Add a photo of your event"}</p>
          <p className="text-xs text-muted-foreground">The venue, the mood board or the look you want. JPEG, PNG or WebP, up to 10 MB.</p>
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => input.current?.click()} className="mt-1 gap-1.5">
            <Upload className="size-3.5" /> Upload photo
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <input
        ref={input}
        type="file"
        accept={COVER_TYPES.join(",")}
        hidden
        aria-label="Photo of your event"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Cleared so choosing the same file again still counts.
          event.target.value = "";
          pick(file);
        }}
      />
    </div>
  );
}
