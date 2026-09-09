import { notFound } from "next/navigation";
import { AuthorProfileView } from "./author-profile-view";
import { fetchBuilds, fetchHeroes, fetchUserProfile } from "../../_lib/api";
import { mapFeed, mapHeroes } from "../../_lib/api-mapping";
import { pageSize } from "../../_lib/pagination";

export const dynamic = "force-dynamic";

async function loadAuthor(id: string) {
  try {
    const [profile, apiHeroes] = await Promise.all([fetchUserProfile(id), fetchHeroes()]);
    const heroes = mapHeroes(apiHeroes);
    const feed = await fetchBuilds({ page: 1, pageSize, author: id });

    return { profile, builds: mapFeed(feed.items, heroes), total: feed.total, heroes };
  } catch {
    return null;
  }
}

export default async function AuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const author = await loadAuthor((await params).id);

  if (!author) notFound();

  return <AuthorProfileView profile={author.profile} initialBuilds={author.builds} total={author.total} heroes={author.heroes} />;
}
