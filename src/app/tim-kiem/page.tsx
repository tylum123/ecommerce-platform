import { SearchView } from "@/components/sites/hasaki/search-view";

export default async function Page({searchParams}:{searchParams:Promise<{q?:string;sort?:string}>}) {
  const {q="",sort="position"}=await searchParams;
  return <SearchView key={q} query={q} sort={sort} />;
}
