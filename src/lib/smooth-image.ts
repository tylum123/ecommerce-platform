/**
 * Pure DOM helpers for smooth image fade-in and shimmer frame completion.
 * Kept React-free so Node/CJS test harnesses can import it directly.
 */

/** Marks an `<img>` element and its `[data-img-frame]` ancestor as loaded. */
export function markImageContainerLoaded(img: HTMLImageElement | null): void {
  if (!img) return;
  img.dataset.loaded = "true";
  const frame = img.closest("[data-img-frame]");
  if (frame) {
    frame.setAttribute("data-img-loaded", "true");
  }
}

/** Syncs images that already finished loading from browser cache on ref attach. */
export function syncCachedImageRef(img: HTMLImageElement | null): void {
  if (img && img.complete) {
    markImageContainerLoaded(img);
  }
}

/** Handles `onLoad` callbacks by marking the image frame as loaded. */
export function handleSmoothImageLoad(event: { currentTarget: HTMLImageElement }): void {
  markImageContainerLoaded(event.currentTarget);
}

/** Handles `onError` callbacks so failed images stop shimmering cleanly. */
export function handleSmoothImageError(event: { currentTarget: HTMLImageElement }): void {
  markImageContainerLoaded(event.currentTarget);
}
