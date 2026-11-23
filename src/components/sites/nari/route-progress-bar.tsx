"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function toNormalizedRouteKey(pathname: string, search: string): string {
  const normalizedSearch = search.startsWith("?") ? search.slice(1) : search;
  return normalizedSearch ? `${pathname}?${normalizedSearch}` : pathname;
}

/**
 * Top thin navigation progress bar driven entirely via refs to satisfy React Compiler rules.
 */
export function RouteProgressBar() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const searchString = searchParams?.toString() ?? "";
  const routeKey = toNormalizedRouteKey(pathname, searchString);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const trickleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);
  const progressRef = useRef(0);
  const lastRouteRef = useRef<string | null>(null);

  const clearTimers = useCallback(() => {
    if (trickleTimerRef.current !== null) {
      clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (safetyTimerRef.current !== null) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const finishProgress = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearTimers();
    progressRef.current = 1;
    if (wrapRef.current) {
      wrapRef.current.style.opacity = "1";
    }
    if (barRef.current) {
      barRef.current.style.transform = "scaleX(1)";
    }
    hideTimerRef.current = setTimeout(() => {
      if (wrapRef.current) {
        wrapRef.current.style.opacity = "0";
      }
      hideTimerRef.current = setTimeout(() => {
        if (!activeRef.current && barRef.current) {
          barRef.current.style.transform = "scaleX(0)";
          progressRef.current = 0;
        }
        hideTimerRef.current = null;
      }, 220);
    }, 220);
  }, [clearTimers]);

  const startProgress = useCallback(() => {
    clearTimers();
    activeRef.current = true;
    progressRef.current = 0.18;
    if (wrapRef.current) {
      wrapRef.current.style.opacity = "1";
    }
    if (barRef.current) {
      barRef.current.style.transform = "scaleX(0.18)";
    }

    trickleTimerRef.current = setInterval(() => {
      if (!activeRef.current) return;
      const current = progressRef.current;
      const remaining = 0.86 - current;
      if (remaining <= 0.005) return;
      const next = Math.min(0.86, current + Math.max(0.015, remaining * 0.22));
      progressRef.current = next;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${next})`;
      }
    }, 260);

    safetyTimerRef.current = setTimeout(() => {
      finishProgress();
    }, 10000);
  }, [clearTimers, finishProgress]);

  useEffect(() => {
    if (lastRouteRef.current === null) {
      lastRouteRef.current = routeKey;
      if (activeRef.current) {
        finishProgress();
      }
      return;
    }
    if (lastRouteRef.current !== routeKey) {
      lastRouteRef.current = routeKey;
      finishProgress();
    }
  }, [routeKey, finishProgress]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target.toLowerCase() === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#")) return;

      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);
        if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") return;
        if (targetUrl.origin !== currentUrl.origin) return;
        if (targetUrl.pathname + targetUrl.search === currentUrl.pathname + currentUrl.search) {
          return;
        }
        startProgress();
      } catch {
        // Ignore malformed URLs safely.
      }
    };

    const handlePopState = () => {
      const nextSearch = new URLSearchParams(window.location.search).toString();
      const nextRouteKey = toNormalizedRouteKey(window.location.pathname, nextSearch);
      if (lastRouteRef.current === null || nextRouteKey !== lastRouteRef.current) {
        startProgress();
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, [startProgress, clearTimers]);

  return (
    <div
      ref={wrapRef}
      className="nari-route-progress"
      aria-hidden="true"
      data-testid="nari-route-progress"
    >
      <div ref={barRef} className="nari-route-progress__bar" />
    </div>
  );
}
