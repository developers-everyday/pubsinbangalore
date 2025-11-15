"use client";

import { useCallback, useMemo, useState } from "react";

interface ShareLinkSectionProps {
  pubName: string;
  localityName: string | null;
  slug: string;
  description?: string | null;
  rating?: number | null;
}

const hasNavigator = typeof navigator !== "undefined";
const supportsNativeShare = hasNavigator && typeof navigator.share === "function";

export function ShareLinkSection({
  pubName,
  localityName,
  slug,
  description,
  rating,
}: ShareLinkSectionProps) {
  const [copied, setCopied] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pubsinbangalore.com";
  const shareUrl = `${baseUrl}/pubs/${slug}`;
  const supportsClipboard =
    hasNavigator &&
    Boolean(navigator.clipboard) &&
    typeof navigator.clipboard.writeText === "function";

  const message = useMemo(() => {
    const localityText = localityName ?? "Bangalore";
    const intro = `Hey! Check out ${pubName} in ${localityText} – perfect for tonight.`;
    const vibe = description ? `\n${description}` : rating ? `\nRated ${rating.toFixed(1)}/5 by locals.` : "";
    return `${intro}${vibe}\n\nFull details + map: ${shareUrl}`;
  }, [description, localityName, pubName, rating, shareUrl]);

  const handleCopy = useCallback(async () => {
    try {
      if (supportsClipboard) {
        await navigator.clipboard.writeText(message);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = message;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      console.error("Failed to copy share message", error);
    }
  }, [message, supportsClipboard]);

  const handleCopyAndShare = useCallback(async () => {
    await handleCopy();

    if (supportsNativeShare) {
      try {
        await navigator.share({
          title: pubName,
          text: message,
          url: shareUrl,
        });
      } catch (error) {
        console.warn("Native share cancelled or failed", error);
      }
    }
  }, [handleCopy, message, pubName, shareUrl]);

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">Share</p>
          <h2 className="text-lg font-semibold text-slate-900">Invite friends to {pubName}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Copy the message below or share directly via WhatsApp. Works great in group chats.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <button
            type="button"
            onClick={handleCopyAndShare}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-600"
          >
            <ShareIcon className="h-4 w-4 text-emerald-500" />
            {copied ? "Copied!" : "Copy & Share"}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            <WhatsAppIcon className="h-4 w-4 text-emerald-950" />
            Share on WhatsApp
          </a>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-700 whitespace-pre-line">{message}</p>
      </div>
    </section>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v13" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M20.52 3.48A11.72 11.72 0 0 0 12.04 0h-.09A11.95 11.95 0 0 0 1.09 18.4L0 24l5.73-1.49a11.94 11.94 0 0 0 6.27 1.72h.05a11.96 11.96 0 0 0 11.94-11.94 11.88 11.88 0 0 0-3.47-8.81ZM12 21.28h-.04a9.7 9.7 0 0 1-5-1.4l-.36-.21-3.4.89.9-3.32-.23-.34a9.69 9.69 0 1 1 8.13 4.38Zm5.28-7.25c-.29-.15-1.71-.84-1.98-.94s-.46-.15-.65.15-.75.94-.92 1.13-.34.22-.63.07a7.89 7.89 0 0 1-2.33-1.44 8.72 8.72 0 0 1-1.62-2.02c-.17-.29 0-.45.13-.6s.29-.34.44-.52a2 2 0 0 0 .29-.48.53.53 0 0 0-.03-.52c-.07-.15-.63-1.52-.86-2.09s-.46-.47-.63-.48h-.54a1 1 0 0 0-.72.33 3 3 0 0 0-.94 2.24 5.25 5.25 0 0 0 1.1 2.8 11.93 11.93 0 0 0 4.58 4 15.69 15.69 0 0 0 1.55.57 3.74 3.74 0 0 0 1.72.11 2.81 2.81 0 0 0 1.85-1.3 2.29 2.29 0 0 0 .16-1.3c-.06-.12-.26-.19-.55-.34Z" />
    </svg>
  );
}

