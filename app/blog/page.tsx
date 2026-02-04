import { getAllPosts, getAllTags } from "@/lib/blog";
import { BlogList } from "@/components/blog-list";

export const dynamic = "force-static";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const posts = getAllPosts();
  const tags = getAllTags();
  const params = await searchParams;
  const initialTag = typeof params.tag === "string" ? params.tag : null;

  return (
    <main className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-medium mb-2">博客文章</h1>
          <p className="text-muted-foreground">
            共 {posts.length} 篇文章 · {tags.length} 个标签
          </p>
        </div>
        <BlogList posts={posts} tags={tags} initialTag={initialTag} />
      </div>
    </main>
  );
}
