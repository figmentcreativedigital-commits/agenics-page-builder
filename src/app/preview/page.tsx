"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageRenderer } from "@/components/page/PageRenderer";
import "@/components/page/page.css";
import { activePage, useBuilder } from "@/lib/store";

export default function PreviewPage() {
  const [ready, setReady] = useState(false);
  const page = useBuilder((s) => activePage(s));

  useEffect(() => {
    Promise.resolve(useBuilder.persist.rehydrate()).then(() => {
      useBuilder.getState().seedIfEmpty();
      setReady(true);
    });
    // Keep the preview in step with edits made in the builder tab
    const onStorage = (e: StorageEvent) => {
      if (e.key === "agenics-page-builder:v1") useBuilder.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!ready) return <p style={{ padding: 40 }}>Loading preview…</p>;
  if (!page)
    return (
      <p style={{ padding: 40 }}>
        No page to preview. <Link href="/">Open the builder</Link>
      </p>
    );

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <PageRenderer page={page} editing={false} specs={false} />
    </div>
  );
}
