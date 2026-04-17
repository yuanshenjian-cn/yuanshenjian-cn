import { Post } from "./blog";

export interface PaginatedPosts {
  posts: Post[];
  totalPosts: number;
  totalPages: number;
  currentPage: number;
}
