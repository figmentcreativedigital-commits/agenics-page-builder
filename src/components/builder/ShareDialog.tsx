"use client";

import { useEffect, useRef, useState } from "react";
import { saveVersion } from "@/lib/history";
import { ShareError, publishShare, stopShare } from "@/lib/share";
import { activePage, useBuilder } from "@/lib/store";
import { Icon } from "./ui";

const when = (t: number) =>
  new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Create, copy, update or turn off a page's preview link. */
export function ShareDialog({ onClose }: { onClose: () => void }) {
  const page = useBuilder((s) => activePage(s));
  const setShare = useBuilder((s) => s.setShare);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<ShareError | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  if (!page) return null;
  const share = page.share;
  const stale = !!share && page.updatedAt > share.publishedAt;

  const publish = async () => {
    setError(null);
    setBusy("Getting the page ready…");
    try {
      const info = await publishShare(page, setBusy);
      // Compare against this browser's clock, which also stamps the page's edits
      setShare(page.id, { ...info, publishedAt: Date.now() });
      saveVersion(page, share ? "Preview link updated" : "Preview link created", false);
    } catch (e) {
      setError(e instanceof ShareError ? e : new ShareError("Something went wrong. Try again."));
    } finally {
      setBusy(null);
    }
  };

  const stop = async () => {
    if (!share) return;
    setError(null);
    setBusy("Turning off the link…");
    try {
      await stopShare(share);
      setShare(page.id, undefined);
      setConfirmStop(false);
    } catch (e) {
      setError(e instanceof ShareError ? e : new ShareError("Something went wrong. Try again."));
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.url);
    } catch {
      input.current?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pb-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="pb-dialog pb-dialog--sm pb-share" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <div className="pb-dialog__head">
          <h2 id="share-title">Share a preview</h2>
          <button type="button" className="pb-mini" aria-label="Close" onClick={onClose} disabled={!!busy}>
            <Icon name="close" />
          </button>
        </div>

        {share ? (
          <>
            <p className="pb-share__lead">Anyone with this link can view “{page.name}”. They can’t edit it.</p>
            <div className="pb-share__link">
              <input ref={input} readOnly value={share.url} aria-label="Preview link" onFocus={(e) => e.target.select()} />
              <button type="button" className="pb-btn pb-btn--primary" onClick={copy}>
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
            <div className={`pb-share__status ${stale ? "is-stale" : ""}`}>
              <Icon name={stale ? "note" : "review"} size={16} />
              {stale ? (
                <span>
                  You’ve made changes since {when(share.publishedAt)}. People with the link still see the earlier version.
                </span>
              ) : (
                <span>Up to date · published {when(share.publishedAt)}</span>
              )}
            </div>
            <div className="pb-share__actions">
              {stale ? (
                <button type="button" className="pb-btn pb-btn--cta" onClick={publish} disabled={!!busy}>
                  Update the link
                </button>
              ) : null}
              <a className="pb-btn" href={share.url} target="_blank" rel="noreferrer">
                Open preview
              </a>
              <span className="pb-spacer" />
              {confirmStop ? (
                <>
                  <button type="button" className="pb-btn pb-btn--sm pb-btn--danger" onClick={stop} disabled={!!busy}>
                    Yes, turn it off
                  </button>
                  <button type="button" className="pb-btn pb-btn--sm" onClick={() => setConfirmStop(false)}>
                    Keep
                  </button>
                </>
              ) : (
                <button type="button" className="pb-btn pb-btn--sm pb-btn--ghost" onClick={() => setConfirmStop(true)} disabled={!!busy}>
                  Stop sharing
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="pb-share__lead">
              Make a link to this page that anyone can open, on any device. They see it as visitors would and can’t edit it.
            </p>
            <ul className="pb-share__points">
              <li>The link shows the page as it is when you publish. Change the page, then click Update to refresh it.</li>
              <li>Only this browser can update or turn off the link.</li>
            </ul>
            <div className="pb-share__actions">
              <button type="button" className="pb-btn pb-btn--cta" onClick={publish} disabled={!!busy}>
                <Icon name="link" size={16} /> Create link
              </button>
            </div>
          </>
        )}

        {busy ? (
          <p className="pb-share__busy" role="status">
            <span className="pb-spin" aria-hidden="true" /> {busy}
          </p>
        ) : null}
        {error ? (
          <div className="pb-share__error" role="alert">
            <b>{error.code === "not-configured" ? "Sharing isn’t switched on yet." : "That didn’t work."}</b> {error.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
