export type BrandFilterOptions = { query: string; category: string; min: number | null; max: number | null; deals: boolean; sort: "default" | "low" | "high" };
export function filterBrandProducts<T extends { name: string; brand: string; category: string; price: number; old: number }>(items: readonly T[], options: BrandFilterOptions): T[] {
  const term = options.query.trim().toLocaleLowerCase("vi");
  return items.filter(item => (!options.deals || item.price < item.old) && (!options.category || item.category === options.category) && (!term || `${item.name} ${item.brand}`.toLocaleLowerCase("vi").includes(term)) && (options.min === null || item.price >= options.min) && (options.max === null || item.price <= options.max)).sort((a, b) => options.sort === "low" ? a.price - b.price : options.sort === "high" ? b.price - a.price : 0);
}
