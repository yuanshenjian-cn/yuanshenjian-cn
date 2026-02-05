import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const posts = getAllPosts();
  const siteUrl = "https://yuanshenjian.cn";
  const authorName = "袁慎建";
  const authorEmail = "yuanshenjian@foxmail.com";

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${authorName}的博客</title>
    <link>${siteUrl}</link>
    <description>记录思考，分享成长。技术实践、敏捷方法、生活随笔。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/images/resume/ysj-avator.webp</url>
      <title>${authorName}的博客</title>
      <link>${siteUrl}</link>
    </image>
    <copyright>© ${new Date().getFullYear()} ${authorName}</copyright>
    <managingEditor>${authorEmail} (${authorName})</managingEditor>
    <webMaster>${authorEmail} (${authorName})</webMaster>
    <generator>Next.js 15</generator>
    ${posts
      .slice(0, 20)
      .map((post) => {
        const postUrl = `${siteUrl}/articles/${post.year}/${post.month}/${post.day}/${post.slug}`;
        return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <author>${authorEmail} (${authorName})</author>
      <category>${post.tags?.join("</category><category>") || ""}</category>
      <description><![CDATA[${post.excerpt}]]></description>
    </item>`;
      })
      .join("")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
