export type CartItem = { slug: string; quantity: number };

export const FREE_SHIPPING_THRESHOLD = 90000;
export const NARI_CART_TOAST_EVENT = "nari-cart-toast";
export const NARI_CART_DRAWER_OPEN_EVENT = "nari-open-cart-drawer";

export interface CartToastDetail {
  slug: string;
  quantity: number;
  name?: string;
}

const key = "nari-cart";

/** Read normalized cart items from browser storage cleanly across SSR and client. */
export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value)
      ? value.filter(
          (item): item is CartItem =>
            typeof item?.slug === "string" && Number.isInteger(item.quantity) && item.quantity > 0,
        )
      : [];
  } catch {
    return [];
  }
}

/** Persist cart items and notify storefront listeners. */
export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event("demo-cart-change"));
}

/** Increment or insert an item into the cart and trigger the slide-over toast notification. */
export function addToCart(slug: string, quantity = 1, meta?: { name?: string }) {
  const safeQuantity = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
  const items = readCart();
  const found = items.find((item) => item.slug === slug);
  if (found) found.quantity += safeQuantity;
  else items.push({ slug, quantity: safeQuantity });
  saveCart(items);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<CartToastDetail>(NARI_CART_TOAST_EVENT, {
        detail: { slug, quantity: safeQuantity, name: meta?.name },
      }),
    );
  }
}
