#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");

const POSTS_DIRECTORY = path.join(process.cwd(), "content", "blog");
const OUTPUT_DIRECTORY = path.join(process.cwd(), "public", "ai-data");
const OUTPUT_FILE = path.join(OUTPUT_DIRECTORY, "index.json");
const EXCERPT_LENGTH = 200;

function getAllMarkdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return getAllMarkdownFiles(fullPath);
    }

    return /\.mdx?$/i.test(entry.name) ? [fullPath] : [];
  });
}

function buildExcerpt(brief, content) {
  if (typeof brief === "string" && brief.trim()) {
    return brief.trim();
  }

  return `${content.slice(0, EXCERPT_LENGTH).replace(/[#*_]/g, "")}...`;
}

function parseTags(tags) {
  if (Array.isArray(tags)) {
    return tags.filter((tag) => typeof tag === "string");
  }

  return typeof tags === "string" ? [tags] : [];
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

    return {
      slug: path.basename(filePath).replace(/\.mdx?$/i, ""),
      title: data.title,
      excerpt: buildExcerpt(data.brief, content),
      tags: parseTags(data.tags),
      date: new Date(data.date).toISOString(),
    };
  } catch (error) {
    console.error(`Error parsing post file ${path.relative(process.cwd(), filePath)}:`, error);
    return null;
  }
}

function main() {
  const posts = getAllMarkdownFiles(POSTS_DIRECTORY)
    .map(parsePostFile)
    .filter((post) => post !== null)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        posts,
      },
      null,
      2,
    ),
  );

  console.log(`Generated ${posts.length} AI index entries at ${path.relative(process.cwd(), OUTPUT_FILE)}`);
}

main();
