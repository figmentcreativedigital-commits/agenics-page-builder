import type { Metadata } from "next";
import { Suspense } from "react";
import { SharedPreview } from "@/components/share/SharedPreview";
import "@/components/share/share.css";
import { loadJson } from "@/lib/share-store";
import { shareKey, validId, type ShareDoc } from "@/lib/share-server";
import { upgradePage } from "@/lib/upgrade";

export const metadata: Metadata = {
  title: "Page preview · Agenics Labs",
  robots: { index: false, follow: false },
};

function Missing() {
  return (
    <div className="sv-missing">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/agenics-logo-color.svg" alt="Agenics Labs" width={180} />
        <h1>This preview link isn’t active</h1>
        <p>It may have been turned off or replaced. Ask the person who sent it for a new link.</p>
      </div>
    </div>
  );
}

async function Shared({ id }: { id: string }) {
  if (!validId(id)) return <Missing />;
  const doc = await loadJson<ShareDoc>(shareKey(id));
  if (!doc?.page) return <Missing />;
  const updated = new Date(doc.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
  // Links shared from an older version of the builder open in today's form
  return <SharedPreview page={upgradePage(doc.page)} updated={updated} />;
}

export default function SharePage({ params }: PageProps<"/share/[id]">) {
  return (
    <Suspense fallback={<div className="sv" aria-busy="true" />}>
      {params.then(({ id }) => (
        <Shared id={id} />
      ))}
    </Suspense>
  );
}
