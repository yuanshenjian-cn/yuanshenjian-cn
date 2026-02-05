export const config = {
  posts: {
    perPage: 12,
  },
  readingTime: {
    charactersPerMinute: 600,
    wordsPerMinute: 200,
  },
} as const;

export const POSTS_PER_PAGE = config.posts.perPage;
