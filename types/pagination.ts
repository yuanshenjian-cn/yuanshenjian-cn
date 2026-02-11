import { Post } from "./blog";

export interface PaginatedPosts {
  posts: Post[];
  totalPosts: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export interface PaginationNavProps {
  currentPage: number;
  totalPages: number;
  mode: "link" | "button";
  baseUrl?: string;
  onPageChange?: (page: number) => void;
}
