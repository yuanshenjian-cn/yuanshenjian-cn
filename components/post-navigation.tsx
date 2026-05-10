import { Post } from "@/types/blog";
import { PrevNextNav } from "@/components/prev-next-nav";

interface PostNavigationProps {
  prev: Post | null;
  next: Post | null;
}

export function PostNavigation({ prev, next }: PostNavigationProps) {
  return <PrevNextNav prev={prev} next={next} />;
}
