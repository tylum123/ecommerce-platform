"use client";

import { useEffect, useRef, useState } from "react";

export interface LazyRevealProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  rootMargin?: string;
  minHeight?: number;
  className?: string;
}

/**
 * Defers mounting below-the-fold content until it enters the viewport via IntersectionObserver.
 */
export function LazyReveal({
  children,
  fallback,
  rootMargin = "250px",
  minHeight,
  className,
}: LazyRevealProps) {
  const [visible, setVisible] = useState<boolean>(
    () => typeof window !== "undefined" && typeof IntersectionObserver === "undefined",
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (visible) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [visible, rootMargin]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={!visible && minHeight !== undefined ? { minHeight } : undefined}
    >
      {visible ? children : fallback}
    </div>
  );
}
