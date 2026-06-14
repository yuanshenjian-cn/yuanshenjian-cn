"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { fetchComments, submitComment, type PublicComment } from "@/lib/core-service-client";
import { loadTurnstileScript } from "@/lib/turnstile";

interface CommentSectionProps {
  slug: string;
  turnstileSiteKey: string;
}

function CommentItem({ comment, onReply }: { comment: PublicComment; onReply: (comment: PublicComment) => void }) {
  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="mb-2 text-sm text-muted-foreground">
        {comment.display_name} · {new Date(comment.created_at).toLocaleString("zh-CN")}
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: comment.content_html }} />
      <button className="mt-3 text-xs text-muted-foreground hover:text-foreground" type="button" onClick={() => onReply(comment)}>
        回复
      </button>
      {comment.replies.length > 0 ? (
        <div className="mt-4 space-y-3 border-l pl-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function CommentSection({ slug, turnstileSiteKey }: CommentSectionProps) {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [replyTo, setReplyTo] = useState<PublicComment | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    void fetchComments(slug).then(setComments);
  }, [slug]);

  useEffect(() => {
    if (!turnstileSiteKey || !turnstileContainerRef.current) {
      return;
    }
    let cancelled = false;
    void loadTurnstileScript().then(() => {
      if (cancelled || !window.turnstile || !turnstileContainerRef.current || turnstileWidgetIdRef.current) {
        return;
      }
      turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: turnstileSiteKey,
        action: "comment_submit",
        callback: (token) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [turnstileSiteKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (turnstileSiteKey && !turnstileToken) {
      setMessage("请先完成人机验证。");
      return;
    }
    const ok = await submitComment(slug, {
      displayName,
      email: email || undefined,
      content,
      turnstileToken,
      parentId: replyTo?.id,
    });
    if (ok) {
      setContent("");
      setReplyTo(null);
      setTurnstileToken("");
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
      }
      setMessage("评论已提交，审核后展示。");
    } else {
      setMessage("评论提交失败，请稍后重试。");
    }
  }

  return (
    <section className="mt-12" aria-label="评论区">
      <h2 className="mb-4 text-lg font-medium">评论</h2>
      <form className="mb-6 rounded-xl border bg-card p-4" onSubmit={handleSubmit}>
        {replyTo ? (
          <div className="mb-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            正在回复 {replyTo.display_name}
            <button className="ml-3 underline" type="button" onClick={() => setReplyTo(null)}>
              取消
            </button>
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            昵称
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
          </label>
          <label className="text-sm">
            邮箱（可选，不公开）
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          评论内容
          <textarea className="mt-1 min-h-28 w-full rounded-md border bg-background px-3 py-2" value={content} onChange={(event) => setContent(event.target.value)} required />
        </label>
        <p className="mt-2 text-xs text-muted-foreground">支持 Markdown 安全子集。匿名评论会在审核通过后展示。</p>
        {turnstileSiteKey ? <div className="mt-3" ref={turnstileContainerRef} /> : null}
        <button className="mt-3 rounded-full bg-foreground px-4 py-2 text-sm text-background" type="submit">
          提交评论
        </button>
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </form>
      <div className="space-y-4">
        {comments.length > 0 ? comments.map((comment) => <CommentItem key={comment.id} comment={comment} onReply={setReplyTo} />) : <p className="text-sm text-muted-foreground">暂无已审核评论。</p>}
      </div>
    </section>
  );
}
