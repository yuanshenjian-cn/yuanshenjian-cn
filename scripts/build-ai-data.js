#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");
const GitHubSlugger = require("github-slugger").default;

const { authorProfileData } = require("../lib/author-profile-data.js");

const POSTS_DIRECTORY = path.join(process.cwd(), "content", "blog");
const BRIEFINGS_DIRECTORY = path.join(process.cwd(), "content", "ai-briefings");
const OUTPUT_DIRECTORY = path.join(process.cwd(), "public", "ai-data");
const OUTPUT_FILE = path.join(OUTPUT_DIRECTORY, "index.json");
const OUTPUT_ARTICLES_DIRECTORY = path.join(OUTPUT_DIRECTORY, "articles");
const OUTPUT_BRIEFINGS_DIRECTORY = path.join(OUTPUT_DIRECTORY, "briefings");
const OUTPUT_BRIEFINGS_FILE = path.join(OUTPUT_BRIEFINGS_DIRECTORY, "index.json");
const OUTPUT_AUTHOR_FILE = path.join(OUTPUT_DIRECTORY, "author.json");
const EXCERPT_LENGTH = 200;
const SECTION_EXCERPT_LENGTH = 160;
const SKILL_LEVEL_LABELS = {
  master: "精通",
  proficient: "熟练",
  familiar: "熟悉",
};

function getAllMarkdownFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

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

function dedupeStrings(values) {
  return Array.from(new Set(values.filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim())));
}

function normalizeKeyword(value) {
  if (typeof value !== "string") {
    return "";
  }

  let text = toPlainText(value)
    .normalize("NFKC")
    .replace(/^(技能等级|专业认证)[：:]?/u, "")
    .replace(/^(精通|熟练|熟悉|擅长|采用|基于|引入|主导|负责|推动|完成|作为|这是一个|聚焦在|集成|实现|设计和落地)+/u, "")
    .replace(/^[\-—–:：，、；,.()（）\s]+|[\-—–:：，、；,.()（）\s]+$/gu, "")
    .trim();

  if (!text || text.length < 2 || text.length > 24) {
    return "";
  }

  return text;
}

function extractKeywordParts(...values) {
  return dedupeStrings(
    values.flatMap((value) => {
      if (Array.isArray(value)) {
        return extractKeywordParts(...value);
      }

      return String(value ?? "")
        .split(/[，、；|]+|\s+-\s+|\s*&\s*|[:：]/u)
        .map((item) => normalizeKeyword(item))
        .filter(Boolean);
    }),
  );
}

function createAuthorIdSlug(label) {
  const normalized = toPlainText(String(label ?? ""))
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "item";
}

function createAuthorScopedId(slugger, prefix, label) {
  return `${prefix}-${slugger.slug(createAuthorIdSlug(label))}`;
}

function parseEntityTitle(title) {
  const [organization, role] = String(title).split(/\s+-\s+/);

  return {
    organization: organization?.trim() || undefined,
    role: role?.trim() || undefined,
  };
}

function createAuthorChunk(input) {
  const section = createSection(input.id, input.heading, input.content, input.anchorId);

  return {
    ...section,
    sectionType: input.sectionType,
    entityType: input.entityType,
    entityId: input.entityId,
    ...(input.organization ? { organization: input.organization } : {}),
    ...(input.role ? { role: input.role } : {}),
    ...(input.period ? { period: input.period } : {}),
    ...(input.keywords?.length ? { keywords: input.keywords } : {}),
    ...(input.techs?.length ? { techs: input.techs } : {}),
  };
}

function toLegacySections(chunks) {
  return chunks.map(({ id, anchorId, heading, content, excerpt }) => ({
    id,
    anchorId,
    heading,
    content,
    excerpt,
  }));
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

function buildAuthorPayload() {
  const { hero, skills, education, experience, projects, extras } = authorProfileData;
  const slugger = new GitHubSlugger();
  slugger.reset();

  const profile = {
    id: hero.id,
    heading: hero.heading,
    name: hero.name,
    roles: hero.roles,
    phone: hero.phone,
    email: hero.email,
    summary: hero.summary,
  };
  const skillsEntities = skills.items.map((item) => ({
    id: createAuthorScopedId(slugger, "skill", item.title),
    title: item.title,
    level: item.level,
    icon: item.icon,
    description: item.description,
  }));
  const certificateEntities = skills.certificates.map((title) => ({
    id: createAuthorScopedId(slugger, "certificate", title),
    title,
  }));
  const educationEntity = {
    id: education.id,
    heading: education.heading,
    school: education.school,
    major: education.major,
    period: education.period,
    href: education.href,
  };
  const experienceEntities = experience.items.map((item) => ({
    id: createAuthorScopedId(slugger, "experience", item.title),
    title: item.title,
    period: item.period,
    description: item.description,
    list: item.list ?? [],
    ...parseEntityTitle(item.title),
  }));
  const projectEntities = projects.items.map((item) => ({
    id: createAuthorScopedId(slugger, "project", item.name),
    period: item.period,
    name: item.name,
    role: item.role,
    description: item.description,
    achievements: item.achievements,
    highlights: item.highlights ?? [],
    techs: (item.techs ?? []).map((tech) => tech.name),
    organization: parseEntityTitle(item.name).organization,
  }));
  const extraEntities = extras.groups.map((group) => ({
    id: createAuthorScopedId(slugger, "extra", group.title),
    title: group.title,
    items: group.items,
  }));

  const chunks = [
    createAuthorChunk({
      id: profile.id,
      anchorId: hero.id,
      heading: hero.heading,
      content: [
        profile.name,
        profile.roles.join("，"),
        ...profile.summary,
        `联系电话：${profile.phone}`,
        `邮箱：${profile.email}`,
      ].join("\n"),
      sectionType: hero.id,
      entityType: "profile",
      entityId: profile.id,
      keywords: dedupeStrings([...profile.roles, "软件架构", "服务端开发", "研发效能", "敏捷实践"]),
    }),
    ...skillsEntities.map((item) => {
      const levelLabel = SKILL_LEVEL_LABELS[item.level] ?? item.level;

      return createAuthorChunk({
        id: item.id,
        anchorId: skills.id,
        heading: `技能｜${item.title}`,
        content: [`技能等级：${levelLabel}`, item.description].join("\n"),
        sectionType: skills.id,
        entityType: "skill",
        entityId: item.id,
        keywords: dedupeStrings([item.title, levelLabel, ...extractKeywordParts(item.description)]),
      });
    }),
    ...certificateEntities.map((item) =>
      createAuthorChunk({
        id: item.id,
        anchorId: skills.id,
        heading: `证书｜${item.title}`,
        content: `专业认证：${item.title}`,
        sectionType: skills.id,
        entityType: "certificate",
        entityId: item.id,
        keywords: dedupeStrings([item.title, ...extractKeywordParts(item.title)]),
      }),
    ),
    createAuthorChunk({
      id: educationEntity.id,
      anchorId: education.id,
      heading: education.heading,
      content: [educationEntity.school, educationEntity.major, educationEntity.period, educationEntity.href ? `学校官网：${educationEntity.href}` : ""]
        .filter(Boolean)
        .join("\n"),
      sectionType: education.id,
      entityType: "education",
      entityId: educationEntity.id,
      period: educationEntity.period,
      keywords: dedupeStrings([educationEntity.school, educationEntity.major, ...extractKeywordParts(educationEntity.school, educationEntity.major)]),
    }),
    ...experienceEntities.map((item) =>
      createAuthorChunk({
        id: item.id,
        anchorId: experience.id,
        heading: `经历｜${item.title}`,
        content: [item.period, item.title, item.description, ...(item.list ?? [])].filter(Boolean).join("\n"),
        sectionType: experience.id,
        entityType: "experience",
        entityId: item.id,
        organization: item.organization,
        role: item.role,
        period: item.period,
        keywords: dedupeStrings([item.organization, item.role, ...extractKeywordParts(item.title, item.description, ...(item.list ?? []))]).slice(0, 8),
      }),
    ),
    ...projectEntities.map((item) =>
      createAuthorChunk({
        id: item.id,
        anchorId: projects.id,
        heading: `项目｜${item.name}`,
        content: [
          `时间：${item.period}`,
          `角色：${item.role}`,
          item.description,
          item.achievements.length > 0
            ? `核心成果：${item.achievements.map((achievement) => `${achievement.metric ? `${achievement.metric} ` : ""}${achievement.text}`).join("；")}`
            : "",
          item.highlights.length > 0 ? `主要职责和贡献：${item.highlights.map((highlight) => highlight.text).join("；")}` : "",
          item.techs.length > 0 ? `技术栈：${item.techs.join("、")}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        sectionType: projects.id,
        entityType: "project",
        entityId: item.id,
        organization: item.organization,
        role: item.role,
        period: item.period,
        keywords: dedupeStrings([
          item.organization,
          item.role,
          ...item.techs,
          ...item.achievements.map((achievement) => achievement.metric).filter(Boolean),
          ...extractKeywordParts(item.name, ...item.highlights.map((highlight) => highlight.text)),
        ]).slice(0, 12),
        techs: item.techs,
      }),
    ),
    ...extraEntities.map((group) =>
      createAuthorChunk({
        id: group.id,
        anchorId: extras.id,
        heading: `兴趣｜${group.title}`,
        content: [
          `${group.title}：`,
          ...group.items.map((item) => (item.type === "link" ? `${item.label}：${item.href}` : item.label)),
        ].join("\n"),
        sectionType: extras.id,
        entityType: "extra",
        entityId: group.id,
        keywords: dedupeStrings([group.title, ...group.items.map((item) => item.label)]),
      }),
    ),
  ];

  return {
    slug: "author",
    title: authorProfileData.hero.name,
    summary: authorProfileData.hero.roles.join(" | "),
    entities: {
      profile,
      skills: skillsEntities,
      certificates: certificateEntities,
      education: educationEntity,
      experiences: experienceEntities,
      projects: projectEntities,
      extras: extraEntities,
    },
    chunks,
    sections: toLegacySections(chunks),
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

function parseBriefingFile(filePath) {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    if (typeof data.title !== "string" || typeof data.date !== "string") {
      console.warn(`Skipping invalid briefing: ${path.relative(process.cwd(), filePath)}`);
      return null;
    }

    const tags = parseTags(data.tags);
    const excerpt = buildExcerpt(data.brief, content);

    if (data.published !== true || tags.length === 0 || !excerpt) {
      return null;
    }

    const slug = data.date;

    return {
      slug,
      title: data.title,
      excerpt,
      tags,
      date: new Date(data.date).toISOString(),
      url: `/ai/daily-briefings/${slug}`,
    };
  } catch (error) {
    console.error(`Error parsing briefing file ${path.relative(process.cwd(), filePath)}:`, error);
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
  const briefings = getAllMarkdownFiles(BRIEFINGS_DIRECTORY)
    .filter((filePath) => /\.md$/i.test(filePath))
    .map(parseBriefingFile)
    .filter((briefing) => briefing !== null)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  fs.rmSync(OUTPUT_ARTICLES_DIRECTORY, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_ARTICLES_DIRECTORY, { recursive: true });
  fs.rmSync(OUTPUT_BRIEFINGS_DIRECTORY, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_BRIEFINGS_DIRECTORY, { recursive: true });

  writeJson(
    OUTPUT_FILE,
    {
      generated: posts[0]?.date ?? "",
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

  writeJson(
    OUTPUT_BRIEFINGS_FILE,
    {
      generated: briefings[0]?.date ?? "",
      briefings,
    },
  );

  writeJson(OUTPUT_AUTHOR_FILE, buildAuthorPayload());

  console.log(`Generated ${posts.length} AI index entries at ${path.relative(process.cwd(), OUTPUT_FILE)}`);
  console.log(`Generated ${posts.length} page AI article payloads at ${path.relative(process.cwd(), OUTPUT_ARTICLES_DIRECTORY)}`);
  console.log(`Generated ${briefings.length} briefing AI index entries at ${path.relative(process.cwd(), OUTPUT_BRIEFINGS_FILE)}`);
  console.log(`Generated author AI payload at ${path.relative(process.cwd(), OUTPUT_AUTHOR_FILE)}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildAuthorPayload,
  extractArticleSections,
  main,
  parseBriefingFile,
  parsePostFile,
  toPlainText,
};
