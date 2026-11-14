import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SupportArticleView } from "@/components/sites/hasaki/support-view";
import { getSupportTopicBySlug, getSupportTopics } from "@/lib/support-stores";

export async function generateStaticParams() {
  const topics = getSupportTopics();
  return topics.map((t) => ({
    slug: t.slug
  }));
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = getSupportTopicBySlug(slug);
  if (!topic) {
    return {
      title: "Hỗ trợ khách hàng | Nari Home"
    };
  }
  return {
    title: `${topic.title} | Nari Home`,
    description: topic.summary
  };
}

export default async function SupportTopicPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  const topic = getSupportTopicBySlug(slug);

  if (!topic) {
    notFound();
  }

  return <SupportArticleView topic={topic} />;
}
