"use client";

import type { ReactNode } from "react";
import type { ModuleInstance, PageDoc } from "@/lib/types";
import { ModuleProvider } from "./edit";
import { RENDERERS } from "./modules";

export function GlobalHeader() {
  return (
    <header className="agx-header">
      <div className="agx-wrap agx-header__inner">
        <a href="#" className="agx-header__logo" aria-label="Agenics Labs home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/agenics-logo-color.svg" alt="Agenics Labs" />
        </a>
        <nav className="agx-nav" aria-label="Main">
          <a href="#">Dental Water</a>
          <a href="#">Sterile Processing</a>
          <a href="#">Shop</a>
          <a href="#">Resources</a>
          <a href="#">About</a>
          <a href="#" className="agx-nav__pill">
            Test Results
          </a>
          <span className="agx-burger" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </nav>
      </div>
    </header>
  );
}

export function GlobalFooter() {
  return (
    <footer className="agx-footer">
      <div className="agx-wrap agx-footer__grid">
        <div className="agx-footer__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/agenics-logo-reversed.svg" alt="Agenics Labs" />
          <p>The trusted provider of water testing and analytics for the healthcare industry.</p>
          <p>862 Highway 105, Palmer Lake, CO 80133</p>
        </div>
        <div>
          <p className="agx-footer__h">Shop</p>
          <a href="#">Dental water tests</a>
          <a href="#">Sterile processing tests</a>
        </div>
        <div>
          <p className="agx-footer__h">Learn</p>
          <a href="#">Resource Library</a>
          <a href="#">Blog</a>
          <a href="#">Ask Agenics</a>
        </div>
        <div>
          <p className="agx-footer__h">Connect</p>
          <a href="#">About</a>
          <a href="#">For institutions</a>
          <a href="#">Test results</a>
        </div>
        <div>
          <p className="agx-footer__h">Support</p>
          <a href="tel:+17194665592">719-466-5592</a>
          <a href="mailto:support@agenics.net">support@agenics.net</a>
        </div>
      </div>
      <div className="agx-wrap agx-footer__legal">
        <span>© Agenics Labs, LLC</span>
        <span>
          <a href="#">Privacy</a> <a href="#">Terms</a>
        </span>
      </div>
    </footer>
  );
}

export function ModuleView({ mod, editing, specs }: { mod: ModuleInstance; editing: boolean; specs: boolean }) {
  const Render = RENDERERS[mod.type];
  return (
    <ModuleProvider
      value={{
        uid: mod.uid,
        type: mod.type,
        variant: mod.variant,
        data: mod.data,
        hidden: mod.hidden,
        style: mod.style,
        anchor: mod.anchor,
        editing,
        specs,
      }}
    >
      <Render />
    </ModuleProvider>
  );
}

export function PageRenderer({
  page,
  editing,
  specs,
  wrap,
  globalWrap,
}: {
  page: PageDoc;
  editing: boolean;
  specs: boolean;
  wrap?: (mod: ModuleInstance, index: number, node: ReactNode) => ReactNode;
  globalWrap?: (kind: "header" | "footer", node: ReactNode) => ReactNode;
}) {
  const gw = globalWrap ?? ((_k, n) => n);
  return (
    <div className={`agx ${editing ? "agx--edit" : ""} ${specs && editing ? "agx--specs" : ""}`}>
      {gw("header", <GlobalHeader />)}
      <main>
        {page.modules.map((m, i) => {
          const node = <ModuleView key={m.uid} mod={m} editing={editing} specs={specs} />;
          return wrap ? wrap(m, i, node) : node;
        })}
      </main>
      {gw("footer", <GlobalFooter />)}
    </div>
  );
}
