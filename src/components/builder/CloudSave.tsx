"use client";

import { useEffect, useState } from "react";
import { cloudName, setCloudName, signOut, syncNow, unlock, useCloud } from "@/lib/cloud";
import { useBuilder } from "@/lib/store";
import { Icon } from "./ui";

const time = (t: number) => new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/**
 * The save status in the top bar: a short word and an icon, with the detail in the tooltip.
 * Opens the passcode dialog when cloud save is available but off.
 */
export function SaveStatus() {
  const { status, lastSync, message } = useCloud();
  const savedAt = useBuilder((s) => s.savedAt);
  const [open, setOpen] = useState(false);

  let label = "Saved";
  let icon = "check";
  let detail = savedAt ? `Saved in this browser at ${time(savedAt)}` : "Saved in this browser";
  let tone = "";
  if (status === "syncing") {
    label = "Saving…";
    icon = "cloud";
    detail = "Saving to cloud";
  } else if (status === "saved") {
    icon = "cloud";
    detail = lastSync ? `Saved to cloud at ${time(lastSync)}. Everyone with the team passcode sees these pages.` : "Saved to cloud";
  } else if (status === "offline") {
    label = "Offline";
    icon = "cloudOff";
    detail = "No connection. Changes are saved in this browser and go to the cloud when you're back online.";
    tone = "is-warn";
  } else if (status === "error") {
    label = "Not saved to cloud";
    icon = "cloudOff";
    detail = message || "Cloud save stopped. Click to try again.";
    tone = "is-warn";
  } else if (status === "local") {
    detail = "Pages are saved in this browser. Cloud save isn't set up for this builder.";
  }

  const name = status === "saved" ? "Saved to cloud" : status === "local" || status === "locked" ? "Saved in this browser" : label;
  return (
    <>
      {status === "saved" || status === "offline" || status === "error" ? (
        <button
          type="button"
          className={`pb-saved pb-saved--btn ${tone}`}
          title={detail}
          aria-label={`${name}. ${detail}`}
          onClick={() => (status === "saved" ? setOpen(true) : void syncNow())}
        >
          <Icon name={icon} size={15} /> {label}
        </button>
      ) : (
        <span className={`pb-saved ${tone}`} title={detail} role="status" aria-label={name}>
          <Icon name={icon} size={15} /> {label}
        </span>
      )}
      {status === "locked" ? (
        <button
          type="button"
          className="pb-saved pb-saved--btn pb-saved--cloud"
          title="Saved in this browser only. Turn on cloud save so the whole team sees the same pages."
          aria-label="Saved in this browser · Turn on cloud save"
          data-cloud="off"
          onClick={() => setOpen(true)}
        >
          <Icon name="cloudOff" size={16} /> <span className="pb-wide">Turn on cloud save</span>
        </button>
      ) : null}
      {open ? <CloudDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function CloudDialog({ onClose }: { onClose: () => void }) {
  const status = useCloud((s) => s.status);
  const [code, setCode] = useState("");
  const [name, setName] = useState(() => cloudName());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  const on = status === "saved" || status === "syncing";
  return (
    <div className="pb-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="pb-dialog pb-dialog--sm" role="dialog" aria-modal="true" aria-labelledby="cloud-title">
        <div className="pb-dialog__head">
          <h2 id="cloud-title">{on ? "Cloud save is on" : "Turn on cloud save"}</h2>
          <button type="button" className="pb-mini" aria-label="Close" onClick={onClose} disabled={busy}>
            <Icon name="close" />
          </button>
        </div>
        {on ? (
          <>
            <p className="pb-share__lead">
              Pages you make or change save to the team&rsquo;s private storage as you work. Everyone who has entered the team passcode, at Figment and at Agenics, sees the same pages under Pages,
              with the name of whoever saved each one last. The examples stay in each browser until someone changes them.
            </p>
            <div className="pb-share__actions">
              <button type="button" className="pb-btn pb-btn--primary" onClick={onClose}>
                Done
              </button>
              <span className="pb-spacer" />
              <button
                type="button"
                className="pb-btn pb-btn--sm pb-btn--ghost"
                onClick={async () => {
                  await signOut();
                  onClose();
                }}
              >
                Turn off on this computer
              </button>
            </div>
          </>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!code.trim() || !name.trim()) return;
              setCloudName(name);
              setBusy(true);
              setError("");
              const err = await unlock(code);
              setBusy(false);
              if (err) setError(err);
              else onClose();
            }}
          >
            <p className="pb-share__lead">
              Save your pages to the team&rsquo;s private storage. Everyone with the passcode, at Figment and at Agenics, then sees the same pages on any computer, and nothing is lost if this
              browser is cleared. You only do this once per computer.
            </p>
            <label className="pb-field">
              <span className="pb-field__label">Your name</span>
              <input type="text" autoComplete="given-name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
              <span className="pb-field__help">Shown on the pages you save, so the team knows who changed what.</span>
            </label>
            <label className="pb-field">
              <span className="pb-field__label">Team passcode</span>
              <input type="password" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />
              <span className="pb-field__help">Ask whoever manages the page builder for it.</span>
            </label>
            {error ? (
              <div className="pb-share__error" role="alert">
                {error}
              </div>
            ) : null}
            <div className="pb-share__actions">
              <button type="submit" className="pb-btn pb-btn--cta" disabled={busy || !code.trim() || !name.trim()}>
                {busy ? "Turning on…" : "Turn on cloud save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
