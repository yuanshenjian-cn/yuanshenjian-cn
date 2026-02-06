"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Check, Link2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

// 微博分享
function shareToWeibo(url: string, title: string) {
  const shareUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  window.open(shareUrl, "_blank", "width=600,height=400");
}

// Twitter 分享
function shareToTwitter(url: string, title: string) {
  const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  window.open(shareUrl, "_blank", "width=600,height=400");
}

// LinkedIn 分享
function shareToLinkedIn(url: string, _title: string) {
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  window.open(shareUrl, "_blank", "width=600,height=400");
}

// 复制链接
async function copyToClipboard(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

export function ShareButtons({ url, title, description, className }: ShareButtonsProps) {
  const [showWeChatModal, setShowWeChatModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // 生成二维码
  useEffect(() => {
    if (showWeChatModal && !qrCodeDataUrl) {
      import("qrcode").then((QRCode) => {
        QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        }).then((dataUrl: string) => {
          setQrCodeDataUrl(dataUrl);
        });
      });
    }
  }, [showWeChatModal, url, qrCodeDataUrl]);

  // 处理复制链接
  const handleCopyLink = useCallback(async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="text-xs text-muted-foreground mr-1">分享到：</span>

      {/* 微信分享 */}
      <button
        onClick={() => setShowWeChatModal(true)}
        className="flex items-center justify-center w-7 h-7 rounded-full bg-[#07C160] text-white hover:bg-[#06ae56] transition-colors"
        title="分享到微信"
        aria-label="分享到微信"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89l-.007-.032zM13.12 12.05c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
        </svg>
      </button>

      {/* 微博分享 */}
      <button
        onClick={() => shareToWeibo(url, title)}
        className="flex items-center justify-center w-7 h-7 rounded-full bg-[#E6162D] text-white hover:bg-[#d11429] transition-colors"
        title="分享到微博"
        aria-label="分享到微博"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.573h.014zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.581-.18-.405-.656.389-1.061.43-1.979.007-2.631-.793-1.222-2.962-1.156-5.46-.034 0 0-.783.343-.583-.279.383-1.215.324-2.234-.271-2.822-1.349-1.33-4.937.045-8.013 3.073C1.154 10.784 0 13.063 0 15.025c0 3.758 4.822 6.052 9.537 6.052 6.185 0 10.301-3.592 10.301-6.442 0-1.72-1.45-2.695-2.779-2.986h.001zm.102-5.63c.654-.772.549-1.912-.234-2.545-.779-.635-1.928-.526-2.582.246-.654.771-.549 1.911.234 2.544.779.636 1.927.527 2.582-.245zm2.855.465c1.368-1.617 1.149-4.004-.488-5.334-1.642-1.335-4.068-1.108-5.437.509-1.367 1.618-1.149 4.007.489 5.337 1.643 1.333 4.067 1.108 5.436-.512z" />
        </svg>
      </button>

      {/* Twitter 分享 */}
      <button
        onClick={() => shareToTwitter(url, title)}
        className="flex items-center justify-center w-7 h-7 rounded-full bg-[#1DA1F2] text-white hover:bg-[#1a91da] transition-colors"
        title="分享到 Twitter"
        aria-label="分享到 Twitter"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>

      {/* LinkedIn 分享 */}
      <button
        onClick={() => shareToLinkedIn(url, title)}
        className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0A66C2] text-white hover:bg-[#0958a8] transition-colors"
        title="分享到 LinkedIn"
        aria-label="分享到 LinkedIn"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-3.5 h-3.5"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </button>

      {/* 复制链接 */}
      <button
        onClick={handleCopyLink}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors",
          copied
            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            : "bg-muted hover:bg-muted/80 text-muted-foreground"
        )}
        title="复制链接"
        aria-label="复制链接"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3" />
            <span>已复制</span>
          </>
        ) : (
          <>
            <Link2 className="w-3 h-3" />
            <span>复制</span>
          </>
        )}
      </button>

      {/* 微信二维码弹窗 */}
      {showWeChatModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowWeChatModal(false)}
        >
          <div
            className="relative bg-card border rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setShowWeChatModal(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="关闭"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* 标题 */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">分享到微信</h3>
              <p className="text-sm text-muted-foreground mt-1">
                打开微信扫一扫，分享至好友或朋友圈
              </p>
            </div>

            {/* 二维码 */}
            <div className="flex justify-center mb-4">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="微信分享二维码"
                  className="w-48 h-48 rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 rounded-lg bg-muted flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* 文章信息 */}
            <div className="text-center">
              <p className="text-sm font-medium truncate">{title}</p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {description}
                </p>
              )}
            </div>

            {/* 提示 */}
            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
              扫描二维码后，在微信内点击右上角「···」进行分享
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
