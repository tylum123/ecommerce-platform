import snapshot from "../../docs/research/hasaki/new-arrivals-2026-11-13.json";
import details from "../../docs/research/hasaki/new-product-details-2026-11-13.json";

export const newArrivals = snapshot.map(item => ({
  ...item,
  slug: item.url.split("/").pop() ?? "",
  numericPrice: Number(item.price.replace(/[^0-9]/g, "")),
  numericOld: Number((item.old ?? "").replace(/[^0-9]/g, "")),
  detail: details.find(detail => detail.url === item.url),
}));
