export type CartItem = { slug: string; quantity: number };
const key = "nari-cart";

export function readCart(): CartItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value)
      ? value.filter(
          (item): item is CartItem =>
            typeof item?.slug === "string" && Number.isInteger(item.quantity) && item.quantity > 0
        )
      : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event("demo-cart-change"));
}

export function addToCart(slug: string, quantity = 1) {
  const items = readCart();
  const found = items.find((item) => item.slug === slug);
  if (found) found.quantity += quantity;
  else items.push({ slug, quantity });
  saveCart(items);
}
