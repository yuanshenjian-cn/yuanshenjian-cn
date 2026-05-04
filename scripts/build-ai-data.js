#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");
const GitHubSlugger = require("github-slugger").default;

const { authorProfileData } = require("../lib/author-profile-data.js");

const POSTS_DIRECTORY = path.join(process.cwd(), "content", "blog");
const OUTPUT_DIRECTORY = path.join(process.cwd(), "public", "ai-data");
const OUTPUT_FILE = path.join(OUTPUT_DIRECTORY, "index.json");
const OUTPUT_ARTICLES_DIRECTORY = path.join(OUTPUT_DIRECTORY, "articles");
const OUTPUT_AUTHOR_FILE = path.join(OUTPUT_DIRECTORY, "author.json");
const EXCERPT_LENGTH = 200;
const SECTION_EXCERPT_LENGTH = 160;

function getAllMarkdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return getAllMarkdownFiles(fullPath);
    }

    return /\.mdx?$/i.test(entry.name) ? [fullPath] : [];
  });
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function toPlainText(markdown) {
  return normalizeWhitespace(
    markdown
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^>+\s?/gm, "")
      .replace(/^[-*+]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      .replace(/(^|\s)#{1,6}\s+/gm, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/~~([^~]+)~~/g, "$1")
      .replace(/\|/g, " "),
  );
}

function buildExcerpt(brief, content) {
  if (typeof brief === "string" && brief.trim()) {
    return brief.trim();
  }

  const plainText = toPlainText(content);
  if (!plainText) {
    return "";
  }

  return plainText.length > EXCERPT_LENGTH ? `${plainText.slice(0, EXCERPT_LENGTH)}...` : plainText;
}

function buildSectionExcerpt(content) {
  if (!content) {
    return "";
  }

  return content.length > SECTION_EXCERPT_LENGTH ? `${content.slice(0, SECTION_EXCERPT_LENGTH)}...` : content;
}

function parseTags(tags) {
  if (Array.isArray(tags)) {
    return tags.filter((tag) => typeof tag === "string");
  }

  return typeof tags === "string" ? [tags] : [];
}

function createSection(id, heading, content, anchorId = id) {
  const plainContent = toPlainText(content);

  return {
    id,
    anchorId,
    heading,
    content: plainContent,
    excerpt: buildSectionExcerpt(plainContent),
  };
}

function extractArticleSections(content) {
  const slugger = new GitHubSlugger();
  slugger.reset();

  const lines = content.split("\n");
  const sections = [];
  let inCodeBlock = false;
  let currentSection = {
    id: "intro",
    anchorId: "intro",
    heading: "前言",
    lines: [],
  };

  const pushCurrentSection = () => {
    const nextSection = createSection(
      currentSection.id,
      currentSection.heading,
      currentSection.lines.join("\n"),
      currentSection.anchorId,
    );

    if (nextSection.content) {
      sections.push(nextSection);
    }
  };

  for (const line of lines) {
    const codeBlockMatch = line.match(/^(\s*)(`{3,}|~{3,})\s*([a-zA-Z0-9+-]*)?\s*$/);
    if (codeBlockMatch) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      pushCurrentSection();
      const headingText = headingMatch[2].trim();
      const anchorId = slugger.slug(headingText);
      currentSection = {
        id: anchorId,
        anchorId,
        heading: headingText,
        lines: [],
      };
      continue;
    }

    currentSection.lines.push(line);
  }

  pushCurrentSection();

  if (sections.length === 0) {
    return [createSection("intro", "前言", content, "intro")];
  }

  return sections;
}

function buildAuthorSectionContent() {
  const { hero, skills, education, experience, projects, extras } = authorProfileData;

  return [
    {
      id: hero.id,
      anchorId: hero.id,
      heading: hero.heading,
      content: [
        hero.name,
        hero.roles.join("，"),
        ...hero.summary,
        `联系电话：${hero.phone}`,
        `邮箱：${hero.email}`,
      ].join("\n"),
    },
    {
      id: skills.id,
      anchorId: skills.id,
      heading: skills.heading,
      content: [
        skills.items.map((item) => `${item.title}：${item.description}`).join("\n"),
        `专业认证：${skills.certificates.join("、")}`,
      ].join("\n"),
    },
    {
      id: education.id,
      anchorId: education.id,
      heading: education.heading,
      content: `${education.school}，${education.major}，${education.period}`,
    },
    {
      id: experience.id,
      anchorId: experience.id,
      heading: experience.heading,
      content: experience.items
        .map((item) => [item.period, item.title, item.description, ...(item.list ?? [])].filter(Boolean).join("，"))
        .join("\n"),
    },
    {
      id: projects.id,
      anchorId: projects.id,
      heading: projects.heading,
      content: projects.items
        .map((item) =>
          [
            item.period,
            item.name,
            item.role,
            item.description,
            item.achievements.map((achievement) => `${achievement.metric ? `${achievement.metric} ` : ""}${achievement.text}`).join("；"),
            (item.highlights ?? []).map((highlight) => highlight.text).join("；"),
            (item.techs ?? []).map((tech) => tech.name).join("、"),
          ]
            .filter(Boolean)
            .join("，"),
        )
        .join("\n"),
    },
    {
      id: extras.id,
      anchorId: extras.id,
      heading: extras.heading,
      content: extras.groups
        .map((group) => `${group.title}：${group.items.map((item) => item.label).join("、")}`)
        .join("\n"),
    },
  ].map((section) => ({
    ...createSection(section.id, section.heading, section.content, section.anchorId),
  }));
}

function buildAuthorPayload() {
  return {
    slug: "author",
    title: authorProfileData.hero.name,
    summary: authorProfileData.hero.roles.join(" | "),
    sections: buildAuthorSectionContent(),
  };
}

function parsePostFile(filePath) {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    if (typeof data.title !== "string" || typeof data.date !== "string") {
      console.warn(`Skipping invalid post: ${path.relative(process.cwd(), filePath)}`);
      return null;
    }

    if (data.published === false) {
      return null;
    }

    const excerpt = buildExcerpt(data.brief, content);
    const sections = extractArticleSections(content);

    return {
      slug: path.basename(filePath).replace(/\.mdx?$/i, ""),
      title: data.title,
      excerpt,
      tags: parseTags(data.tags),
      date: new Date(data.date).toISOString(),
      sections,
    };
  } catch (error) {
    console.error(`Error parsing post file ${path.relative(process.cwd(), filePath)}:`, error);
    return null;
  }
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function main() {
  const posts = getAllMarkdownFiles(POSTS_DIRECTORY)
    .map(parsePostFile)
    .filter((post) => post !== null)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  fs.rmSync(OUTPUT_ARTICLES_DIRECTORY, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_ARTICLES_DIRECTORY, { recursive: true });

  writeJson(
    OUTPUT_FILE,
    {
      generated: new Date().toISOString(),
      posts: posts.map(({ slug, title, excerpt, tags, date }) => ({
        slug,
        title,
        excerpt,
        tags,
        date,
      })),
    },
  );

  for (const post of posts) {
    writeJson(path.join(OUTPUT_ARTICLES_DIRECTORY, `${post.slug}.json`), {
      slug: post.slug,
      title: post.title,
      date: post.date,
      excerpt: post.excerpt,
      tags: post.tags,
      sections: post.sections,
    });
  }

  writeJson(OUTPUT_AUTHOR_FILE, buildAuthorPayload());

  console.log(`Generated ${posts.length} AI index entries at ${path.relative(process.cwd(), OUTPUT_FILE)}`);
  console.log(`Generated ${posts.length} page AI article payloads at ${path.relative(process.cwd(), OUTPUT_ARTICLES_DIRECTORY)}`);
  console.log(`Generated author AI payload at ${path.relative(process.cwd(), OUTPUT_AUTHOR_FILE)}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildAuthorPayload,
  extractArticleSections,
  main,
  parsePostFile,
  toPlainText,
};
