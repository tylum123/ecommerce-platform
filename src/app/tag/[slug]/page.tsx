import { TagView } from "@/components/sites/hasaki/tag-view";

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalizedSlug = slug.endsWith(".html") ? slug : `${slug}.html`;
  return <TagView slug={normalizedSlug} />;
}
