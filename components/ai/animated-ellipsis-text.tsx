import { cn } from "@/lib/utils";

interface AnimatedEllipsisTextProps {
  className?: string;
  text: string;
}

const DOT_DELAYS_MS = [0, 160, 320] as const;

export function AnimatedEllipsisText({ className, text }: AnimatedEllipsisTextProps) {
  return (
    <span className={cn("inline-flex", className)}>
      <span className="sr-only">{`${text}...`}</span>
      <span
        aria-hidden="true"
        className="inline-flex items-baseline animate-[pulse_1.8s_ease-in-out_infinite]"
      >
        <span>{text}</span>
        <span className="inline-flex pl-px">
          {DOT_DELAYS_MS.map((delay) => (
            <span
              key={delay}
              className="animate-pulse"
              style={{ animationDelay: `${delay}ms`, animationDuration: "1.2s" }}
            >
              .
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}
