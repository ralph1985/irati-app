"use client";

import { CSSProperties, KeyboardEvent, PointerEvent, ReactNode, useRef, useState } from "react";

type BottomSheetStyles = Record<string, string>;

type BottomSheetProps = {
  ariaLabel: string;
  children: ReactNode;
  labelledBy: string;
  onClose: () => void;
  styles: BottomSheetStyles;
};

export function BottomSheet({
  ariaLabel,
  children,
  labelledBy,
  onClose,
  styles,
}: BottomSheetProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartYRef = useRef<number | null>(null);

  function closeSheet() {
    setDragOffset(0);
    dragStartYRef.current = null;
    onClose();
  }

  function handleSheetKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSheet();
    }
  }

  function handleHandleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      closeSheet();
    }
  }

  function handleDragStart(event: PointerEvent<HTMLDivElement>) {
    dragStartYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleDragMove(event: PointerEvent<HTMLDivElement>) {
    if (dragStartYRef.current === null) {
      return;
    }

    setDragOffset(Math.max(0, event.clientY - dragStartYRef.current));
  }

  function handleDragEnd() {
    if (dragOffset > 70) {
      closeSheet();
      return;
    }

    dragStartYRef.current = null;
    setDragOffset(0);
  }

  return (
    <div className={styles.sheetBackdrop} onClick={closeSheet}>
      <section
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-modal="false"
        className={styles.sheet}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleSheetKeyDown}
        role="dialog"
        style={
          {
            "--sheet-drag-offset": `${dragOffset}px`,
          } as CSSProperties
        }
      >
        <div
          aria-label={ariaLabel}
          className={styles.sheetHandle}
          onKeyDown={handleHandleKeyDown}
          onPointerCancel={handleDragEnd}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          role="button"
          tabIndex={0}
        >
          <span />
        </div>
        {children}
      </section>
    </div>
  );
}
