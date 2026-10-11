"use client";

import { useEffect, useRef } from "react";
import type { Link, ModalContent } from "@/lib/content";

type Props = {
  content: ModalContent;
  /** Shown as a badge when the section was opened by sinking a putt. */
  result: string | null;
  nextLabel: string;
  onClose: () => void;
  onNext: () => void;
};

const ext = (href: string) =>
  /^https?:/.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};

function A({ link, className }: { link: Link; className?: string }) {
  return (
    <a className={className} href={link.href} {...ext(link.href)}>
      {link.label}
    </a>
  );
}

export default function SectionModal({ content, result, nextLabel, onClose, onNext }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const f = ref.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    if (!f || !f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={onKeyDown}
    >
      <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="x" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-body">
          {result && <p className="badge">{result}</p>}
          <h2 id="modal-title">{content.title}</h2>
          {content.subtitle && <p className="modal-sub">{content.subtitle}</p>}

          {content.paragraphs?.map((p) => (
            <p key={p} className="para">{p}</p>
          ))}

          {content.items?.map((it) => (
            <article key={it.title} className="item">
              <div className="item-head">
                <h3>{it.title}</h3>
                {it.meta && <span className="meta">{it.meta}</span>}
              </div>
              {it.description && <p>{it.description}</p>}
              {it.tags && (
                <ul className="tags">
                  {it.tags.map((t) => (<li key={t}>{t}</li>))}
                </ul>
              )}
              {it.link && <A link={it.link} className="textlink" />}
            </article>
          ))}

          {content.links && (
            <ul className="links">
              {content.links.map((l) => (
                <li key={l.href}><A link={l} className="linkbtn" /></li>
              ))}
            </ul>
          )}
        </div>

        <footer className="modal-foot">
          {result ? (
            <>
              <button className="ghost" onClick={onClose}>Close</button>
              <button onClick={onNext} data-autofocus>{nextLabel}</button>
            </>
          ) : (
            <button onClick={onClose} data-autofocus>Close</button>
          )}
        </footer>
      </div>
    </div>
  );
}
